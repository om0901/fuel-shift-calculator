import { FC } from 'react';
import { useShiftStore, getTodayDateString } from '../../stores/shiftStore';
import { Button } from '../common/Button';
import { RotateCcw, CheckCircle, Calendar } from 'lucide-react';

export const ActionToolbar: FC = () => {
  const form = useShiftStore((state) => state.form);
  const updateInputField = useShiftStore((state) => state.updateInputField);
  const calculations = useShiftStore((state) => state.calculations);
  const resetActiveForm = useShiftStore((state) => state.resetActiveForm);
  const setConfirmModalOpen = useShiftStore((state) => state.setConfirmModalOpen);
  const isLoading = useShiftStore((state) => state.isLoading);

  const { isValid, totalLiters, totalCollected } = calculations;

  // Form can be submitted if calculations are valid and there's meaningful volume or money entered
  const canSave = isValid && (totalLiters > 0 || totalCollected > 0);

  const handleOpenConfirm = () => {
    if (!canSave) return;
    setConfirmModalOpen(true);
  };

  const selectedDate = form.shiftDate || getTodayDateString();

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 pt-2 select-none">
      {/* Shift Date Selector */}
      <div className="flex items-center gap-2.5 bg-slate-800 border border-slate-700/80 px-3.5 py-2 rounded-xl shadow-sm">
        <div className="p-1 rounded-md bg-blue-500/10 text-blue-400">
          <Calendar className="w-4 h-4" />
        </div>
        <label
          htmlFor="shift-date-picker"
          className="text-xs font-semibold uppercase tracking-wider text-slate-300 shrink-0"
        >
          Shift Date:
        </label>
        <input
          id="shift-date-picker"
          type="date"
          value={selectedDate}
          onChange={(e) => updateInputField('shiftDate', e.target.value)}
          className="rounded-lg bg-slate-900 border border-slate-700 px-3 py-1.5 text-xs text-slate-100 font-mono focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors [color-scheme:dark]"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="secondary"
          onClick={resetActiveForm}
          icon={<RotateCcw className="w-4 h-4" />}
          disabled={isLoading}
        >
          Reset Inputs
        </Button>

        <Button
          variant="primary"
          onClick={handleOpenConfirm}
          disabled={!canSave || isLoading}
          icon={<CheckCircle className="w-4 h-4" />}
        >
          {isLoading ? 'Processing...' : 'Save & Commit Shift Record'}
        </Button>
      </div>
    </div>
  );
};
