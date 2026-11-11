import { FC } from 'react';
import { useShiftStore } from '../../stores/shiftStore';
import { Button } from '../common/Button';
import { RotateCcw, CheckCircle } from 'lucide-react';

export const ActionToolbar: FC = () => {
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

  return (
    <div className="flex flex-wrap items-center justify-end gap-3 pt-2 select-none">
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
  );
};
