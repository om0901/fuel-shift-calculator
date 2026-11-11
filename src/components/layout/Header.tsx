import { useState, useEffect, FC } from 'react';
import { Fuel, Settings, WifiOff } from 'lucide-react';
import { useShiftStore } from '../../stores/shiftStore';

export const Header: FC = () => {
  const setSettingsModalOpen = useShiftStore((state) => state.setSettingsModalOpen);
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40 select-none">
      {/* Brand Cluster */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-blue-600/10 border border-blue-500/20 text-blue-500 flex items-center justify-center shadow-inner">
          <Fuel className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold tracking-tight text-slate-50">
              FuelShift Tally
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 bg-slate-800/80 border border-slate-700/60 text-slate-400 text-xs px-2 py-0.5 rounded-full font-medium">
              <WifiOff className="w-3 h-3 text-emerald-400" />
              Offline Engine Active
            </span>
          </div>
          <p className="text-xs text-slate-400 hidden sm:block">
            Nozzle Meter &amp; Cash Reconciliation System
          </p>
        </div>
      </div>

      {/* Header Controls */}
      <div className="flex items-center gap-4">
        <div className="hidden md:flex flex-col items-end">
          <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
            Shift Timestamp
          </span>
          <span className="text-xs font-mono text-slate-200">
            {currentTime || 'Loading...'}
          </span>
        </div>

        <button
          onClick={() => setSettingsModalOpen(true)}
          className="p-2 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-slate-100 hover:bg-slate-700 hover:border-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          title="Fuel Rate Configuration"
          aria-label="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
