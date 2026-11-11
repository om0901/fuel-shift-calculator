# Implementation Plan & Action Checklist: Fuel Shift Cash & Meter Calculator (`PLAN.md`)

## 1. Execution Principles

- **Order of Execution:** Foundation $\rightarrow$ State & Math Engine $\rightarrow$ UI Shell $\rightarrow$ Modals & Actions $\rightarrow$ Packaging.
- **Verification Rule:** Every phase must pass compile check (`npm run build:web`) before proceeding to the next.
- **Reference Contracts:**
  - `PRD.md` for feature definitions and user journeys.
  - `DESIGN.md` for colors, typography, and visual wireframes.
  - `ARCHITECTURE.md` for project structure and IPC bridging.
  - `SCHEMA.md` for TypeScript interfaces, state contracts, and math formulas.

---

## 2. Phased Action Checklist

### Phase 1: Environment & Project Scaffolding
- [x] Initialize project with Vite + React 18 + TypeScript (`npm create vite@latest . -- --template react-ts`).
- [x] Install base dependencies:
  - Utility & Icons: `lucide-react`, `clsx`, `tailwind-merge`
  - State Management: `zustand`
  - Electron & Desktop Build Tooling: `electron`, `electron-builder`, `concurrently`, `wait-on`
- [x] Configure `tailwind.config.js` with tokens defined in `DESIGN.md` (colors: slate palette, status alerts, monospace typography).
- [x] Create directory structure specified in `ARCHITECTURE.md`:
  - `src/components/common`, `src/components/dashboard`, `src/components/history`, `src/components/modals`
  - `src/hooks`, `src/services`, `src/store`, `src/types`, `src/utils`
  - `electron/`

---

### Phase 2: Contracts, Math Engine & State Stores
- [x] Create `src/types/index.ts` and paste all interfaces defined in `SCHEMA.md`.
- [x] Implement pure calculation utilities in `src/utils/calculator.ts`:
  - `calculateLiters(opening, closing)` with invariant validation ($R_{\text{closing}} \ge R_{\text{opening}}$).
  - `calculateExpectedSale(liters, rate)`.
  - `calculateTotalCollected(cash, upi, credit)`.
  - `calculateVariance(collected, expected)`.
  - `classifyTallyStatus(variance)`.
- [x] Implement currency and number formatters in `src/utils/currency.ts` (Indian Rupee formatting `₹ #,##,###.##`).
- [x] Implement `src/services/storageAdapter.ts` supporting both Web (`localStorage`) and Desktop (Electron IPC fallback).
- [x] Setup Zustand stores:
  - `src/store/shiftStore.ts`: Form state, calculation outputs, history records, and modal triggers.
  - Initialize default fuel rates (Petrol: 96.72, Diesel: 89.62).

---

### Phase 3: Dashboard Shell & Core UI Assembly
- [x] Build reusable UI primitives in `src/components/common/`:
  - `Input.tsx`: Dark-slate styled inputs with numeric step handling and invalid borders.
  - `Button.tsx`: Primary blue, outline/secondary, and danger variants.
  - `Badge.tsx`: Pill badges for "PERFECT TALLY", "SHORTAGE", and "EXCESS".
- [x] Build Top Navigation Bar in `src/components/dashboard/Header.tsx`:
  - Fuel icon, app branding, live clock, and Settings gear button.
- [x] Build `TallyBanner.tsx`:
  - High-visibility variance card showing Expected vs. Collected and dynamic status badge.
- [x] Build Two-Column Workspace:
  - Left Card (`MeterSalesCard.tsx`): Fuel selector, opening/closing inputs, rate input, and live total liters + sale readout.
  - Right Card (`CashCollectionCard.tsx`): Cash, UPI, and Credit inputs + live total collection readout.
- [x] Build Action Toolbar (`Reset` and `Save Shift` CTA buttons).

---

### Phase 4: History Ledger, Modals & User Flows
- [x] Build `ShiftHistoryTable.tsx`:
  - Data table displaying timestamp, fuel type, volume, expected sale, handover amount, status badge, and delete action.
  - Search input and filter tabs (`All`, `Tally OK`, `Shortage`).
  - Empty state when no records exist.
- [x] Build `ConfirmShiftModal.tsx` (Modal 1):
  - Summary breakdown dialog confirming readings and variance before final commit.
  - On confirm: Append record to history, reset inputs, and persist to storage.
- [x] Build `SettingsModal.tsx` (Modal 2):
  - Form to update default Petrol and Diesel prices per liter.
- [x] Wire up CSV export / Print utility (`src/services/exportService.ts`) for shift records.

---

### Phase 5: Verification, Dual-Target Testing & Production Build

#### 5.1. Local Smoke & Math Testing
- [x] Test standard tally calculation (Opening: 1000, Closing: 1100, Rate: 100 $\rightarrow$ 100L, ₹10,000 expected).
- [x] Test validation trigger: Set Closing < Opening $\rightarrow$ verify red error outline and disabled save button.
- [x] Verify data persistence: Add 2 shifts, refresh browser/app $\rightarrow$ records must remain intact.

#### 5.2. Web Portal Build
- [x] Run `npm run build:web` and verify clean output in `dist/`.
- [x] Run `npm run preview` to test production bundle in local browser.

#### 5.3. Desktop Packaging (Electron `.exe`)
- [x] Setup `electron/main.ts` and `electron/preload.ts` according to `ARCHITECTURE.md`.
- [x] Test desktop development mode (`npm run electron:dev`).
- [x] Run production desktop builder (`npm run build:electron`).
- [x] Confirm output installer executable (`.exe`) is generated in `dist_electron/`.