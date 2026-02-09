import { cn } from '@/lib/utils';

type Variant = 'high' | 'medium' | 'low' | 'neutral';

interface KpiCardProps {
  value: string | number;
  label: string;
  sublabel?: string;
  variant?: Variant;
  icon?: React.ReactNode;
}

const variantStyles: Record<Variant, string> = {
  high: 'border-l-4 border-l-[var(--risk-high)] bg-[var(--risk-high-bg)]/30',
  medium: 'border-l-4 border-l-[var(--risk-medium)] bg-[var(--risk-medium-bg)]/30',
  low: 'border-l-4 border-l-[var(--risk-low)] bg-[var(--risk-low-bg)]/30',
  neutral: 'border-l-4 border-l-gray-300 bg-gray-50',
};

export function KpiCard({ value, label, sublabel, variant = 'neutral', icon }: KpiCardProps) {
  return (
    <div className={cn('rounded-lg p-4 shadow-sm', variantStyles[variant])}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-sm font-medium text-gray-600">{label}</p>
          {sublabel && <p className="text-xs text-gray-500">{sublabel}</p>}
        </div>
        {icon && <div className="text-2xl">{icon}</div>}
      </div>
    </div>
  );
}
