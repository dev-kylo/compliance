'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { SeverityBadge } from './severityBadge';
import { CategoryIcon } from './categoryIcon';
import { formatCurrency } from '@/lib/data';
import type { Issue } from '@/types/fes';

interface IssueCardProps {
  issue: Issue;
}

const severityBorder: Record<Issue['severity'], string> = {
  high: 'border-l-[var(--risk-high)]',
  medium: 'border-l-[var(--risk-medium)]',
  low: 'border-l-[var(--risk-low)]',
};

export function IssueCard({ issue }: IssueCardProps) {
  return (
    <Link href={`/issues/${issue.id}`} className="block">
      <div
        className={cn(
          'rounded-lg border border-l-[8px] bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md',
          severityBorder[issue.severity]
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <SeverityBadge severity={issue.severity} showLabel={false} size="sm" />
            <CategoryIcon category={issue.category} className="mt-0.5 h-4 w-4 text-gray-500" />
            <div className="min-w-0">
              <p className="font-medium text-gray-900 truncate">{issue.description}</p>
              <p className="text-sm text-gray-500 mt-1">{issue.issue.title}</p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="font-semibold text-gray-900">{formatCurrency(issue.amount)}</p>
            <p className="text-xs font-mono text-gray-400">#{issue.rowNumber}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}
