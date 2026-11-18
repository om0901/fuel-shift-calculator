import { FC, useState, useEffect } from 'react';
import { useShiftStore } from '../../stores/shiftStore';
import { formatINR } from '../../utils/currency';
import { Banknote, ChevronDown, ChevronUp, RotateCcw, CheckCircle2, Coins } from 'lucide-react';

interface DenominationCounts {
  500: string;
  200: string;
  100: string;
  50: string;
  20: string;
  10: string;
}

const DENOMINATIONS: (keyof DenominationCounts)[] = [500, 200, 100, 50, 20, 10];

const INITIAL_COUNTS: DenominationCounts = {
  500: '',
  200: '',
  100: '',
  50: '',
  20: '',
  10: '',
};

export const DenominationCounter: FC = () => {
  const form = useShiftStore((state) => state.form);
  const updateInputField = useShiftStore((state) => state.updateInputField);

  const [isOpen, setIsOpen] = useState(false);
  const [counts, setCounts] = useState<DenominationCounts>(INITIAL_COUNTS);
  const [coinsAmount, setCoinsAmount] = useState<string>('');

  // If the parent form cashAmount is reset to empty, reset denomination counts too
  useEffect(() => {
    if (form.cashAmount === '' && (Object.values(counts).some((v) => v !== '') || coinsAmount !== '')) {
      setCounts(INITIAL_COUNTS);
      setCoinsAmount('');
    }
  }, [form.cashAmount, counts, coinsAmount]);

  // Compute total denomination sum & total notes count
  const calculateTotal = (newCounts: DenominationCounts, coins: string): number => {
    let sum = 0;
    for (const denom of DENOMINATIONS) {
      const count = parseInt(newCounts[denom], 10);
      if (!isNaN(count) && count > 0) {
        sum += denom * count;
      }
    }
    const coinsNum = parseFloat(coins);
    if (!isNaN(coinsNum) && coinsNum > 0) {
      sum += coinsNum;
    }
    return sum;
  };

  const totalNotes = DENOMINATIONS.reduce((acc, denom) => {
    const c = parseInt(counts[denom], 10);
    return acc + (!isNaN(c) && c > 0 ? c : 0);
  }, 0);

  const currentTotal = calculateTotal(counts, coinsAmount);

  const handleCountChange = (denom: keyof DenominationCounts, value: string) => {
    // Only allow positive integers
    const cleanVal = value.replace(/[^0-9]/g, '');
    const updated = { ...counts, [denom]: cleanVal };
    setCounts(updated);

    const newTotal = calculateTotal(updated, coinsAmount);
    updateInputField('cashAmount', newTotal > 0 ? newTotal.toString() : '');
  };

  const handleCoinsChange = (value: string) => {
    // Allow positive float for coins
    const cleanVal = value.replace(/[^0-9.]/g, '');
    setCoinsAmount(cleanVal);

    const newTotal = calculateTotal(counts, cleanVal);
    updateInputField('cashAmount', newTotal > 0 ? newTotal.toString() : '');
  };

  const handleClear = () => {
    setCounts(INITIAL_COUNTS);
    setCoinsAmount('');
    updateInputField('cashAmount', '');
  };

  return (
    <div className="w-full select-none">
      {/* Toggle Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700/80 hover:border-blue-500/60 hover:bg-slate-800 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-all focus:outline-none focus:ring-1 focus:ring-blue-500"
        aria-expanded={isOpen}
      >
        <Banknote className="w-3.5 h-3.5" />
        <span>Count Notes (₹500 / ₹200 / ₹100...)</span>
        {isOpen ? (
          <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        )}
      </button>

      {/* Full-Width Collapsible Panel */}
      {isOpen && (
        <div className="mt-2.5 bg-slate-900/90 rounded-xl p-3.5 sm:p-4 border border-slate-700/80 shadow-inner space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-1.5">
              <Banknote className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Note Denomination Breakdown
              </span>
            </div>

            <button
              type="button"
              onClick={handleClear}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-rose-400 transition-colors"
              title="Clear all note counts"
            >
              <RotateCcw className="w-3 h-3" />
              Reset Counts
            </button>
          </div>

          {/* Clean Single-Column Vertical List */}
          <div className="flex flex-col gap-2">
            {DENOMINATIONS.map((denom) => {
              const countVal = counts[denom];
              const countNum = parseInt(countVal, 10) || 0;
              const subtotal = denom * countNum;

              return (
                <div
                  key={denom}
                  className="grid grid-cols-[72px_1fr_90px] sm:grid-cols-[72px_1fr_100px] items-center gap-3 bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800/80 hover:border-slate-700/80 transition-colors"
                >
                  {/* Left: Fixed-width denomination badge */}
                  <span className="inline-flex items-center justify-center font-mono font-bold text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded w-[72px] shrink-0 text-center">
                    ₹{denom}
                  </span>

                  {/* Center: Numeric input with x multiplier label */}
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-slate-500 text-xs font-mono font-semibold select-none">×</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="0"
                      value={countVal}
                      onChange={(e) => handleCountChange(denom, e.target.value)}
                      className="w-full max-w-[110px] bg-slate-900 border border-slate-700 rounded-md px-2 py-1 text-xs text-center font-mono text-slate-50 placeholder-slate-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  {/* Right: Tabular subtotal */}
                  <span className="font-mono text-xs text-slate-200 text-right font-semibold tabular-nums">
                    = ₹{subtotal.toLocaleString('en-IN')}
                  </span>
                </div>
              );
            })}

            {/* Coins Row */}
            <div className="grid grid-cols-[72px_1fr_90px] sm:grid-cols-[72px_1fr_100px] items-center gap-3 bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800/80 hover:border-slate-700/80 transition-colors">
              {/* Left: Fixed-width badge */}
              <span className="inline-flex items-center justify-center font-mono font-bold text-xs text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded w-[72px] shrink-0 text-center gap-1">
                <Coins className="w-3 h-3" />
                Coins
              </span>

              {/* Center: Numeric input with ₹ label */}
              <div className="flex items-center justify-center gap-2">
                <span className="text-slate-500 text-xs font-mono font-semibold select-none">₹</span>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  placeholder="0.00"
                  value={coinsAmount}
                  onChange={(e) => handleCoinsChange(e.target.value)}
                  className="w-full max-w-[110px] bg-slate-900 border border-slate-700 rounded-md px-2 py-1 text-xs text-center font-mono text-slate-50 placeholder-slate-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Right: Tabular subtotal */}
              <span className="font-mono text-xs text-slate-200 text-right font-semibold tabular-nums">
                = ₹{(parseFloat(coinsAmount) || 0).toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>

          {/* Footer Summary Bar: Single horizontal bar */}
          <div className="flex justify-between items-center pt-2.5 border-t border-slate-800 text-xs font-mono">
            <span className="text-slate-400 text-xs flex items-center gap-1.5">
              Total Notes Count: <strong className="text-slate-100 font-bold">{totalNotes}</strong>
            </span>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-sans font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <CheckCircle2 className="w-3 h-3" />
                Live Synced
              </span>
              <span className="text-slate-50 font-bold text-sm tabular-nums">
                {formatINR(currentTotal)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
