import assert from 'node:assert';
import { useShiftStore } from './shiftStore';
import { storageService } from '../services/storageAdapter';

console.log('--- STARTING ZUSTAND STORE & PERSISTENCE TESTS ---');

// Mock localStorage for node environment test
const mockLocalStorage: Record<string, string> = {};
global.localStorage = {
  getItem: (key: string) => mockLocalStorage[key] || null,
  setItem: (key: string, value: string) => { mockLocalStorage[key] = value; },
  removeItem: (key: string) => { delete mockLocalStorage[key]; },
  clear: () => { Object.keys(mockLocalStorage).forEach((k) => delete mockLocalStorage[k]); },
  key: (i: number) => Object.keys(mockLocalStorage)[i] || null,
  length: Object.keys(mockLocalStorage).length,
};

// 1. Initial State verification
const state1 = useShiftStore.getState();
assert.strictEqual(state1.form.fuelType, 'PETROL');
assert.strictEqual(state1.form.fuelPrice, 96.72);
assert.strictEqual(state1.calculations.isValid, true);
assert.strictEqual(state1.calculations.totalLiters, 0);
assert.strictEqual(state1.errorMessage, null);
console.log('✓ Store initial state verified');

// 2. updateInputField with immediate recalculation
useShiftStore.getState().updateInputField('openingReading', '1000');
useShiftStore.getState().updateInputField('closingReading', '1100');
const state2 = useShiftStore.getState();
assert.strictEqual(state2.calculations.totalLiters, 100);
assert.strictEqual(state2.calculations.expectedSale, 9672.00);
assert.strictEqual(state2.errorMessage, null);
console.log('✓ updateInputField immediate recalculation verified');

// 3. Validation guardrail (Closing < Opening)
useShiftStore.getState().updateInputField('closingReading', '950');
const state3 = useShiftStore.getState();
assert.strictEqual(state3.calculations.isValid, false);
assert.ok(state3.errorMessage?.includes('less than opening reading'));
console.log('✓ Validation guardrail & error message set correctly');

// 4. Correction and collection addition
useShiftStore.getState().updateInputField('closingReading', '1100');
useShiftStore.getState().updateInputField('cashAmount', '5000');
useShiftStore.getState().updateInputField('upiAmount', '4672');
const state4 = useShiftStore.getState();
assert.strictEqual(state4.calculations.totalCollected, 9672.00);
assert.strictEqual(state4.calculations.variance, 0.00);
assert.strictEqual(state4.calculations.tallyStatus, 'TALLY');
console.log('✓ Tally calculation matches expected amount');

// 5. Commit record to storage
async function runAsyncTests() {
  const commitSuccess = await useShiftStore.getState().commitRecordToStorage();
  assert.strictEqual(commitSuccess, true);
  const state5 = useShiftStore.getState();
  assert.strictEqual(state5.records.length, 1);
  assert.strictEqual(state5.records[0].totalLiters, 100);
  assert.strictEqual(state5.records[0].totalCollected, 9672.00);
  assert.strictEqual(state5.form.openingReading, ''); // verified form was reset
  console.log('✓ commitRecordToStorage successfully persisted record & reset form');

  // Verify storageService has the record
  const storedRecords = await storageService.fetchRecords();
  assert.strictEqual(storedRecords.length, 1);
  assert.strictEqual(storedRecords[0].id, state5.records[0].id);
  console.log('✓ Storage adapter fetchRecords successfully loaded committed record');

  // 6. Remove record
  await useShiftStore.getState().removeRecord(state5.records[0].id);
  const state6 = useShiftStore.getState();
  assert.strictEqual(state6.records.length, 0);
  const storedAfterDelete = await storageService.fetchRecords();
  assert.strictEqual(storedAfterDelete.length, 0);
  console.log('✓ removeRecord deleted record from store and storage adapter');

  // 7. Update rates
  await useShiftStore.getState().updateRates({ petrolPrice: 98.50 });
  const state7 = useShiftStore.getState();
  assert.strictEqual(state7.rates.petrolPrice, 98.50);
  assert.strictEqual(state7.form.fuelPrice, 98.50);
  console.log('✓ updateRates updated store and active form rate');

  // 8. Fuel type toggle
  useShiftStore.getState().setFuelType('DIESEL');
  const state8 = useShiftStore.getState();
  assert.strictEqual(state8.form.fuelType, 'DIESEL');
  assert.strictEqual(state8.form.fuelPrice, state8.rates.dieselPrice);
  console.log('✓ setFuelType switched fuel and synced default rate');

  console.log('--- ALL ZUSTAND STORE & PERSISTENCE TESTS PASSED! ---');
}

runAsyncTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});

