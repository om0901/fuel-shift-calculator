import { InputHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string | null;
  helperText?: string;
  prefix?: string;
  suffix?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, prefix, suffix, className, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-slate-300"
          >
            {label}
          </label>
        )}
        <div className="relative rounded-lg shadow-sm">
          {prefix && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 text-sm font-mono">
              {prefix}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={twMerge(
              clsx(
                'w-full rounded-lg bg-slate-900 border border-slate-700 px-3.5 py-2.5 text-slate-50 placeholder-slate-500 text-sm transition-colors',
                'focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500',
                prefix && 'pl-9',
                suffix && 'pr-9',
                error && 'border-rose-500 focus:border-rose-500 focus:ring-rose-500 text-rose-50',
                className
              )
            )}
            {...props}
          />
          {suffix && (
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 text-sm">
              {suffix}
            </div>
          )}
        </div>
        {error ? (
          <p className="text-xs text-rose-400 font-normal">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-slate-400">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
