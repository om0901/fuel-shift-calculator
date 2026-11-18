/**
 * Data Models & Schema Contracts: Fuel Shift Cash & Meter Calculator
 * Derived directly from SCHEMA.md, ARCHITECTURE.md, and PRD.md
 */

export type FuelType = 'PETROL' | 'DIESEL';

export type TallyStatus = 'MATCH' | 'TALLY' | 'SHORTAGE' | 'EXCESS';

export interface FuelRates {
  petrolPrice: number;
  dieselPrice: number;
  updatedAt: string;
}

export interface ShiftFormInput {
  fuelType: FuelType;
  fuelPrice: number;
  shiftDate?: string; // YYYY-MM-DD
  openingReading: string | number;
  closingReading: string | number;
  cashAmount: string | number;
  upiAmount: string | number;
  creditAmount: string | number;
  notes?: string;
}

export interface ShiftCalculationOutput {
  totalLiters: number;
  expectedSale: number;
  totalCollected: number;
  variance: number;
  tallyStatus: TallyStatus;
  isValid: boolean;
  errorMessage?: string;
}

export interface ShiftRecord {
  id: string;
  timestamp: string;
  shiftDate?: string; // YYYY-MM-DD
  fuelType: FuelType;
  fuelPrice: number;
  openingReading: number;
  closingReading: number;
  totalLiters: number;
  expectedSale: number;
  cashAmount: number;
  upiAmount: number;
  creditAmount: number;
  totalCollected: number;
  variance: number;
  tallyStatus: TallyStatus;
  notes?: string;
}

export interface ShiftFilterCriteria {
  searchTerm: string;
  statusFilter: 'ALL' | TallyStatus;
  fuelTypeFilter: 'ALL' | FuelType;
  dateFilter?: string; // YYYY-MM-DD
}

export interface StorageService {
  fetchRecords(): Promise<ShiftRecord[]>;
  loadShifts(): Promise<ShiftRecord[]>;
  saveRecord(record: ShiftRecord): Promise<void>;
  saveShift(record: ShiftRecord): Promise<void>;
  updateRecord(record: ShiftRecord): Promise<void>;
  deleteRecord(id: string): Promise<void>;
  deleteShift(id: string): Promise<void>;
  clearAllRecords(): Promise<void>;
  loadRates(): Promise<FuelRates>;
  saveRates(rates: FuelRates): Promise<void>;
}
