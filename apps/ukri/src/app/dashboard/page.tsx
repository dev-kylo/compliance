'use client';

import Link from 'next/link';
import { ChevronRight, Download } from 'lucide-react';
import { toast } from 'sonner';
import { AppHeader } from '@/components/appHeader';
import { KpiCard } from '@/components/kpiCard';
import { CategoryIcon } from '@/components/categoryIcon';
import { Button } from '@/components/ui/button';
import { getGrant, getIssuesByGrant, formatCurrency, formatNumber, auditReadinessScore, DEMO_GRANT_ID } from '@/lib/data';
import type { Category } from '@/types/fes';

const categoryKeys: { key: string; label: Category }[] = [
  { key: 'staffCosts', label: 'Staff Costs' },
  { key: 'equipment', label: 'Equipment' },
  { key: 'consumables', label: 'Consumables' },
  { key: 'travel', label: 'Travel' },
  { key: 'other', label: 'Other' },
];

export default function DashboardPage() {
  const grant = getGrant(DEMO_GRANT_ID);
  const issues = getIssuesByGrant(DEMO_GRANT_ID);

  if (!grant) return null;

  const highRiskIssues = issues.filter((i) => i.severity === 'high');
  const mediumRiskIssues = issues.filter((i) => i.severity === 'medium');
  const highRiskAmount = highRiskIssues.reduce((sum, i) => sum + i.amount, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader backHref="/" backLabel="New Check" />

      <main className="container mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-900">
            {grant.reference} — {grant.title}
          </h1>
          <p className="text-sm text-gray-500">
            FES deadline: {new Date(grant.fesDeadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} ({grant.daysUntilDeadline} days)
          </p>
        </div>

        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KpiCard
            value={highRiskIssues.length}
            label="High Risk"
            sublabel={formatCurrency(highRiskAmount)}
            variant="high"
          />
          <KpiCard
            value={mediumRiskIssues.length}
            label="Medium Risk"
            sublabel={formatCurrency(grant.summary.totalAtRisk - highRiskAmount)}
            variant="medium"
          />
          <KpiCard
            value={formatNumber(grant.summary.cleanCount)}
            label="Clean"
            variant="low"
          />
          <KpiCard
            value={`${auditReadinessScore.overallScore}/100`}
            label="Audit Score"
            variant="neutral"
          />
        </div>

        <div className="mb-8">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Issues by Category
          </h2>
          <div className="space-y-2">
            {categoryKeys.map(({ key, label }) => {
              const cat = grant.summary.categories[key];
              if (!cat || cat.issues === 0) return null;
              return (
                <Link
                  key={key}
                  href={`/issues?category=${encodeURIComponent(label)}`}
                  className="flex items-center justify-between rounded-lg bg-white p-4 shadow-sm transition-colors hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <CategoryIcon category={label} className="h-5 w-5 text-gray-500" />
                    <span className="font-medium text-gray-900">{label}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600">
                      <strong>{cat.issues}</strong> issues
                    </span>
                    <span className="text-sm text-gray-600">
                      {formatCurrency(cat.atRisk)} at risk
                    </span>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-4">
          <Button asChild size="lg">
            <Link href="/issues">View All {issues.length} Issues</Link>
          </Button>
          <Button variant="outline" size="lg" onClick={() => toast('Export feature coming soon!')}>
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </main>
    </div>
  );
}
