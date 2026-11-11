# Architecture & Technical Blueprint: Fuel Shift Cash & Meter Calculator (`ARCHITECTURE.md`)

## 1. System Overview & Dual-Target Strategy

This application is built with a **Single Unified Codebase** that compiles into two delivery formats:
1. **Web Portal:** Running in standard browsers (served via Vite React static build).
2. **Desktop Software:** Standalone Windows `.exe` installer (packaged with Electron).

```
                      +-----------------------------+
                      |   React 18 + TypeScript UI  |
                      |   (Vite + Tailwind CSS)     |
                      +--------------+--------------+
                                     |
                         Unified Storage Adapter
                                     |
              +----------------------+----------------------+
              |                                             |
     [Web Target Mode]                             [Desktop Target Mode]
  localStorage / IndexedDB                        Electron IPC + Local JSON
  (Zero Server Dependency)                       (AppData/Local File Store)
```

---

## 2. Technology Stack Selection

| Layer | Technology | Version / Tooling | Justification |
| :--- | :--- | :--- | :--- |
| **Language** | TypeScript | `^5.0.0` | Strict type safety for meter numbers and currency calculations |
| **UI Framework** | React | `^18.3.0` | Component modularity and reactive recalculations |
| **Bundler** | Vite | `^5.4.0` | Sub-second HMR and lightweight bundle sizes |
| **Styling** | Tailwind CSS | `^3.4.0` | Tokenized utility styling aligned with `DESIGN.md` |
| **Icons** | Lucide React | `^0.400.0` | Lightweight SVG icons (`Fuel`, `Settings`, `Trash2`, etc.) |
| **State Store** | Zustand | `^4.5.0` | Micro-store with zero boilerplate for reactive calculation updates |
| **Desktop Wrapper** | Electron | `^30.0.0` | Stable cross-platform packaging with native window chrome |
| **Packaging** | electron-builder | `^24.13.0` | Produces standalone Windows NSIS installers and portable `.exe` |

---

## 3. Directory & Folder Tree

```text
fuel-shift-calculator/
├── .github/                      # CI/CD release workflows (optional)
├── docs/                         # Specification contracts
│   ├── PRD.md
│   ├── DESIGN.md
│   ├── ARCHITECTURE.md
│   ├── SCHEMA.md
│   └── PLAN.md
├── electron/                     # Desktop Main Process Layer
│   ├── main.ts                   # Window lifecycle, menubar & native IPC
│   ├── preload.ts                # Secure ContextBridge bridge
│   └── tsconfig.json             # Electron-specific TypeScript config
├── src/                          # Universal UI Layer (React + Vite)
│   ├── assets/                   # Static logos and assets
│   ├── components/               # Visual UI Blocks
│   │   ├── common/               # Atoms: Button, Input, Modal, Badge
│   │   ├── dashboard/            # MeterSalesCard, CashCollectionCard, TallyBanner
│   │   ├── history/              # ShiftHistoryTable, FilterBar
│   │   └── modals/               # ConfirmShiftModal, SettingsModal
│   ├── hooks/                    # Custom React hooks (useTallyCalculation)
│   ├── services/                 # Persistence Layer
│   │   ├── storageAdapter.ts     # Dynamic switch (Web vs Electron)
│   │   └── exportService.ts      # CSV / Print statement formatting
│   ├── store/                    # Zustand Global Stores
│   │   ├── shiftStore.ts         # Active calculation inputs & history array
│   │   └── configStore.ts        # Fuel price presets (Petrol/Diesel rates)
│   ├── types/                    # TypeScript interfaces & types
│   │   ├── index.ts              # Core contracts matching SCHEMA.md
│   │   └── electron.d.ts         # Window.electron IPC declarations
│   ├── utils/                    # Math & Formatters
│   │   ├── calculator.ts         # Pure math functions (Variance, Expected)
│   │   └── currency.ts           # Indian Rupee (₹) and decimal formatters
│   ├── App.tsx                   # Main layout container
│   ├── index.css                 # Tailwind directives & CSS variables
│   └── main.tsx                  # React DOM mount entry
├── electron-builder.json         # Desktop installer specifications
├── index.html                    # Root HTML document
├── package.json                  # Dependencies & execution scripts
├── tailwind.config.js            # Tailwind tokens mapped to DESIGN.md
├── tsconfig.json                 # Web TypeScript compiler settings
└── vite.config.ts                # Vite build config with path aliases
```

---

## 4. Universal Storage Abstraction (Web vs Desktop)

To maintain 100% code parity between the web portal and desktop application, all persistence calls go through `src/services/storageAdapter.ts`.

### Persistence Detection Logic:
* If running inside Electron: Calls `window.electron.store` via secure IPC.
* If running in a browser: Falls back to `window.localStorage` with JSON serialization.

```typescript
// src/services/storageAdapter.ts interface contract
export interface StorageService {
  loadShifts(): Promise<ShiftRecord[]>;
  saveShift(record: ShiftRecord): Promise<void>;
  deleteShift(id: string): Promise<void>;
  loadRates(): Promise<FuelRates>;
  saveRates(rates: FuelRates): Promise<void>;
}
```

---

## 5. Security & IPC Guidelines (Electron Desktop)

1. **Context Isolation:** `contextIsolation: true` must be enabled on the `BrowserWindow`.
2. **Node Integration Disabled:** `nodeIntegration: false` to eliminate XSS vulnerability vectors.
3. **Preload Bridge:** Expose only specific whitelisted methods via `electron/preload.ts`:

```typescript
// electron/preload.ts
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  isDesktop: true,
  saveRecord: (record: unknown) => ipcRenderer.invoke('db:save-shift', record),
  getRecords: () => ipcRenderer.invoke('db:get-shifts'),
  deleteRecord: (id: string) => ipcRenderer.invoke('db:delete-shift', id),
  saveConfig: (rates: unknown) => ipcRenderer.invoke('config:save-rates', rates),
  getConfig: () => ipcRenderer.invoke('config:get-rates')
});
```

---

## 6. Real-Time Math & Calculation Engine

Calculations must be deterministic, pure, and reactive. They must compute synchronously on input changes without triggering network or disk operations:

1. **Meter Volume:**
   $$\text{Volume (L)} = \max(0, \text{Closing} - \text{Opening})$$
2. **Expected Sale Value:**
   $$\text{Expected (₹)} = \text{Volume} \times \text{Rate}$$
3. **Total Cash Handover:**
   $$\text{Collected (₹)} = \text{Cash} + \text{UPI} + \text{Credit}$$
4. **Variance:**
   $$\text{Difference (₹)} = \text{Collected} - \text{Expected}$$

All decimal math uses standard floating-point safety routines rounded to 2 decimal places (`Math.round((val + Number.EPSILON) * 100) / 100`) to prevent floating-point representation anomalies (e.g., `0.1 + 0.2 !== 0.3`).

---

## 7. Build, Scripts & Distribution Matrix

The `package.json` will expose the following execution commands:

```json
{
  "scripts": {
    "dev": "vite",
    "build:web": "tsc && vite build",
    "preview": "vite preview",
    "electron:dev": "concurrently \"vite\" \"wait-on tcp:5173 && electron .\"",
    "build:electron": "tsc && vite build && electron-builder --win"
  }
}
```

### Packaging Target (Windows Desktop)
* **Installer Format:** NSIS Single-Executable (`.exe`).
* **Artifact Directory:** `dist_electron/`.
* **Desktop Persistence Path:** User's native directory `%APPDATA%/FuelShiftTally/shift_data.json`.