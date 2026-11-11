import { FC } from 'react';
import { useShiftStore } from '../../stores/shiftStore';
import { Badge } from '../common/Badge';
import { formatINR, formatVarianceLabel } from '../../utils/currency';
import { Scale, AlertTriangle, CheckCircle2, TrendingUp } from 'lucide-react';

export const TallyBanner: FC = () => {
  const calculations = useShiftStore((state) => state.calculations);
  const errorMessage = useShiftStore((state) => state.errorMessage);

  const { expectedSale, totalCollected, variance, tallyStatus, isValid } = calculations;

  const getStatusIcon = () => {
    if (!isValid) return <AlertTriangle className="w-5 h-5 text-rose-400" />;
    switch (tallyStatus) {
      case 'TALLY':
      case 'MATCH':
        return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
      case 'SHORTAGE':
        return <AlertTriangle className="w-5 h-5 text-rose-400" />;
      case 'EXCESS':
        return <TrendingUp className="w-5 h-5 text-cyan-400" />;
    }
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all">
      {/* Left Column: Live Shift Balance Snapshot */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <Scale className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Live Shift Balance Status
          </span>
        </div>

        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1 text-sm font-mono">
          <div>
            <span className="text-slate-400 text-xs mr-1.5">Expected Revenue:</span>
            <span className="text-slate-100 font-bold text-base md:text-lg">
              {formatINR(expectedSale)}
            </span>
          </div>
          <div className="text-slate-600 hidden sm:inline">|</div>
          <div>
            <span className="text-slate-400 text-xs mr-1.5">Total Collected:</span>
            <span className="text-slate-100 font-bold text-base md:text-lg">
              {formatINR(totalCollected)}
            </span>
          </div>
        </div>

        {errorMessage && (
          <p className="text-xs text-rose-400 font-medium pt-0.5 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            {errorMessage}
          </p>
        )}
      </div>

      {/* Right Column: Dynamic Status Badge & Net Variance */}
      <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center border-t md:border-t-0 border-slate-700/60 pt-3 md:pt-0">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <Badge status={tallyStatus} className="text-sm px-3.5 py-1">
            {formatVarianceLabel(variance, tallyStatus)}
          </Badge>
        </div>

        <div className="text-right mt-1 font-mono">
          <span className="text-xs text-slate-400 mr-1.5">Net Variance:</span>
          <span
            className={`font-extrabold text-lg md:text-xl ${
              tallyStatus === 'SHORTAGE'
                ? 'text-rose-400'
                : tallyStatus === 'EXCESS'
                ? 'text-cyan-400'
                : 'text-emerald-400'
            }`}
          >
            {variance > 0 ? `+ ${formatINR(variance)}` : variance < 0 ? `- ${formatINR(Math.abs(variance))}` : formatINR(0)}
          </span>
        </div>
      </div>
    </div>
  );
};
