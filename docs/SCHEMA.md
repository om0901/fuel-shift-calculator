# Data Models & Schema Contracts: Fuel Shift Cash & Meter Calculator (`SCHEMA.md`)

## 1. Storage Engine & Entity Architecture

The application persists data locally using a structured JSON document or local key-value database (`shifts_ledger` and `app_config`).

```
+-------------------------------------------------------------+
|                      LocalStorage / Local JSON              |
+------------------------------+------------------------------+
                               |
       +-----------------------+-----------------------+
       |                                               |
+------v----------------------+         +--------------v--------------+
|  shifts: ShiftRecord[]      |         |  rates_config: FuelRates    |
|  (Historical shift logs)    |         |  (Pricing presets)          |
+-----------------------------+         +-----------------------------+
```

---

## 2. Entity Field Definitions

### 2.1. `ShiftRecord` (Shift Log Entry)
Represents a finalized, submitted shift calculation saved into the local audit trail.

| Field Name | Type | Constraints | Description |
|---|---|---|---|
| `id` | `string` | Primary Key, UUID | Unique identifier for shift entry |
| `timestamp` | `string` | ISO 8601 string | Creation date/time (e.g., `2026-11-04T12:00:00.000Z`) |
| `fuelType` | `FuelType` | `'PETROL' \| 'DIESEL'` | Fuel product dispensed during shift |
| `fuelPrice` | `number` | `> 0`, 2 decimal digits | Price per liter applied during the shift (₹) |
| `openingReading` | `number` | `≥ 0`, 2 decimal digits | Nozzle totalizer meter reading at shift start |
| `closingReading` | `number` | `≥ openingReading` | Nozzle totalizer meter reading at shift close |
| `totalLiters` | `number` | Derived (`closing - opening`) | Net volume dispensed in liters |
| `expectedSale` | `number` | Derived (`liters * price`) | Calculated monetary value of fuel sold (₹) |
| `cashAmount` | `number` | `≥ 0`, default: `0` | Physical currency collected (₹) |
| `upiAmount` | `number` | `≥ 0`, default: `0` | Digital UPI / QR code payments collected (₹) |
| `creditAmount` | `number` | `≥ 0`, default: `0` | Khata / voucher slips collected (₹) |
| `totalCollected` | `number` | Derived (`cash + upi + credit`) | Total money received across all payment channels |
| `variance` | `number` | Derived (`collected - expected`) | Financial discrepancy amount (₹) |
| `tallyStatus` | `TallyStatus` | `'MATCH' \| 'SHORTAGE' \| 'EXCESS'` | Categorized balance evaluation status |
| `notes` | `string` | Optional, max 200 chars | Shift operator remark or nozzle identifier |

### 2.2. `FuelRates` (Application Configuration)
Maintains current price per liter configuration.

| Field Name | Type | Default | Description |
|---|---|---|---|
| `petrolPrice` | `number` | `96.72` | Standard Motor Spirit (Petrol) rate per liter |
| `dieselPrice` | `number` | `89.62` | High-Speed Diesel rate per liter |
| `updatedAt` | `string` | Current ISO | Last price revision timestamp |

---

## 3. Strict Calculation Formulas & Invariants

All numerical outputs must strictly conform to these invariants:

1. **Volume Sold ($V$):**
   $$V = \text{round}_2(R_{\text{closing}} - R_{\text{opening}})$$
   *Invariant:* $R_{\text{closing}} \ge R_{\text{opening}}$. If violated, calculation is blocked and error is emitted.

2. **Expected Revenue ($E$):**
   $$E = \text{round}_2(V \times P_{\text{fuel}})$$

3. **Total Cash & Payment Handover ($C$):**
   $$C = \text{round}_2(A_{\text{cash}} + A_{\text{upi}} + A_{\text{credit}})$$

4. **Variance ($\Delta$):**
   $$\Delta = \text{round}_2(C - E)$$

5. **Tally Status Classification:**
   $$\text{Status} = \begin{cases} \text{'MATCH'}, & \text{if } |\Delta| < 0.01 \\ \text{'SHORTAGE'}, & \text{if } \Delta \le -0.01 \\ \text{'EXCESS'}, & \text{if } \Delta \ge 0.01 \end{cases}$$

---

## 4. TypeScript Contracts (`src/types/index.ts`)

```typescript
export type FuelType = 'PETROL' | 'DIESEL';

export type TallyStatus = 'MATCH' | 'SHORTAGE' | 'EXCESS';

export interface FuelRates {
  petrolPrice: number;
  dieselPrice: number;
  updatedAt: string;
}

export interface ShiftFormInput {
  fuelType: FuelType;
  fuelPrice: number;
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
}
```

---

## 5. Zustand State Contract (`src/store/shiftStore.ts`)

```typescript
import { ShiftRecord, ShiftFormInput, ShiftCalculationOutput, FuelRates, ShiftFilterCriteria } from '../types';

export interface ShiftStoreState {
  // Active Form State
  form: ShiftFormInput;
  calculations: ShiftCalculationOutput;

  // Rate Settings
  rates: FuelRates;

  // Persistence Records
  records: ShiftRecord[];
  filters: ShiftFilterCriteria;

  // UI Micro-States
  isConfirmModalOpen: boolean;
  isSettingsModalOpen: boolean;

  // Actions
  updateFormField: (field: keyof ShiftFormInput, value: string | number) => void;
  setFuelType: (fuelType: FuelType) => void;
  resetForm: () => void;
  commitShiftRecord: () => void;
  deleteShiftRecord: (id: string) => void;
  updateRates: (rates: Partial<FuelRates>) => void;
  setFilter: (filterKey: keyof ShiftFilterCriteria, value: string) => void;
  setConfirmModalOpen: (open: boolean) => void;
  setSettingsModalOpen: (open: boolean) => void;
  loadInitialData: () => Promise<void>;
}
```