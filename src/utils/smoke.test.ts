import assert from 'node:assert';
import { calculateShift } from './calculations';
import { useShiftStore } from '../stores/shiftStore';
import { storageService } from '../services/storageAdapter';

console.log('--- STARTING PHASE 5.1 SMOKE & MATH TESTS ---');

// Mock localStorage environment
const persistenceMap: Record<string, string> = {};
global.localStorage = {
  getItem: (key: string) => persistenceMap[key] || null,
  setItem: (key: string, value: string) => { persistenceMap[key] = value; },
  removeItem: (key: string) => { delete persistenceMap[key]; },
  clear: () => { Object.keys(persistenceMap).forEach((k) => delete persistenceMap[k]); },
  key: (i: number) => Object.keys(persistenceMap)[i] || null,
  length: Object.keys(persistenceMap).length,
};

// 1. Standard Tally Calculation Test
// (Opening: 1000, Closing: 1100, Rate: 100 -> 100L, ₹10,000 expected, Handover: ₹10,000 -> Perfect Tally)
const smokeCalculation = calculateShift({
  fuelType: 'PETROL',
  fuelPrice: 100.00,
  openingReading: '1000',
  closingReading: '1100',
  cashAmount: '6000',
  upiAmount: '3000',
  creditAmount: '1000',
  notes: 'Smoke Test Shift'
});

assert.strictEqual(smokeCalculation.isValid, true);
assert.strictEqual(smokeCalculation.totalLiters, 100.00);
assert.strictEqual(smokeCalculation.expectedSale, 10000.00);
assert.strictEqual(smokeCalculation.totalCollected, 10000.00);
assert.strictEqual(smokeCalculation.variance, 0.00);
assert.strictEqual(smokeCalculation.tallyStatus, 'TALLY');
console.log('✓ 5.1.1: Standard tally calculation verified (100L sold @ ₹100 = ₹10,000 expected, ₹10,000 collected -> TALLY)');

// 2. Validation Trigger Test (Closing < Opening)
const invalidShift = calculateShift({
  fuelType: 'PETROL',
  fuelPrice: 100.00,
  openingReading: '1100',
  closingReading: '1000',
  cashAmount: '5000',
  upiAmount: '5000',
  creditAmount: '0',
});

assert.strictEqual(invalidShift.isValid, false);
assert.strictEqual(invalidShift.totalLiters, 0);
assert.strictEqual(invalidShift.expectedSale, 0);
assert.ok(invalidShift.errorMessage?.includes('less than opening reading'));

// Verify store state disables save when invalid
useShiftStore.getState().updateInputField('openingReading', '1100');
useShiftStore.getState().updateInputField('closingReading', '1000');
assert.strictEqual(useShiftStore.getState().calculations.isValid, false);
assert.ok(useShiftStore.getState().errorMessage !== null);
console.log('✓ 5.1.2: Validation trigger verified (Closing < Opening triggers error state and blocks commit)');

// 3. Multi-record Persistence Test (Add 2 shifts, simulate reload -> records remain intact)
async function testPersistence() {
  await storageService.clearAllRecords();

  // Shift 1
  const shift1 = {
    id: 'shift_smoke_001',
    timestamp: new Date().toISOString(),
    fuelType: 'PETROL' as const,
    fuelPrice: 96.72,
    openingReading: 1000,
    closingReading: 1100,
    totalLiters: 100,
    expectedSale: 9672,
    cashAmount: 5000,
    upiAmount: 4672,
    creditAmount: 0,
    totalCollected: 9672,
    variance: 0,
    tallyStatus: 'TALLY' as const,
    notes: 'Shift 1'
  };

  // Shift 2
  const shift2 = {
    id: 'shift_smoke_002',
    timestamp: new Date().toISOString(),
    fuelType: 'DIESEL' as const,
    fuelPrice: 89.62,
    openingReading: 2000,
    closingReading: 2200,
    totalLiters: 200,
    expectedSale: 17924,
    cashAmount: 10000,
    upiAmount: 7924,
    creditAmount: 0,
    totalCollected: 17924,
    variance: 0,
    tallyStatus: 'TALLY' as const,
    notes: 'Shift 2'
  };

  await storageService.saveRecord(shift1);
  await storageService.saveRecord(shift2);

  // Simulate app restart / reload by calling loadInitialData on a fresh store query
  await useShiftStore.getState().loadInitialData();
  const loadedStoreRecords = useShiftStore.getState().records;

  assert.strictEqual(loadedStoreRecords.length, 2);
  assert.strictEqual(loadedStoreRecords.some(r => r.id === 'shift_smoke_001'), true);
  assert.strictEqual(loadedStoreRecords.some(r => r.id === 'shift_smoke_002'), true);
  console.log('✓ 5.1.3: Multi-record persistence verified (2 shifts persisted and fully restored on reload)');

  console.log('--- ALL PHASE 5.1 SMOKE & MATH TESTS PASSED! ---');
}

testPersistence().catch(err => {
  console.error('Smoke test failed:', err);
  process.exit(1);
});

