import { FC, useState, useEffect, useRef } from 'react';
import { useShiftStore } from '../../stores/shiftStore';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Settings, X, Check } from 'lucide-react';
import { parseNonNegativeNumber } from '../../utils/calculations';

export const SettingsModal: FC = () => {
  const isSettingsModalOpen = useShiftStore((state) => state.isSettingsModalOpen);
  const setSettingsModalOpen = useShiftStore((state) => state.setSettingsModalOpen);
  const rates = useShiftStore((state) => state.rates);
  const updateRates = useShiftStore((state) => state.updateRates);
  const isLoading = useShiftStore((state) => state.isLoading);

  const [petrolPrice, setPetrolPrice] = useState<string>(rates.petrolPrice.toString());
  const [dieselPrice, setDieselPrice] = useState<string>(rates.dieselPrice.toString());
  const [error, setError] = useState<string | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isSettingsModalOpen) {
      setPetrolPrice(rates.petrolPrice.toString());
      setDieselPrice(rates.dieselPrice.toString());
      setError(null);
    }
  }, [isSettingsModalOpen, rates]);

  // Keyboard accessibility: Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSettingsModalOpen) {
        setSettingsModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSettingsModalOpen, setSettingsModalOpen]);

  if (!isSettingsModalOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseNonNegativeNumber(petrolPrice);
    const d = parseNonNegativeNumber(dieselPrice);

    if (p <= 0 || d <= 0) {
      setError('Prices must be greater than ₹0.00');
      return;
    }

    await updateRates({ petrolPrice: p, dieselPrice: d });
    setSettingsModalOpen(false);
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      setSettingsModalOpen(false);
    }
  };

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-dialog-title"
    >
      <div
        ref={modalRef}
        className="w-full max-w-sm bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-5 relative select-none"
      >
        {/* Close Icon */}
        <button
          onClick={() => setSettingsModalOpen(false)}
          className="absolute right-4 top-4 p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-700 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-400">
              <Settings className="w-5 h-5" />
            </div>
            <h2 id="settings-dialog-title" className="text-lg font-bold text-slate-50">
              Fuel Rate Configuration
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Set default prices per liter for instant shift calculation.
          </p>
        </div>

        {/* Form Fields */}
        <form onSubmit={handleSave} className="space-y-4 pt-1">
          <Input
            label="Petrol (MS) Price"
            type="number"
            step="0.01"
            min="0.01"
            prefix="₹"
            suffix="/ L"
            value={petrolPrice}
            onChange={(e) => setPetrolPrice(e.target.value)}
          />

          <Input
            label="Diesel (HSD) Price"
            type="number"
            step="0.01"
            min="0.01"
            prefix="₹"
            suffix="/ L"
            value={dieselPrice}
            onChange={(e) => setDieselPrice(e.target.value)}
          />

          {error && <p className="text-xs text-rose-400 font-medium">{error}</p>}

          {/* Modal Actions */}
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-700/60">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setSettingsModalOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              variant="primary"
              disabled={isLoading}
              icon={<Check className="w-4 h-4" />}
            >
              {isLoading ? 'Saving...' : 'Save Rates'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
