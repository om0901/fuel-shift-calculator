import { TallyStatus } from '../types';

/**
 * Formats a numeric amount into Indian Rupee currency string: ₹ #,##,###.##
 */
export function formatINR(amount: number): string {
  const safeAmount = isNaN(amount) ? 0 : amount;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safeAmount);
}

/**
 * Formats a numeric volume into standard liter string: 120.50 L
 */
export function formatLiters(liters: number): string {
  const safeLiters = isNaN(liters) ? 0 : liters;
  return `${safeLiters.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} L`;
}

/**
 * Returns formatted status badge label & amount display
 */
export function formatVarianceLabel(variance: number, status: TallyStatus): string {
  const absFormatted = formatINR(Math.abs(variance));
  switch (status) {
    case 'TALLY':
    case 'MATCH':
      return 'PERFECT TALLY';
    case 'SHORTAGE':
      return `SHORTAGE - ${absFormatted}`;
    case 'EXCESS':
      return `EXCESS + ${absFormatted}`;
  }
}

/**
 * Returns the color scheme for a given tally status based on DESIGN.md
 */
export function getStatusBadgeStyle(status: TallyStatus): {
  bg: string;
  text: string;
  border: string;
} {
  switch (status) {
    case 'TALLY':
    case 'MATCH':
      return {
        bg: 'bg-emerald-500/10',
        text: 'text-emerald-400',
        border: 'border-emerald-500/30',
      };
    case 'SHORTAGE':
      return {
        bg: 'bg-rose-500/10',
        text: 'text-rose-400',
        border: 'border-rose-500/30',
      };
    case 'EXCESS':
      return {
        bg: 'bg-cyan-500/10',
        text: 'text-cyan-400',
        border: 'border-cyan-500/30',
      };
  }
}
