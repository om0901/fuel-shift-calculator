import { FC, useEffect } from 'react';
import { useShiftStore } from '../../stores/shiftStore';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const Toast: FC = () => {
  const toast = useShiftStore((state) => state.toast);
  const clearToast = useShiftStore((state) => state.clearToast);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      clearToast();
    }, 3500);
    return () => clearTimeout(timer);
  }, [toast, clearToast]);

  if (!toast) return null;

  const typeConfig = {
    success: {
      border: 'border-emerald-500/40',
      bg: 'bg-slate-900/95',
      text: 'text-emerald-400',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />,
    },
    error: {
      border: 'border-rose-500/40',
      bg: 'bg-slate-900/95',
      text: 'text-rose-400',
      icon: <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />,
    },
    info: {
      border: 'border-blue-500/40',
      bg: 'bg-slate-900/95',
      text: 'text-blue-400',
      icon: <Info className="w-4 h-4 text-blue-400 shrink-0" />,
    },
  }[toast.type];

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-200">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl backdrop-blur-md ${typeConfig.bg} ${typeConfig.border} text-slate-100 text-xs sm:text-sm font-medium max-w-md`}
        role="alert"
      >
        {typeConfig.icon}
        <span className="flex-1">{toast.text}</span>
        <button
          onClick={clearToast}
          className="text-slate-400 hover:text-slate-200 p-0.5 rounded transition-colors"
          aria-label="Dismiss toast"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

