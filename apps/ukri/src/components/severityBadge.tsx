import { cn } from '@/lib/utils';
import type { Severity } from '@/types/fes';

interface SeverityBadgeProps {
  severity: Severity;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const severityConfig: Record<Severity, { label: string; dotClass: string; bgClass: string }> = {
  high: {
    label: 'High Risk',
    dotClass: 'bg-[var(--risk-high)]',
    bgClass: 'bg-[var(--risk-high-bg)] text-[var(--risk-high)]',
  },
  medium: {
    label: 'Medium Risk',
    dotClass: 'bg-[var(--risk-medium)]',
    bgClass: 'bg-[var(--risk-medium-bg)] text-[var(--risk-medium)]',
  },
  low: {
    label: 'Low Risk',
    dotClass: 'bg-[var(--risk-low)]',
    bgClass: 'bg-[var(--risk-low-bg)] text-[var(--risk-low)]',
  },
};

const sizeConfig = {
  sm: { dot: 'h-2 w-2', text: 'text-xs', padding: 'px-2 py-0.5' },
  md: { dot: 'h-2.5 w-2.5', text: 'text-sm', padding: 'px-2.5 py-1' },
  lg: { dot: 'h-3 w-3', text: 'text-base', padding: 'px-3 py-1.5' },
};

export function SeverityBadge({ severity, showLabel = true, size = 'md' }: SeverityBadgeProps) {
  const config = severityConfig[severity];
  const sizes = sizeConfig[size];

  if (!showLabel) {
    return <span className={cn('inline-block rounded-full', sizes.dot, config.dotClass)} />;
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        sizes.padding,
        sizes.text,
        config.bgClass
      )}
    >
      <span className={cn('rounded-full', sizes.dot, config.dotClass)} />
      {config.label}
    </span>
  );
}
