'use client';

import { use } from 'react';
import { notFound } from 'next/navigation';
import { BookOpen, ExternalLink, CheckSquare, Check, StickyNote, X } from 'lucide-react';
import { toast } from 'sonner';
import { AppHeader } from '@/components/appHeader';
import { SeverityBadge } from '@/components/severityBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getIssue, formatCurrencyPrecise, formatDate } from '@/lib/data';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function IssueDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const issue = getIssue(id);

  if (!issue) {
    notFound();
  }

  const handleAction = (action: string) => {
    toast.success(`${action} - Action recorded`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader backHref="/issues" backLabel="Back to Issues" />

      <main className="container mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6">
          <SeverityBadge severity={issue.severity} size="lg" />
        </div>

        <h1 className="mb-2 text-2xl font-semibold text-gray-900">
          {issue.description}
        </h1>
        <p className="mb-8 font-mono text-sm text-gray-500">
          Row {issue.rowNumber.toLocaleString()} in transaction export
        </p>

        {/* Transaction Details */}
        <Card className="mb-8">
          <CardContent className="p-0">
            <dl className="divide-y">
              <DetailRow label="Amount" value={formatCurrencyPrecise(issue.amount)} />
              <DetailRow label="Cost Type" value={issue.costType} />
              <DetailRow label="Vendor" value={issue.vendor} />
              <DetailRow label="Cost Centre" value={issue.costCentre} />
              <DetailRow label="Posted" value={formatDate(issue.postingDate)} />
              <DetailRow label="Invoice Ref" value={issue.invoiceRef} />
              {issue.poNumber && issue.poNumber !== 'N/A — Payroll' && issue.poNumber !== 'N/A — Expense Claim' && (
                <DetailRow label="PO Number" value={issue.poNumber} />
              )}
            </dl>
          </CardContent>
        </Card>

        {/* Compliance Issue */}
        <section className="mb-8">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
            <span className="h-px flex-1 bg-gray-200" />
            Compliance Issue
            <span className="h-px flex-1 bg-gray-200" />
          </h2>

          <h3 className="mb-3 text-lg font-medium text-gray-900">
            {issue.issue.title}
          </h3>
          <p className="mb-4 leading-relaxed text-gray-700">
            {issue.issue.description}
          </p>

          <Card className="border-blue-200 bg-blue-50/50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                <div>
                  <p className="mb-1 text-sm font-medium text-blue-900">
                    {issue.issue.ruleReference.source} — {issue.issue.ruleReference.section}
                  </p>
                  <p className="text-sm italic text-blue-800">
                    {`"${issue.issue.ruleReference.text}"`}
                  </p>
                  {issue.issue.ruleReference.url && (
                    <a
                      href={issue.issue.ruleReference.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                    >
                      View source <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Audit Risk */}
        <section className="mb-8">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
            <span className="h-px flex-1 bg-gray-200" />
            Audit Risk
            <span className="h-px flex-1 bg-gray-200" />
          </h2>

          <p className="mb-4 leading-relaxed text-gray-700">
            {issue.issue.auditRisk}
          </p>

          <div className="rounded-lg bg-red-50 p-4">
            <p className="text-lg font-semibold text-red-700">
              Total exposure: {formatCurrencyPrecise(issue.issue.totalExposure)}
            </p>
            <p className="text-sm text-red-600">
              ({issue.issue.exposureCalculation})
            </p>
          </div>
        </section>

        {/* Recommended Actions */}
        <section className="mb-8">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
            <span className="h-px flex-1 bg-gray-200" />
            Recommended Actions
            <span className="h-px flex-1 bg-gray-200" />
          </h2>

          <ul className="space-y-3">
            {issue.issue.recommendedActions.map((action, index) => (
              <li key={index} className="flex items-start gap-3">
                <CheckSquare className="mt-0.5 h-5 w-5 shrink-0 text-gray-400" />
                <span className="text-gray-700">{action}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 border-t pt-6">
          <Button onClick={() => handleAction('Mark as Reviewed')}>
            <Check className="mr-2 h-4 w-4" />
            Mark as Reviewed
          </Button>
          <Button variant="outline" onClick={() => handleAction('Add Note')}>
            <StickyNote className="mr-2 h-4 w-4" />
            Add Note
          </Button>
          <Button variant="outline" onClick={() => handleAction('Dismiss')}>
            <X className="mr-2 h-4 w-4" />
            Dismiss
          </Button>
        </div>
      </main>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between px-4 py-3">
      <dt className="text-sm text-gray-500">{label}</dt>
      <dd className="text-sm font-medium text-gray-900">{value}</dd>
    </div>
  );
}
