import { FC } from 'react';
import { useShiftStore } from '../../stores/shiftStore';
import { Input } from '../common/Input';
import { formatINR, formatLiters } from '../../utils/currency';
import { FuelType } from '../../types';
import { Gauge, Flame } from 'lucide-react';

export const MeterSalesCard: FC = () => {
  const form = useShiftStore((state) => state.form);
  const calculations = useShiftStore((state) => state.calculations);
  const updateInputField = useShiftStore((state) => state.updateInputField);
  const setFuelType = useShiftStore((state) => state.setFuelType);

  const { openingReading, closingReading, fuelType, fuelPrice } = form;
  const { totalLiters, expectedSale, isValid, errorMessage } = calculations;

  // Determine if error is specific to closing reading
  const isClosingError = !isValid && errorMessage?.toLowerCase().includes('closing');

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 sm:p-6 space-y-5 shadow-sm">
      {/* Header Strip & Fuel Product Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700/60 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-400">
            <Gauge className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-200">
            1. Meter Sales Engine
          </h2>
        </div>

        {/* Fuel Type Switcher */}
        <div className="inline-flex rounded-lg bg-slate-900 p-1 border border-slate-700">
          {(['PETROL', 'DIESEL'] as FuelType[]).map((type) => {
            const isActive = fuelType === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => setFuelType(type)}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Flame className={`w-3 h-3 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                {type === 'PETROL' ? 'Petrol (MS)' : 'Diesel (HSD)'}
              </button>
            );
          })}
        </div>
      </div>

      {/* Input Fields Grid */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Opening Meter Reading"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={openingReading}
            onChange={(e) => updateInputField('openingReading', e.target.value)}
            suffix="L"
          />

          <Input
            label="Closing Meter Reading"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={closingReading}
            error={isClosingError ? errorMessage : undefined}
            onChange={(e) => updateInputField('closingReading', e.target.value)}
            suffix="L"
          />
        </div>

        <Input
          label="Fuel Rate per Liter"
          type="number"
          step="0.01"
          min="0.01"
          placeholder="0.00"
          value={fuelPrice}
          prefix="₹"
          suffix="/ Liter"
          onChange={(e) => updateInputField('fuelPrice', e.target.value)}
          helperText={`Default ${fuelType === 'PETROL' ? 'Petrol' : 'Diesel'} rate applied.`}
        />
      </div>

      {/* Real-time Computed Display Block */}
      <div className="bg-slate-900/70 rounded-lg p-4 border border-slate-700/60 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">
            Total Volume Dispensed:
          </span>
          <span className="text-xl font-mono font-bold text-white">
            {formatLiters(totalLiters)}
          </span>
        </div>

        <div className="border-t border-slate-800 pt-2 flex items-center justify-between">
          <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">
            Expected Shift Sale:
          </span>
          <span className="text-2xl font-mono font-extrabold text-blue-400">
            {formatINR(expectedSale)}
          </span>
        </div>
      </div>
    </div>
  );
};
