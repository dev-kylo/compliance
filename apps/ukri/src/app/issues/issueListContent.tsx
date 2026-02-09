'use client';

import { useSearchParams } from 'next/navigation';
import { IssueCard } from '@/components/issueCard';
import { IssueFilters } from '@/components/issueFilters';
import { filterIssues, formatCurrency, DEMO_GRANT_ID } from '@/lib/data';
import type { Severity, Category } from '@/types/fes';

export function IssueListContent() {
  const searchParams = useSearchParams();
  const severityParam = searchParams.get('severity') as Severity | 'all' | null;
  const categoryParam = searchParams.get('category') as Category | 'all' | null;

  const filteredIssues = filterIssues({
    grantId: DEMO_GRANT_ID,
    severity: severityParam || 'all',
    category: categoryParam || 'all',
  });

  const totalExposure = filteredIssues.reduce((sum, i) => sum + i.amount, 0);

  return (
    <main className="container mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-600">
            <strong>{filteredIssues.length}</strong> issues found •{' '}
            <strong>{formatCurrency(totalExposure)}</strong> total exposure
          </p>
        </div>
        <IssueFilters
          severity={severityParam || 'all'}
          category={categoryParam || 'all'}
        />
      </div>

      <div className="space-y-3">
        {filteredIssues.length === 0 ? (
          <div className="rounded-lg bg-white p-8 text-center shadow-sm">
            <p className="text-gray-500">No issues match the selected filters.</p>
          </div>
        ) : (
          filteredIssues.map((issue) => (
            <IssueCard key={issue.id} issue={issue} />
          ))
        )}
      </div>
    </main>
  );
}
