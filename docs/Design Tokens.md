# Design Specifications: Fuel Shift Cash & Meter Calculator (`DESIGN.md`)

## 1. Master Page & View Index
The software consists of the following screens, modals, and views:
1. **Screen 1: Main Tally Dashboard (`/`)**
   - Top Navigation & Shift Header
   - Two-Column Interactive Calculation Workspace:
     - Left Card: Meter Sales Calculation
     - Right Card: Cash & Digital Collection
   - Real-time Tally Variance Card & Status Badge
   - Sticky Actions Footer (Save Shift, Reset Form)
2. **Screen 2: Shift History & Audit Table (`#history-section` or modal view)**
   - Filter & Search Ribbon (Date filter, status filter)
   - Detailed Ledger History Data Table
   - Delete/Export Actions
3. **Modal 1: Shift Confirmation & Receipt Modal (`#modal-confirm`)**
   - Summary breakdown dialog before permanent database commit
4. **Modal 2: Settings / Fuel Rate Preset Drawer (`#modal-settings`)**
   - Quick rate configuration (Default Petrol/Diesel pricing per liter)

---

## 2. Global Design Tokens

### 2.1. Color Palette (Dark Slate Theme)
| Token Key | Variable | Hex Code | Tailwind Class | Application |
|---|---|---|---|---|
| Background Main | `--bg-base` | `#0F172A` | `bg-slate-900` | Main window body and background |
| Surface / Cards | `--bg-surface` | `#1E293B` | `bg-slate-800` | Calculation cards, tables, popups |
| Surface Subtle | `--bg-surface-subtle` | `#334155` | `bg-slate-700` | Input backgrounds, table headers |
| Border Standard | `--border-subtle` | `#334155` | `border-slate-700` | Card borders, dividers |
| Border Focus | `--border-focus` | `#3B82F6` | `border-blue-500` | Active input outlines |
| Primary Accent | `--accent-primary` | `#2563EB` | `bg-blue-600` | Save Shift and primary CTA buttons |
| Primary Hover | `--accent-hover` | `#1D4ED8` | `hover:bg-blue-700`| Button hover state |
| Tally Match (Green) | `--status-success` | `#10B981` | `text-emerald-400` / `bg-emerald-500/10` | Perfect Tally (0 Difference) |
| Shortage (Red) | `--status-danger` | `#EF4444` | `text-rose-400` / `bg-rose-500/10` | Shortage warning (< 0) |
| Excess (Blue) | `--status-info` | `#06B6D4` | `text-cyan-400` / `bg-cyan-500/10` | Excess cash (> 0) |
| Text Primary | `--text-primary` | `#F8FAFC` | `text-slate-50` | Primary numbers, headings |
| Text Secondary | `--text-secondary` | `#94A3B8` | `text-slate-400` | Labels, placeholders, timestamps |

### 2.2. Typography
- **Font Family:** `Inter, system-ui, -apple-system, sans-serif`
- **Numeric Font (Monospace for Currency):** `ui-monospace, SFMono-Regular, Menlo, monospace`
- **Scale:**
  - Header Title: `text-xl font-bold tracking-tight text-slate-50`
  - Card Section Title: `text-sm font-semibold uppercase tracking-wider text-slate-400`
  - Big Calculation Numbers: `text-3xl font-extrabold font-mono`
  - Form Input & Labels: `text-sm font-medium`
  - Helper & Error Messages: `text-xs font-normal`

### 2.3. Common Component Rules
- **Input Fields:**
  - Standard styling: `w-full rounded-lg bg-slate-900 border border-slate-700 px-3.5 py-2.5 text-slate-50 placeholder-slate-500 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors`
  - Invalid state: `border-rose-500 focus:border-rose-500 focus:ring-rose-500`
- **Buttons:**
  - Primary: `rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 active:scale-[0.99] transition-all`
  - Secondary/Outline: `rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-700 transition-colors`
  - Danger (Delete): `text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 p-1.5 rounded-md transition-colors`
- **Status Badges:**
  - Rounded pill badges: `inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold`

---

## 3. Screen Specifications & Layout Hierarchy

### Screen 1: Main Tally Dashboard (`/`)
Desktop 1-window responsive layout (`h-screen flex flex-col bg-slate-900 text-slate-50 overflow-y-auto`).

```text
[Main Application Viewport]
├── [Top Navigation Bar: h-16 border-b border-slate-800 px-6 flex items-center justify-between]
│   ├── [Brand Cluster]
│   │   ├── Fuel Icon (Lucide: Fuel) in text-blue-500
│   │   ├── App Title: "FuelShift Tally" (text-lg font-bold)
│   │   └── Badge: "Offline Engine Active" (bg-slate-800 text-slate-400 text-xs px-2 py-0.5)
│   └── [Header Controls]
│       ├── Shift Date/Time: Auto-updating current timestamp
│       └── Settings Button (Icon: Settings) -> Opens Modal 2
│
├── [Main Content Container: max-w-7xl mx-auto w-full p-6 space-y-6 flex-1]
│   │
│   ├── [Top Summary Banner: Real-Time Tally Variance]
│   │   └── [Card: bg-slate-800 border rounded-xl p-5 flex items-center justify-between]
│   │       ├── [Left Column: Expected vs Collected Snapshot]
│   │       │   ├── Subtitle: "Live Shift Balance Status"
│   │       │   └── Big Figures: Expected ₹X,XXX.XX | Collected ₹X,XXX.XX
│   │       └── [Right Column: Status Badge & Difference Amount]
│   │           ├── If Match (₹0): Badge "PERFECT TALLY" (bg-emerald-500/10 text-emerald-400 border border-emerald-500/30)
│   │           ├── If Negative: Badge "SHORTAGE - ₹XXX.XX" (bg-rose-500/10 text-rose-400 border border-rose-500/30)
│   │           └── If Positive: Badge "EXCESS + ₹XXX.XX" (bg-cyan-500/10 text-cyan-400 border border-cyan-500/30)
│   │
│   ├── [Two-Column Calculation Grid: grid grid-cols-1 lg:grid-cols-2 gap-6]
│   │   │
│   │   ├── [Left Card: Nozzle Meter Reading & Sales Calculation]
│   │   │   └── [Card: bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-4]
│   │   │       ├── Header: "1. Meter Sales Engine" + Fuel Dropdown (Petrol / Diesel)
│   │   │       ├── [Input Group: Opening Meter Reading]
│   │   │       │   └── Number input (step: 0.01, placeholder: "0.00")
│   │   │       ├── [Input Group: Closing Meter Reading]
│   │   │       │   ├── Number input (step: 0.01, placeholder: "0.00")
│   │   │       │   └── Error Label (Conditional): "Closing cannot be less than opening reading"
│   │   │       ├── [Input Group: Fuel Rate per Liter (₹)]
│   │   │       │   └── Number input (default: 96.72, step: 0.01)
│   │   │       └── [Calculated Display Block: bg-slate-900/60 rounded-lg p-4 border border-slate-700/50]
│   │   │           ├── Total Volume Sold: "[Closing - Opening] Liters" (text-xl font-mono font-bold text-white)
│   │   │           └── Expected Shift Sale: "₹ [Liters * Rate]" (text-2xl font-mono font-bold text-blue-400)
│   │   │
│   │   └── [Right Card: Cash & Digital Collection Engine]
│   │       └── [Card: bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-4]
│   │           ├── Header: "2. Cash & Collection Engine"
│   │           ├── [Input Group: Physical Cash Collected (₹)]
│   │           │   └── Number input (placeholder: "0.00")
│   │           ├── [Input Group: Online / UPI Payments (₹)]
│   │           │   └── Number input (placeholder: "0.00")
│   │           ├── [Input Group: Credit / Khata Slips (₹)]
│   │           │   └── Number input (placeholder: "0.00")
│   │           └── [Calculated Display Block: bg-slate-900/60 rounded-lg p-4 border border-slate-700/50]
│   │               ├── Collection Split: "Cash: ₹X | UPI: ₹Y | Credit: ₹Z" (text-xs text-slate-400)
│   │               └── Total Received Collection: "₹ [Cash + UPI + Credit]" (text-2xl font-mono font-bold text-emerald-400)
│   │
│   └── [Action Toolbar: flex items-center justify-end gap-3 pt-2]
│       ├── Button: "Reset Inputs" (Secondary/Outline)
│       └── Button: "Save & Commit Shift Record" (Primary Blue CTA) -> Triggers Modal 1
│
└── [Section 2: Shift History Table (Embedded on Dashboard)]
    └── [Card: bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-4]
        ├── [Table Header Strip: flex justify-between items-center]
        │   ├── Title: "Recent Shift Logs"
        │   └── Actions: "Export CSV / Print" button
        └── [Data Table]
            └── (See Screen 2 details below)
```

---

### Screen 2: Shift History & Audit Table View

```text
[Shift History Table Component]
├── [Filter Header Bar]
│   ├── Search bar (filter by date or operator)
│   └── Status Filter Tabs: [All] | [Tally OK] | [Shortage Alerts]
└── [Table Structure: w-full text-left text-sm]
    ├── [Table Head: bg-slate-900/80 text-slate-400 uppercase text-xs]
    │   ├── Date & Time
    │   ├── Fuel Type
    │   ├── Meter Liters (Closing - Opening)
    │   ├── Expected Sale (₹)
    │   ├── Total Collected (₹)
    │   ├── Variance / Status
    │   └── Action (Delete)
    └── [Table Body: divide-y divide-slate-700]
        └── [Data Row Example]
            ├── "04 Nov 2026, 02:30 PM"
            ├── "Petrol (MS)"
            ├── "120.50 L" (4520.50 - 4400.00)
            ├── "₹ 11,654.76"
            ├── "₹ 11,600.00"
            ├── Badge: "Shortage (- ₹54.76)" in red badge
            └── Trash Icon Button (deletes item with confirmation)
```

---

### Modal 1: Shift Confirmation Dialog (`#modal-confirm`)

```text
[Backdrop: fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center]
└── [Modal Window: w-full max-w-md bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-2xl]
    ├── Header: "Confirm Shift Submission"
    ├── Subtext: "Review the verified shift calculations before saving to local ledger."
    ├── [Summary Receipt Box: bg-slate-900 rounded-lg p-4 space-y-2 text-sm font-mono]
    │   ├── Line: Total Liters Sold  ---------> 120.50 L
    │   ├── Line: Expected Sale Cash ---------> ₹ 11,654.76
    │   ├── Line: Actual Handover    ---------> ₹ 11,600.00
    │   ├── Divider (border-slate-800)
    │   └── Line: Net Shift Variance ---------> - ₹ 54.76 (Shortage)
    └── [Modal Action Buttons: grid grid-cols-2 gap-3 mt-6]
        ├── Button: "Go Back / Edit" (Outline Button)
        └── Button: "Confirm & Save" (Primary Blue Button) -> Saves to DB & closes modal
```

---

### Modal 2: Settings & Fuel Rate Presets (`#modal-settings`)

```text
[Backdrop: fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center]
└── [Modal Window: w-full max-w-sm bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-2xl]
    ├── Header: "Fuel Rate Configuration"
    ├── Subtext: "Set default prices per liter for instant calculation."
    ├── [Form Fields: space-y-4 my-4]
    │   ├── [Field: Petrol (MS) Price ₹]
    │   │   └── Input: default "96.72"
    │   └── [Field: Diesel (HSD) Price ₹]
    │       └── Input: default "89.62"
    └── [Modal Actions: flex justify-end gap-3]
        ├── Button: "Cancel" (Ghost)
        └── Button: "Save Rates" (Primary Blue)
```

---

## 4. UI State Rules & Edge Case Specs

1. **Empty State (History Table):**
   - When no shift records exist: Centered container with a Lucide `ClipboardList` icon in `text-slate-600`, text: *"No shifts logged yet. Complete the calculation above and click Save."*
2. **Reading Validation Rule:**
   - If `Closing Reading < Opening Reading`:
     - Highlight Closing Reading input border with `border-rose-500`.
     - Disable the "Save Shift" button (`opacity-50 cursor-not-allowed`).
     - Display inline message: *"Closing reading cannot be lower than opening reading"*.
3. **Responsive Breakpoints:**
   - On screens $\ge 1024\text{px}$ (Desktop): Two columns side-by-side (`grid-cols-2`).
   - On screens $< 1024\text{px}$ (Mobile/Tablet web portal): Single stacked column (`grid-cols-1`).