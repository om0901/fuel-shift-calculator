import { FC, useEffect, useRef } from 'react';
import { useShiftStore } from '../../stores/shiftStore';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { formatINR, formatLiters, formatVarianceLabel } from '../../utils/currency';
import { CheckCircle2, X } from 'lucide-react';

export const ConfirmShiftModal: FC = () => {
  const isConfirmModalOpen = useShiftStore((state) => state.isConfirmModalOpen);
  const setConfirmModalOpen = useShiftStore((state) => state.setConfirmModalOpen);
  const commitRecordToStorage = useShiftStore((state) => state.commitRecordToStorage);
  const form = useShiftStore((state) => state.form);
  const calculations = useShiftStore((state) => state.calculations);
  const isLoading = useShiftStore((state) => state.isLoading);

  const modalRef = useRef<HTMLDivElement>(null);

  // Keyboard accessibility: Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isConfirmModalOpen) {
        setConfirmModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isConfirmModalOpen, setConfirmModalOpen]);

  if (!isConfirmModalOpen) return null;

  const { fuelType, fuelPrice } = form;
  const { totalLiters, expectedSale, totalCollected, variance, tallyStatus } = calculations;

  const handleConfirm = async () => {
    await commitRecordToStorage();
    setConfirmModalOpen(false);
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      setConfirmModalOpen(false);
    }
  };

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div
        ref={modalRef}
        className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-5 relative select-none"
      >
        {/* Close Icon */}
        <button
          onClick={() => setConfirmModalOpen(false)}
          className="absolute right-4 top-4 p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-700 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h2 id="confirm-modal-title" className="text-lg font-bold text-slate-50">
              Confirm Shift Submission
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Review the verified shift calculations before committing to the local ledger.
          </p>
        </div>

        {/* Summary Receipt Box */}
        <div className="bg-slate-900/90 rounded-xl p-4 border border-slate-700/70 space-y-3 font-mono text-xs">
          <div className="flex justify-between items-center text-slate-400">
            <span>Fuel Product:</span>
            <span className="text-slate-100 font-semibold font-sans">
              {fuelType === 'PETROL' ? 'Petrol (MS)' : 'Diesel (HSD)'} @ ₹{fuelPrice.toFixed(2)}/L
            </span>
          </div>

          <div className="flex justify-between items-center text-slate-400">
            <span>Total Liters Sold:</span>
            <span className="text-slate-100 font-bold text-sm">
              {formatLiters(totalLiters)}
            </span>
          </div>

          <div className="flex justify-between items-center text-slate-400">
            <span>Expected Revenue:</span>
            <span className="text-blue-400 font-bold text-sm">
              {formatINR(expectedSale)}
            </span>
          </div>

          <div className="flex justify-between items-center text-slate-400">
            <span>Actual Handover:</span>
            <span className="text-emerald-400 font-bold text-sm">
              {formatINR(totalCollected)}
            </span>
          </div>

          <div className="border-t border-slate-800 pt-2.5 flex justify-between items-center">
            <span className="text-slate-300 font-semibold">Net Shift Variance:</span>
            <div className="flex items-center gap-2">
              <span
                className={`font-bold text-sm ${
                  variance < 0
                    ? 'text-rose-400'
                    : variance > 0
                    ? 'text-cyan-400'
                    : 'text-emerald-400'
                }`}
              >
                {variance < 0
                  ? `- ${formatINR(Math.abs(variance))}`
                  : variance > 0
                  ? `+ ${formatINR(variance)}`
                  : formatINR(0)}
              </span>
              <Badge status={tallyStatus} className="text-[10px] px-2 py-0.5">
                {formatVarianceLabel(variance, tallyStatus)}
              </Badge>
            </div>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <Button
            variant="secondary"
            onClick={() => setConfirmModalOpen(false)}
            disabled={isLoading}
          >
            Go Back / Edit
          </Button>

          <Button
            variant="primary"
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Confirm & Save'}
          </Button>
        </div>
      </div>
    </div>
  );
};
