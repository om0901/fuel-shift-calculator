import assert from 'node:assert';
import {
  roundToTwo,
  parseNonNegativeNumber,
  calculateLiterDifference,
  calculateExpectedAmount,
  calculateCollectionSum,
  calculateVariance,
  evaluateTallyStatus,
  calculateShift,
  validateShiftInput,
} from './calculations';
import { formatINR, formatLiters, formatVarianceLabel, getStatusBadgeStyle } from './currency';

console.log('--- STARTING UNIT TESTS FOR PHASE 2 MATH & ENGINE ---');

// 1. Precision & parsing tests
assert.strictEqual(roundToTwo(0.1 + 0.2), 0.3);
assert.strictEqual(roundToTwo(10.005), 10.01);
assert.strictEqual(parseNonNegativeNumber(-15), 0);
assert.strictEqual(parseNonNegativeNumber(''), 0);
assert.strictEqual(parseNonNegativeNumber('   120.50  '), 120.50);
assert.strictEqual(parseNonNegativeNumber('invalid'), 0);
console.log('✓ Precision & parsing tests passed');

// 2. Liter calculation & invariant check
const literOk = calculateLiterDifference(1000, 1120.50);
assert.strictEqual(literOk.isValid, true);
assert.strictEqual(literOk.liters, 120.50);

const literError = calculateLiterDifference(1000, 950);
assert.strictEqual(literError.isValid, false);
assert.strictEqual(literError.liters, 0);
assert.ok(literError.errorMessage?.includes('less than opening reading'));
console.log('✓ Liter calculation & invariant checks passed');

// 3. Expected revenue
const rev = calculateExpectedAmount(120.50, 96.72);
assert.strictEqual(rev, 11654.76);
console.log('✓ Expected revenue calculation passed (120.50 L * 96.72 = ₹ 11,654.76)');

// 4. Collection sum
const col = calculateCollectionSum(5000, 6000, 600);
assert.strictEqual(col, 11600.00);
console.log('✓ Collection sum calculation passed (5000 + 6000 + 600 = ₹ 11,600.00)');

// 5. Variance and status classification
const varShortage = calculateVariance(11600.00, 11654.76);
assert.strictEqual(varShortage, -54.76);
assert.strictEqual(evaluateTallyStatus(varShortage), 'SHORTAGE');

const varTally = calculateVariance(11654.76, 11654.76);
assert.strictEqual(varTally, 0.00);
assert.strictEqual(evaluateTallyStatus(varTally), 'TALLY');

const varExcess = calculateVariance(11700.00, 11654.76);
assert.strictEqual(varExcess, 45.24);
assert.strictEqual(evaluateTallyStatus(varExcess), 'EXCESS');
console.log('✓ Variance and status classification passed');

// 6. Master calculateShift
const fullShift = calculateShift({
  fuelType: 'PETROL',
  fuelPrice: 96.72,
  openingReading: '4400.00',
  closingReading: '4520.50',
  cashAmount: '5000',
  upiAmount: '6000',
  creditAmount: '600',
  notes: 'Shift A'
});
assert.strictEqual(fullShift.isValid, true);
assert.strictEqual(fullShift.totalLiters, 120.50);
assert.strictEqual(fullShift.expectedSale, 11654.76);
assert.strictEqual(fullShift.totalCollected, 11600.00);
assert.strictEqual(fullShift.variance, -54.76);
assert.strictEqual(fullShift.tallyStatus, 'SHORTAGE');
console.log('✓ Master calculateShift passed with exact PRD reference numbers');

// 7. Validation guards
const invalidClose = calculateShift({
  fuelType: 'PETROL',
  fuelPrice: 96.72,
  openingReading: '5000',
  closingReading: '4000',
  cashAmount: '0',
  upiAmount: '0',
  creditAmount: '0'
});
assert.strictEqual(invalidClose.isValid, false);
assert.ok(invalidClose.errorMessage?.includes('less than opening reading'));

const invalidPrice = validateShiftInput({
  fuelType: 'PETROL',
  fuelPrice: 0,
  openingReading: '100',
  closingReading: '200',
  cashAmount: '0',
  upiAmount: '0',
  creditAmount: '0'
});
assert.strictEqual(invalidPrice.isValid, false);
console.log('✓ Validation guardrails passed');

// 8. Currency & Formatters
assert.strictEqual(formatLiters(120.5), '120.50 L');
assert.ok(formatINR(11654.76).includes('11,654.76'));
assert.strictEqual(formatVarianceLabel(0, 'TALLY'), 'PERFECT TALLY');
assert.ok(formatVarianceLabel(-54.76, 'SHORTAGE').includes('54.76'));
assert.ok(getStatusBadgeStyle('SHORTAGE').text.includes('rose'));
console.log('✓ Currency & formatters tests passed');

console.log('--- ALL PHASE 2 TESTS PASSED SUCCESSFULLY! ---');
