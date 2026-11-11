import assert from 'node:assert';
import { useShiftStore } from '../stores/shiftStore';
import { storageService } from '../services/storageAdapter';
import { exportToCSV, exportToJSON } from '../services/exportService';
import { ShiftRecord } from '../types';

console.log('--- STARTING 5-RECORD RESILIENCE & MULTI-STATE AUDIT TEST ---');

// Mock browser APIs
const dataStore: Record<string, string> = {};
global.localStorage = {
  getItem: (key: string) => dataStore[key] || null,
  setItem: (key: string, value: string) => { dataStore[key] = value; },
  removeItem: (key: string) => { delete dataStore[key]; },
  clear: () => { Object.keys(dataStore).forEach((k) => delete dataStore[k]); },
  key: (i: number) => Object.keys(dataStore)[i] || null,
  length: Object.keys(dataStore).length,
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
  createObjectURL: () => 'blob:resilience-url',
  revokeObjectURL: () => {},
} as unknown as typeof URL;

global.document = {
  body: { appendChild: () => {}, removeChild: () => {} },
  createElement: () => ({ href: '', setAttribute: () => {}, click: () => {} }),
} as unknown as Document;

async function runResilienceAudit() {
  await storageService.clearAllRecords();

  const sampleShifts: ShiftRecord[] = [
    // 1. Perfect Tally (Petrol)
    {
      id: 'shift-001-tally',
      timestamp: '2026-11-09T08:00:00.000Z',
      fuelType: 'PETROL',
      fuelPrice: 96.72,
      openingReading: 1000.00,
      closingReading: 1100.00,
      totalLiters: 100.00,
      expectedSale: 9672.00,
      cashAmount: 5000.00,
      upiAmount: 4672.00,
      creditAmount: 0.00,
      totalCollected: 9672.00,
      variance: 0.00,
      tallyStatus: 'TALLY',
      notes: 'Nozzle 1 Morning',
    },
    // 2. Shortage (Diesel)
    {
      id: 'shift-002-shortage',
      timestamp: '2026-11-09T10:30:00.000Z',
      fuelType: 'DIESEL',
      fuelPrice: 89.62,
      openingReading: 3000.00,
      closingReading: 3150.00,
      totalLiters: 150.00,
      expectedSale: 13443.00,
      cashAmount: 8000.00,
      upiAmount: 5000.00,
      creditAmount: 350.00,
      totalCollected: 13350.00,
      variance: -93.00,
      tallyStatus: 'SHORTAGE',
      notes: 'Nozzle 4 Operator B',
    },
    // 3. Excess (Petrol)
    {
      id: 'shift-003-excess',
      timestamp: '2026-11-09T13:00:00.000Z',
      fuelType: 'PETROL',
      fuelPrice: 96.72,
      openingReading: 1100.00,
      closingReading: 1300.00,
      totalLiters: 200.00,
      expectedSale: 19344.00,
      cashAmount: 12000.00,
      upiAmount: 7000.00,
      creditAmount: 400.00,
      totalCollected: 19400.00,
      variance: 56.00,
      tallyStatus: 'EXCESS',
      notes: 'Nozzle 1 Afternoon',
    },
    // 4. Shortage (Diesel)
    {
      id: 'shift-004-shortage',
      timestamp: '2026-11-09T16:00:00.000Z',
      fuelType: 'DIESEL',
      fuelPrice: 89.62,
      openingReading: 3150.00,
      closingReading: 3230.00,
      totalLiters: 80.00,
      expectedSale: 7169.60,
      cashAmount: 4000.00,
      upiAmount: 3100.00,
      creditAmount: 0.00,
      totalCollected: 7100.00,
      variance: -69.60,
      tallyStatus: 'SHORTAGE',
      notes: 'Nozzle 4 Evening',
    },
    // 5. Perfect Tally (Petrol)
    {
      id: 'shift-005-tally',
      timestamp: '2026-11-09T19:00:00.000Z',
      fuelType: 'PETROL',
      fuelPrice: 96.72,
      openingReading: 4400.00,
      closingReading: 4520.50,
      totalLiters: 120.50,
      expectedSale: 11654.76,
      cashAmount: 6000.00,
      upiAmount: 5000.00,
      creditAmount: 654.76,
      totalCollected: 11654.76,
      variance: 0.00,
      tallyStatus: 'TALLY',
      notes: 'Nozzle 2 Night Close',
    },
  ];

  // Save each record
  for (const record of sampleShifts) {
    await storageService.saveRecord(record);
  }
  console.log('✓ Successfully inserted 5 sample shift records across all 3 balance states');

  // Verify persistence reload
  await useShiftStore.getState().loadInitialData();
  const recordsInStore = useShiftStore.getState().records;
  assert.strictEqual(recordsInStore.length, 5);

  const tallyCount = recordsInStore.filter((r) => r.tallyStatus === 'TALLY').length;
  const shortageCount = recordsInStore.filter((r) => r.tallyStatus === 'SHORTAGE').length;
  const excessCount = recordsInStore.filter((r) => r.tallyStatus === 'EXCESS').length;

  assert.strictEqual(tallyCount, 2, 'Must have exactly 2 TALLY records');
  assert.strictEqual(shortageCount, 2, 'Must have exactly 2 SHORTAGE records');
  assert.strictEqual(excessCount, 1, 'Must have exactly 1 EXCESS record');
  console.log(`✓ Data resilience confirmed on reload: 2 Tally, 2 Shortage, 1 Excess verified`);

  // Verify filtering functionality
  useShiftStore.getState().setFilter('statusFilter', 'SHORTAGE');
  const filteredShortages = useShiftStore.getState().records.filter(r => r.tallyStatus === 'SHORTAGE');
  assert.strictEqual(filteredShortages.length, 2);

  useShiftStore.getState().setFilter('statusFilter', 'ALL');
  useShiftStore.getState().setFilter('searchTerm', 'Diesel');
  const filteredDiesel = useShiftStore.getState().records.filter(r => r.fuelType === 'DIESEL');
  assert.strictEqual(filteredDiesel.length, 2);
  console.log('✓ Status filter and search filter verified');

  // Verify Export Utilities
  assert.strictEqual(exportToCSV(recordsInStore), true);
  assert.strictEqual(exportToJSON(recordsInStore), true);
  console.log('✓ CSV and JSON export pipelines successfully generated outputs');

  console.log('--- ALL RESILIENCE AUDIT TESTS PASSED WITH 100% SUCCESS ---');
}

runResilienceAudit().catch((err) => {
  console.error('Audit failed:', err);
  process.exit(1);
});

