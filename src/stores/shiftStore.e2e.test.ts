import assert from 'node:assert';
import { useShiftStore } from './shiftStore';
import { exportToCSV } from '../services/exportService';

console.log('--- STARTING PHASE 4 END-TO-END FLOW TESTS ---');

// Mock browser APIs
const storageMap: Record<string, string> = {};
global.localStorage = {
  getItem: (key: string) => storageMap[key] || null,
  setItem: (key: string, value: string) => { storageMap[key] = value; },
  removeItem: (key: string) => { delete storageMap[key]; },
  clear: () => { Object.keys(storageMap).forEach((k) => delete storageMap[k]); },
  key: (i: number) => Object.keys(storageMap)[i] || null,
  length: Object.keys(storageMap).length,
};

global.Blob = class MockBlob {
  parts: unknown[];
  type: string;
  constructor(parts: unknown[], options: { type: string }) {
    this.parts = parts;
    this.type = options?.type || '';
  }
} as unknown as typeof Blob;

global.URL = {
  createObjectURL: () => 'blob:mock-url',
  revokeObjectURL: () => {},
} as unknown as typeof URL;

const mockDocument = {
  body: {
    appendChild: () => {},
    removeChild: () => {},
  },
  createElement: () => ({
    href: '',
    setAttribute: () => {},
    click: () => {},
  }),
};
global.document = mockDocument as unknown as Document;

async function testEndToEnd() {
  // Step 1: Input shift data
  const store = useShiftStore.getState();
  store.updateInputField('openingReading', '5000.00');
  store.updateInputField('closingReading', '5150.00'); // 150 liters
  store.updateInputField('cashAmount', '10000.00');
  store.updateInputField('upiAmount', '4000.00');
  store.updateInputField('creditAmount', '508.00');
  store.updateInputField('notes', 'Pump Nozzle 03 Shift 1');

  // Step 2: Auto Calculation Check
  const stateAfterInput = useShiftStore.getState();
  assert.strictEqual(stateAfterInput.calculations.totalLiters, 150.00);
  assert.strictEqual(stateAfterInput.calculations.expectedSale, 14508.00); // 150 * 96.72
  assert.strictEqual(stateAfterInput.calculations.totalCollected, 14508.00);
  assert.strictEqual(stateAfterInput.calculations.variance, 0.00);
  assert.strictEqual(stateAfterInput.calculations.tallyStatus, 'TALLY');
  console.log('✓ Step 1 & 2: Input and Real-time Auto-calculation verified');

  // Step 3: Validation Error Trigger
  store.updateInputField('closingReading', '4800.00'); // Closing < Opening
  const stateInvalid = useShiftStore.getState();
  assert.strictEqual(stateInvalid.calculations.isValid, false);
  assert.ok(stateInvalid.errorMessage?.includes('less than opening reading'));
  console.log('✓ Step 3: Invariant validation trigger verified (error raised, save disabled)');

  // Fix back to valid
  store.updateInputField('closingReading', '5150.00');
  assert.strictEqual(useShiftStore.getState().calculations.isValid, true);

  // Step 4: Open Confirm Modal & Commit Shift
  useShiftStore.getState().setConfirmModalOpen(true);
  assert.strictEqual(useShiftStore.getState().isConfirmModalOpen, true);

  const saveOk = await useShiftStore.getState().commitRecordToStorage();
  assert.strictEqual(saveOk, true);

  const stateCommitted = useShiftStore.getState();
  assert.strictEqual(stateCommitted.records.length, 1);
  assert.strictEqual(stateCommitted.records[0].totalLiters, 150.00);
  assert.strictEqual(stateCommitted.records[0].expectedSale, 14508.00);
  assert.strictEqual(stateCommitted.form.openingReading, ''); // Inputs reset
  assert.strictEqual(stateCommitted.toast?.type, 'success');
  console.log('✓ Step 4: Shift confirmed, persisted to ledger, toast surfaced, form reset');

  // Step 5: Test Delete Modal & Confirmation
  const recordToDelete = stateCommitted.records[0];
  useShiftStore.getState().setDeleteRecordTarget(recordToDelete);
  assert.strictEqual(useShiftStore.getState().deleteRecordTarget?.id, recordToDelete.id);

  await useShiftStore.getState().removeRecord(recordToDelete.id);
  const stateDeleted = useShiftStore.getState();
  assert.strictEqual(stateDeleted.records.length, 0);
  assert.strictEqual(stateDeleted.deleteRecordTarget, null);
  console.log('✓ Step 5: Delete confirmation & removal from storage verified');

  // Step 6: CSV Export utility
  const csvSuccess = exportToCSV([recordToDelete]);
  assert.strictEqual(csvSuccess, true);
  console.log('✓ Step 6: CSV export utility formatted data and triggered download');

  console.log('--- ALL PHASE 4 END-TO-END FLOW TESTS PASSED! ---');
}

testEndToEnd().catch((err) => {
  console.error('E2E Test Failed:', err);
  process.exit(1);
});
