import { ShiftRecord, FuelRates } from './index';

export interface ElectronBridge {
  isDesktop: boolean;
  saveRecord: (record: ShiftRecord) => Promise<void>;
  getRecords: () => Promise<ShiftRecord[]>;
  updateRecord?: (record: ShiftRecord) => Promise<void>;
  deleteRecord: (id: string) => Promise<void>;
  clearRecords?: () => Promise<void>;
  saveConfig: (rates: FuelRates) => Promise<void>;
  getConfig: () => Promise<FuelRates | null>;
}

declare global {
  interface Window {
    electron?: ElectronBridge;
  }
}

export {};
