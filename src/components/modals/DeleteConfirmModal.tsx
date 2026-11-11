import { FC, useEffect, useRef } from 'react';
import { useShiftStore } from '../../stores/shiftStore';
import { Button } from '../common/Button';
import { formatINR, formatLiters } from '../../utils/currency';
import { Trash2, X } from 'lucide-react';

export const DeleteConfirmModal: FC = () => {
  const deleteRecordTarget = useShiftStore((state) => state.deleteRecordTarget);
  const setDeleteRecordTarget = useShiftStore((state) => state.setDeleteRecordTarget);
  const removeRecord = useShiftStore((state) => state.removeRecord);
  const isLoading = useShiftStore((state) => state.isLoading);

  const modalRef = useRef<HTMLDivElement>(null);

  // Keyboard accessibility: Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && deleteRecordTarget) {
        setDeleteRecordTarget(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [deleteRecordTarget, setDeleteRecordTarget]);

  if (!deleteRecordTarget) return null;

  const handleDelete = async () => {
    await removeRecord(deleteRecordTarget.id);
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      setDeleteRecordTarget(null);
    }
  };

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-dialog-title"
    >
      <div
        ref={modalRef}
        className="w-full max-w-sm bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4 relative select-none"
      >
        <button
          onClick={() => setDeleteRecordTarget(null)}
          className="absolute right-4 top-4 p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-700 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h2 id="delete-dialog-title" className="text-base font-bold text-slate-100">
              Delete Shift Record?
            </h2>
            <p className="text-xs text-slate-400">
              This action cannot be undone.
            </p>
          </div>
        </div>

        <div className="bg-slate-900/90 rounded-xl p-3.5 border border-slate-700/60 text-xs font-mono space-y-1.5 text-slate-300">
          <div className="flex justify-between">
            <span className="text-slate-500">Date:</span>
            <span className="text-slate-200">
              {new Date(deleteRecordTarget.timestamp).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Volume:</span>
            <span className="text-slate-200">{formatLiters(deleteRecordTarget.totalLiters)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Handover:</span>
            <span className="text-emerald-400 font-bold">
              {formatINR(deleteRecordTarget.totalCollected)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <Button
            variant="secondary"
            onClick={() => setDeleteRecordTarget(null)}
            disabled={isLoading}
          >
            Cancel
          </Button>

          <Button
            variant="danger"
            onClick={handleDelete}
            disabled={isLoading}
            className="w-full justify-center bg-rose-600 hover:bg-rose-700 text-white font-semibold py-2.5 rounded-lg shadow-sm"
          >
            {isLoading ? 'Deleting...' : 'Delete Record'}
          </Button>
        </div>
      </div>
    </div>
  );
};
