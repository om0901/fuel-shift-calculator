import { ShiftCalculationOutput, ShiftFormInput, TallyStatus } from '../types';

/**
 * Precision safe rounding to 2 decimal places.
 * Uses Number.EPSILON to avoid floating-point math inaccuracies (e.g. 0.1 + 0.2 = 0.30000000000000004).
 */
export function roundToTwo(value: number): number {
  if (isNaN(value) || !isFinite(value)) return 0;
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Safely parses input into a non-negative float.
 * Guarantees lower boundary >= 0 and guards against NaN / Infinity.
 */
export function parseNonNegativeNumber(value: string | number): number {
  if (typeof value === 'number') {
    if (isNaN(value) || !isFinite(value) || value < 0) return 0;
    return roundToTwo(value);
  }
  const cleanStr = String(value).trim();
  if (cleanStr === '') return 0;
  const parsed = parseFloat(cleanStr);
  if (isNaN(parsed) || !isFinite(parsed) || parsed < 0) return 0;
  return roundToTwo(parsed);
}

/**
 * Form input validator checking all business guardrails:
 * - Fuel Price must be > 0
 * - Closing reading cannot be less than opening reading
 * - Numerical values cannot be negative
 */
export function validateShiftInput(form: ShiftFormInput): { isValid: boolean; errorMessage?: string } {
  const price = parseNonNegativeNumber(form.fuelPrice);
  if (price <= 0) {
    return {
      isValid: false,
      errorMessage: 'Fuel price must be greater than zero (₹/L).',
    };
  }

  const openNum = parseNonNegativeNumber(form.openingReading);
  const closeStr = String(form.closingReading).trim();

  if (closeStr !== '') {
    const closeNum = parseNonNegativeNumber(form.closingReading);
    if (closeNum < openNum) {
      return {
        isValid: false,
        errorMessage: 'Closing reading cannot be less than opening reading.',
      };
    }
  }

  return { isValid: true };
}

/**
 * Calculates net liters dispensed: max(0, Closing - Opening)
 * Invariant: Closing Reading >= Opening Reading
 */
export function calculateLiterDifference(
  opening: string | number,
  closing: string | number
): { liters: number; isValid: boolean; errorMessage?: string } {
  const openNum = parseNonNegativeNumber(opening);
  const closeStr = String(closing).trim();

  // If closing reading has been supplied and is strictly lower than opening reading
  if (closeStr !== '') {
    const closeNum = parseNonNegativeNumber(closing);
    if (closeNum < openNum) {
      return {
        liters: 0,
        isValid: false,
        errorMessage: 'Closing reading cannot be less than opening reading.',
      };
    }
    const liters = roundToTwo(Math.max(0, closeNum - openNum));
    return { liters, isValid: true };
  }

  return { liters: 0, isValid: true };
}

export const calculateLiters = calculateLiterDifference;

/**
 * Calculates Expected Monetary Sale: Liters * Rate (₹)
 * Safe against zero or invalid rates.
 */
export function calculateExpectedAmount(liters: number, rate: string | number): number {
  const safeLiters = parseNonNegativeNumber(liters);
  const safeRate = parseNonNegativeNumber(rate);
  return roundToTwo(safeLiters * safeRate);
}

export const calculateExpectedSale = calculateExpectedAmount;

/**
 * Calculates Total Cash & Digital Handover: Cash + UPI + Credit (₹)
 */
export function calculateCollectionSum(
  cash: string | number,
  upi: string | number,
  credit: string | number
): number {
  const cashNum = parseNonNegativeNumber(cash);
  const upiNum = parseNonNegativeNumber(upi);
  const creditNum = parseNonNegativeNumber(credit);

  return roundToTwo(cashNum + upiNum + creditNum);
}

export const calculateTotalCollected = calculateCollectionSum;

/**
 * Calculates Financial Variance: Total Collected - Expected Sale (₹)
 */
export function calculateVariance(collected: number, expected: number): number {
  const safeCollected = roundToTwo(collected);
  const safeExpected = roundToTwo(expected);
  return roundToTwo(safeCollected - safeExpected);
}

/**
 * Evaluates Tally Status with a 1-paisa threshold (|variance| < 0.01):
 * - TALLY: Variance is 0.00 (|delta| < 0.01)
 * - SHORTAGE: Collected < Expected (variance <= -0.01)
 * - EXCESS: Collected > Expected (variance >= 0.01)
 */
export function evaluateTallyStatus(variance: number): TallyStatus {
  const rounded = roundToTwo(variance);
  if (Math.abs(rounded) < 0.01) {
    return 'TALLY';
  }
  if (rounded <= -0.01) {
    return 'SHORTAGE';
  }
  return 'EXCESS';
}

export const classifyTallyStatus = evaluateTallyStatus;

/**
 * Master calculation engine combining meter sales and payment collections.
 */
export function calculateShift(form: ShiftFormInput): ShiftCalculationOutput {
  const validation = validateShiftInput(form);
  const totalCollected = calculateCollectionSum(
    form.cashAmount,
    form.upiAmount,
    form.creditAmount
  );

  if (!validation.isValid) {
    return {
      totalLiters: 0,
      expectedSale: 0,
      totalCollected,
      variance: totalCollected,
      tallyStatus: evaluateTallyStatus(totalCollected),
      isValid: false,
      errorMessage: validation.errorMessage,
    };
  }

  const literResult = calculateLiterDifference(form.openingReading, form.closingReading);
  if (!literResult.isValid) {
    return {
      totalLiters: 0,
      expectedSale: 0,
      totalCollected,
      variance: totalCollected,
      tallyStatus: evaluateTallyStatus(totalCollected),
      isValid: false,
      errorMessage: literResult.errorMessage,
    };
  }

  const totalLiters = literResult.liters;
  const expectedSale = calculateExpectedAmount(totalLiters, form.fuelPrice);
  const variance = calculateVariance(totalCollected, expectedSale);
  const tallyStatus = evaluateTallyStatus(variance);

  return {
    totalLiters,
    expectedSale,
    totalCollected,
    variance,
    tallyStatus,
    isValid: true,
  };
}

