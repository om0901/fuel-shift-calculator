import { ShiftRecord, FuelRates, StorageService } from '../types';

const STORAGE_KEYS = {
  SHIFTS: 'fuel_shift_records_v1',
  RATES: 'fuel_shift_rates_v1',
} as const;

export const DEFAULT_FUEL_RATES: FuelRates = {
  petrolPrice: 96.72,
  dieselPrice: 89.62,
  updatedAt: new Date().toISOString(),
};

/**
 * Detects if the current runtime is Electron desktop or Web browser.
 * Completely isolates native Electron IPC APIs from browser runtime.
 */
export const isDesktopEnvironment = (): boolean => {
  return typeof window !== 'undefined' && Boolean(window.electron?.isDesktop);
};

/**
 * Returns safe storage instance across browser, node test, and native webview runtimes.
 */
export function getLocalStorage(): Storage | null {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  if (typeof globalThis !== 'undefined' && (globalThis as unknown as { localStorage?: Storage }).localStorage) {
    return (globalThis as unknown as { localStorage: Storage }).localStorage;
  }
  return null;
}

/**
 * Universal Storage Adapter
 * Smoothly switches between Electron Native IPC and Browser LocalStorage.
 */
export class UniversalStorageAdapter implements StorageService {
  /**
   * Fetch all saved shift records from storage.
   */
  async fetchRecords(): Promise<ShiftRecord[]> {
    if (isDesktopEnvironment() && window.electron?.getRecords) {
      try {
        const records = await window.electron.getRecords();
        return Array.isArray(records) ? records : [];
      } catch (err) {
        console.error('Failed to load shifts from desktop IPC:', err);
      }
    }

    try {
      const storage = getLocalStorage();
      if (!storage) return [];
      const raw = storage.getItem(STORAGE_KEYS.SHIFTS);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.error('Failed to load shifts from storage:', err);
      return [];
    }
  }

  // Alias for fetchRecords as specified in contract
  async loadShifts(): Promise<ShiftRecord[]> {
    return this.fetchRecords();
  }

  /**
   * Insert or upsert a shift record.
   */
  async saveRecord(record: ShiftRecord): Promise<void> {
    if (isDesktopEnvironment() && window.electron?.saveRecord) {
      try {
        await window.electron.saveRecord(record);
        return;
      } catch (err) {
        console.error('Failed to save shift via desktop IPC:', err);
      }
    }

    try {
      const current = await this.fetchRecords();
      const updated = [record, ...current.filter((item) => item.id !== record.id)];
      const storage = getLocalStorage();
      if (storage) {
        storage.setItem(STORAGE_KEYS.SHIFTS, JSON.stringify(updated));
      }
    } catch (err) {
      console.error('Failed to save shift to storage:', err);
      throw err;
    }
  }

  // Alias for saveRecord as specified in contract
  async saveShift(record: ShiftRecord): Promise<void> {
    return this.saveRecord(record);
  }

  /**
   * Update an existing shift record.
   */
  async updateRecord(record: ShiftRecord): Promise<void> {
    if (isDesktopEnvironment() && window.electron?.updateRecord) {
      try {
        await window.electron.updateRecord(record);
        return;
      } catch (err) {
        console.error('Failed to update shift via desktop IPC:', err);
      }
    }

    try {
      const current = await this.fetchRecords();
      const updated = current.map((item) => (item.id === record.id ? record : item));
      const storage = getLocalStorage();
      if (storage) {
        storage.setItem(STORAGE_KEYS.SHIFTS, JSON.stringify(updated));
      }
    } catch (err) {
      console.error('Failed to update shift in storage:', err);
      throw err;
    }
  }

  /**
   * Delete a shift record by ID.
   */
  async deleteRecord(id: string): Promise<void> {
    if (isDesktopEnvironment() && window.electron?.deleteRecord) {
      try {
        await window.electron.deleteRecord(id);
        return;
      } catch (err) {
        console.error('Failed to delete shift via desktop IPC:', err);
      }
    }

    try {
      const current = await this.fetchRecords();
      const updated = current.filter((item) => item.id !== id);
      const storage = getLocalStorage();
      if (storage) {
        storage.setItem(STORAGE_KEYS.SHIFTS, JSON.stringify(updated));
      }
    } catch (err) {
      console.error('Failed to delete shift from storage:', err);
      throw err;
    }
  }

  // Alias for deleteRecord
  async deleteShift(id: string): Promise<void> {
    return this.deleteRecord(id);
  }

  /**
   * Clear all stored shift records.
   */
  async clearAllRecords(): Promise<void> {
    if (isDesktopEnvironment() && window.electron?.clearRecords) {
      try {
        await window.electron.clearRecords();
        return;
      } catch (err) {
        console.error('Failed to clear shifts via desktop IPC:', err);
      }
    }

    try {
      const storage = getLocalStorage();
      if (storage) {
        storage.removeItem(STORAGE_KEYS.SHIFTS);
      }
    } catch (err) {
      console.error('Failed to clear shifts from storage:', err);
      throw err;
    }
  }

  /**
   * Load fuel pricing configuration.
   */
  async loadRates(): Promise<FuelRates> {
    if (isDesktopEnvironment() && window.electron?.getConfig) {
      try {
        const rates = await window.electron.getConfig();
        if (rates) return rates;
      } catch (err) {
        console.error('Failed to load rates via desktop IPC:', err);
      }
    }

    try {
      const storage = getLocalStorage();
      if (!storage) return DEFAULT_FUEL_RATES;
      const raw = storage.getItem(STORAGE_KEYS.RATES);
      if (!raw) return DEFAULT_FUEL_RATES;
      return JSON.parse(raw) as FuelRates;
    } catch (err) {
      console.error('Failed to load rates from storage:', err);
      return DEFAULT_FUEL_RATES;
    }
  }

  /**
   * Save fuel pricing configuration.
   */
  async saveRates(rates: FuelRates): Promise<void> {
    if (isDesktopEnvironment() && window.electron?.saveConfig) {
      try {
        await window.electron.saveConfig(rates);
        return;
      } catch (err) {
        console.error('Failed to save rates via desktop IPC:', err);
      }
    }

    try {
      const storage = getLocalStorage();
      if (storage) {
        storage.setItem(STORAGE_KEYS.RATES, JSON.stringify(rates));
      }
    } catch (err) {
      console.error('Failed to save rates to storage:', err);
      throw err;
    }
  }
}

export const storageService = new UniversalStorageAdapter();
