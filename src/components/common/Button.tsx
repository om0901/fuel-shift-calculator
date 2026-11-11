import { ButtonHTMLAttributes, FC, ReactNode } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;
}

export const Button: FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  className,
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/40 select-none';

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs rounded-md gap-1.5',
    md: 'px-4 py-2.5 text-sm rounded-lg gap-2',
    lg: 'px-5 py-3 text-base rounded-xl gap-2.5',
  };

  const variantStyles = {
    primary:
      'bg-blue-600 text-white font-semibold shadow-sm hover:bg-blue-700 active:scale-[0.99] disabled:bg-blue-600/50 disabled:cursor-not-allowed',
    secondary:
      'border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-slate-100 disabled:opacity-50 disabled:cursor-not-allowed',
    danger:
      'text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 p-1.5 rounded-md transition-colors disabled:opacity-50',
    ghost:
      'text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-50',
  };

  return (
    <button
      className={twMerge(
        clsx(
          baseStyles,
          sizeStyles[size],
          variantStyles[variant],
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )
      )}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="inline-flex shrink-0">{icon}</span>}
      {children}
    </button>
  );
};
