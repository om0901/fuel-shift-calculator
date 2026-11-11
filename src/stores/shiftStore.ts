import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  FuelRates,
  FuelType,
  ShiftCalculationOutput,
  ShiftFilterCriteria,
  ShiftFormInput,
  ShiftRecord,
} from '../types';
import {
  calculateShift,
  parseNonNegativeNumber,
  validateShiftInput,
} from '../utils/calculations';
import { storageService, DEFAULT_FUEL_RATES, getLocalStorage } from '../services/storageAdapter';

export interface ToastNotification {
  id: string;
  text: string;
  type: 'success' | 'info' | 'error';
}

export interface ShiftStoreState {
  // Active Form State
  form: ShiftFormInput;
  calculations: ShiftCalculationOutput;

  // Rate Settings
  rates: FuelRates;

  // Persistence Records & Filtering
  records: ShiftRecord[];
  filters: ShiftFilterCriteria;

  // Status & Validation
  isLoading: boolean;
  errorMessage: string | null;
  toast: ToastNotification | null;

  // UI Modal Flags & Targets
  isConfirmModalOpen: boolean;
  isSettingsModalOpen: boolean;
  deleteRecordTarget: ShiftRecord | null;

  // Store Actions
  updateInputField: (field: keyof ShiftFormInput, value: string | number) => void;
  updateFormField: (field: keyof ShiftFormInput, value: string | number) => void;
  setFuelType: (fuelType: FuelType) => void;
  resetActiveForm: () => void;
  resetForm: () => void;
  commitRecordToStorage: () => Promise<boolean>;
  commitShiftRecord: () => Promise<boolean>;
  removeRecord: (id: string) => Promise<void>;
  deleteShiftRecord: (id: string) => Promise<void>;
  updateRecord: (record: ShiftRecord) => Promise<void>;
  clearAllRecords: () => Promise<void>;
  updateRates: (newRates: Partial<FuelRates>) => Promise<void>;
  setFilter: (filterKey: keyof ShiftFilterCriteria, value: string) => void;
  setConfirmModalOpen: (open: boolean) => void;
  setSettingsModalOpen: (open: boolean) => void;
  setDeleteRecordTarget: (record: ShiftRecord | null) => void;
  showToast: (text: string, type?: 'success' | 'info' | 'error') => void;
  clearToast: () => void;
  loadInitialData: () => Promise<void>;
}

const createInitialForm = (rates: FuelRates, fuelType: FuelType = 'PETROL'): ShiftFormInput => ({
  fuelType,
  fuelPrice: fuelType === 'PETROL' ? rates.petrolPrice : rates.dieselPrice,
  openingReading: '',
  closingReading: '',
  cashAmount: '',
  upiAmount: '',
  creditAmount: '',
  notes: '',
});

export const useShiftStore = create<ShiftStoreState>()(
  persist(
    (set, get) => {
      const initialForm = createInitialForm(DEFAULT_FUEL_RATES, 'PETROL');
      const initialCalculations = calculateShift(initialForm);

      const triggerToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
        const id = `toast_${Date.now()}`;
        set({ toast: { id, text, type } });
      };

      const handleUpdateField = (field: keyof ShiftFormInput, value: string | number) => {
        set((state) => {
          const updatedForm = { ...state.form, [field]: value };
          const validation = validateShiftInput(updatedForm);
          const calculations = calculateShift(updatedForm);
          return {
            form: updatedForm,
            calculations,
            errorMessage: validation.isValid ? null : (validation.errorMessage || null),
          };
        });
      };

      const handleResetForm = () => {
        set((state) => {
          const freshForm = createInitialForm(state.rates, state.form.fuelType);
          return {
            form: freshForm,
            calculations: calculateShift(freshForm),
            errorMessage: null,
          };
        });
      };

      const handleCommitRecord = async (): Promise<boolean> => {
        const { form, calculations, rates } = get();
        const validation = validateShiftInput(form);
        if (!validation.isValid || !calculations.isValid) {
          const err = validation.errorMessage || calculations.errorMessage || 'Invalid shift inputs';
          set({ errorMessage: err });
          triggerToast(err, 'error');
          return false;
        }

        set({ isLoading: true });
        try {
          const newRecord: ShiftRecord = {
            id: typeof crypto !== 'undefined' && crypto.randomUUID
              ? crypto.randomUUID()
              : `shift_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            timestamp: new Date().toISOString(),
            fuelType: form.fuelType,
            fuelPrice: form.fuelPrice,
            openingReading: parseNonNegativeNumber(form.openingReading),
            closingReading: parseNonNegativeNumber(form.closingReading),
            totalLiters: calculations.totalLiters,
            expectedSale: calculations.expectedSale,
            cashAmount: parseNonNegativeNumber(form.cashAmount),
            upiAmount: parseNonNegativeNumber(form.upiAmount),
            creditAmount: parseNonNegativeNumber(form.creditAmount),
            totalCollected: calculations.totalCollected,
            variance: calculations.variance,
            tallyStatus: calculations.tallyStatus,
            notes: form.notes,
          };

          await storageService.saveRecord(newRecord);

          set((state) => {
            const freshForm = createInitialForm(rates, state.form.fuelType);
            return {
              records: [newRecord, ...state.records.filter((r) => r.id !== newRecord.id)],
              form: freshForm,
              calculations: calculateShift(freshForm),
              isConfirmModalOpen: false,
              isLoading: false,
              errorMessage: null,
            };
          });
          triggerToast('Shift record saved and committed to ledger successfully!');
          return true;
        } catch (err) {
          console.error('Failed to commit shift record:', err);
          set({
            isLoading: false,
            errorMessage: 'Failed to persist shift record to storage.',
          });
          triggerToast('Failed to persist shift record to storage.', 'error');
          return false;
        }
      };

      const handleRemoveRecord = async (id: string) => {
        set({ isLoading: true });
        try {
          await storageService.deleteRecord(id);
          set((state) => ({
            records: state.records.filter((r) => r.id !== id),
            deleteRecordTarget: null,
            isLoading: false,
          }));
          triggerToast('Shift record deleted from audit ledger.');
        } catch (err) {
          console.error('Failed to remove shift record:', err);
          set({ isLoading: false, errorMessage: 'Failed to delete record from storage.' });
          triggerToast('Failed to delete record from storage.', 'error');
        }
      };

      return {
        form: initialForm,
        calculations: initialCalculations,
        rates: DEFAULT_FUEL_RATES,
        records: [],
        filters: {
          searchTerm: '',
          statusFilter: 'ALL',
          fuelTypeFilter: 'ALL',
        },
        isLoading: false,
        errorMessage: null,
        toast: null,
        isConfirmModalOpen: false,
        isSettingsModalOpen: false,
        deleteRecordTarget: null,

        updateInputField: handleUpdateField,
        updateFormField: handleUpdateField,

        setFuelType: (fuelType) => {
          set((state) => {
            const newPrice = fuelType === 'PETROL' ? state.rates.petrolPrice : state.rates.dieselPrice;
            const updatedForm: ShiftFormInput = {
              ...state.form,
              fuelType,
              fuelPrice: newPrice,
            };
            const validation = validateShiftInput(updatedForm);
            const calculations = calculateShift(updatedForm);
            return {
              form: updatedForm,
              calculations,
              errorMessage: validation.isValid ? null : (validation.errorMessage || null),
            };
          });
        },

        resetActiveForm: handleResetForm,
        resetForm: handleResetForm,

        commitRecordToStorage: handleCommitRecord,
        commitShiftRecord: handleCommitRecord,

        removeRecord: handleRemoveRecord,
        deleteShiftRecord: handleRemoveRecord,

        updateRecord: async (record: ShiftRecord) => {
          set({ isLoading: true });
          try {
            await storageService.updateRecord(record);
            set((state) => ({
              records: state.records.map((r) => (r.id === record.id ? record : r)),
              isLoading: false,
            }));
            triggerToast('Record updated successfully.');
          } catch (err) {
            console.error('Failed to update record:', err);
            set({ isLoading: false, errorMessage: 'Failed to update record in storage.' });
            triggerToast('Failed to update record in storage.', 'error');
          }
        },

        clearAllRecords: async () => {
          set({ isLoading: true });
          try {
            await storageService.clearAllRecords();
            set({ records: [], isLoading: false });
            triggerToast('All audit records cleared.');
          } catch (err) {
            console.error('Failed to clear records:', err);
            set({ isLoading: false, errorMessage: 'Failed to clear records from storage.' });
            triggerToast('Failed to clear records from storage.', 'error');
          }
        },

        updateRates: async (newRates: Partial<FuelRates>) => {
          const current = get().rates;
          const updated: FuelRates = {
            petrolPrice: newRates.petrolPrice !== undefined ? newRates.petrolPrice : current.petrolPrice,
            dieselPrice: newRates.dieselPrice !== undefined ? newRates.dieselPrice : current.dieselPrice,
            updatedAt: new Date().toISOString(),
          };

          set({ isLoading: true });
          try {
            await storageService.saveRates(updated);
            set((state) => {
              const activePrice = state.form.fuelType === 'PETROL' ? updated.petrolPrice : updated.dieselPrice;
              const updatedForm = { ...state.form, fuelPrice: activePrice };
              return {
                rates: updated,
                form: updatedForm,
                calculations: calculateShift(updatedForm),
                isSettingsModalOpen: false,
                isLoading: false,
                errorMessage: null,
              };
            });
            triggerToast('Fuel rates updated successfully!');
          } catch (err) {
            console.error('Failed to update rates:', err);
            set({ isLoading: false, errorMessage: 'Failed to persist rate update.' });
            triggerToast('Failed to persist rate update.', 'error');
          }
        },

        setFilter: (filterKey, value) => {
          set((state) => ({
            filters: {
              ...state.filters,
              [filterKey]: value,
            },
          }));
        },

        setConfirmModalOpen: (open) => set({ isConfirmModalOpen: open }),
        setSettingsModalOpen: (open) => set({ isSettingsModalOpen: open }),
        setDeleteRecordTarget: (record) => set({ deleteRecordTarget: record }),

        showToast: triggerToast,
        clearToast: () => set({ toast: null }),

        loadInitialData: async () => {
          set({ isLoading: true });
          try {
            const [loadedRates, loadedRecords] = await Promise.all([
              storageService.loadRates(),
              storageService.fetchRecords(),
            ]);

            set((state) => {
              const activePrice = state.form.fuelType === 'PETROL' ? loadedRates.petrolPrice : loadedRates.dieselPrice;
              const updatedForm = { ...state.form, fuelPrice: activePrice };
              return {
                rates: loadedRates,
                records: loadedRecords,
                form: updatedForm,
                calculations: calculateShift(updatedForm),
                isLoading: false,
              };
            });
          } catch (err) {
            console.error('Failed to load initial data:', err);
            set({ isLoading: false, errorMessage: 'Failed to load stored shift records.' });
          }
        },
      };
    },
    {
      name: 'fuel_shift_store_state',
      storage: createJSONStorage(() => {
        const s = getLocalStorage();
        if (s) return s;
        const memoryMap: Record<string, string> = {};
        return {
          getItem: (name: string) => memoryMap[name] || null,
          setItem: (name: string, val: string) => { memoryMap[name] = val; },
          removeItem: (name: string) => { delete memoryMap[name]; },
        } as Storage;
      }),
      partialize: (state) => ({
        form: state.form,
        rates: state.rates,
        filters: state.filters,
      }),
    }
  )
);
