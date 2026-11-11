import { FC, ReactNode } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { TallyStatus } from '../../types';

export interface BadgeProps {
  status?: TallyStatus;
  variant?: 'success' | 'danger' | 'info' | 'neutral';
  children: ReactNode;
  className?: string;
  dot?: boolean;
}

export const Badge: FC<BadgeProps> = ({
  status,
  variant,
  children,
  className,
  dot = true,
}) => {
  // Determine variant based on TallyStatus if provided
  let activeVariant = variant || 'neutral';
  if (status) {
    if (status === 'TALLY' || status === 'MATCH') {
      activeVariant = 'success';
    } else if (status === 'SHORTAGE') {
      activeVariant = 'danger';
    } else if (status === 'EXCESS') {
      activeVariant = 'info';
    }
  }

  const variantStyles = {
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    danger: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    info: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    neutral: 'bg-slate-800 text-slate-400 border-slate-700',
  };

  const dotColors = {
    success: 'bg-emerald-400',
    danger: 'bg-rose-400',
    info: 'bg-cyan-400',
    neutral: 'bg-slate-400',
  };

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border tracking-wide transition-colors',
          variantStyles[activeVariant],
          className
        )
      )}
    >
      {dot && (
        <span
          className={clsx('w-1.5 h-1.5 rounded-full', dotColors[activeVariant])}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
};
