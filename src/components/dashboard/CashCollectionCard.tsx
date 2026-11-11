import { FC } from 'react';
import { useShiftStore } from '../../stores/shiftStore';
import { Input } from '../common/Input';
import { formatINR } from '../../utils/currency';
import { parseNonNegativeNumber } from '../../utils/calculations';
import { Banknote, QrCode, FileText, Wallet } from 'lucide-react';

export const CashCollectionCard: FC = () => {
  const form = useShiftStore((state) => state.form);
  const calculations = useShiftStore((state) => state.calculations);
  const updateInputField = useShiftStore((state) => state.updateInputField);

  const { cashAmount, upiAmount, creditAmount, notes } = form;
  const { totalCollected } = calculations;

  const cashNum = parseNonNegativeNumber(cashAmount);
  const upiNum = parseNonNegativeNumber(upiAmount);
  const creditNum = parseNonNegativeNumber(creditAmount);

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 sm:p-6 space-y-5 shadow-sm">
      {/* Header Strip */}
      <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-400">
            <Wallet className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-200">
            2. Cash &amp; Collection Engine
          </h2>
        </div>
        <span className="text-xs text-slate-400 font-mono">
          Handover Inflow
        </span>
      </div>

      {/* Input Fields Grid */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Physical Cash (₹)"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            prefix="₹"
            value={cashAmount}
            onChange={(e) => updateInputField('cashAmount', e.target.value)}
          />

          <Input
            label="Online / UPI Payments (₹)"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            prefix="₹"
            value={upiAmount}
            onChange={(e) => updateInputField('upiAmount', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Credit / Khata Slips (₹)"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            prefix="₹"
            value={creditAmount}
            onChange={(e) => updateInputField('creditAmount', e.target.value)}
          />

          <Input
            label="Operator Remark / Notes"
            type="text"
            placeholder="e.g. Nozzle 02 - Day Shift"
            value={notes || ''}
            onChange={(e) => updateInputField('notes', e.target.value)}
          />
        </div>
      </div>

      {/* Real-time Computed Display Block */}
      <div className="bg-slate-900/70 rounded-lg p-4 border border-slate-700/60 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-slate-400">
          <span className="flex items-center gap-1">
            <Banknote className="w-3 h-3 text-slate-500" />
            Cash: {formatINR(cashNum)}
          </span>
          <span className="flex items-center gap-1">
            <QrCode className="w-3 h-3 text-slate-500" />
            UPI: {formatINR(upiNum)}
          </span>
          <span className="flex items-center gap-1">
            <FileText className="w-3 h-3 text-slate-500" />
            Credit: {formatINR(creditNum)}
          </span>
        </div>

        <div className="border-t border-slate-800 pt-2 flex items-center justify-between">
          <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">
            Total Handover Collected:
          </span>
          <span className="text-2xl font-mono font-extrabold text-emerald-400">
            {formatINR(totalCollected)}
          </span>
        </div>
      </div>
    </div>
  );
};
