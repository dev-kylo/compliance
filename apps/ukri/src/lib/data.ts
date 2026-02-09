import type { DemoData, Grant, Issue, AuditReadinessScore, FunderOption, Severity, Category } from '@/types/fes';
import rawData from '@/app/fes-validator-dummy-data.json';

const data = rawData as DemoData;

export const grants: Grant[] = data.grants;
export const issues: Issue[] = data.issues;
export const auditReadinessScore: AuditReadinessScore = data.auditReadinessScore;
export const funderOptions: FunderOption[] = data.ui.funderOptions;
export const severityLabels = data.ui.severityLabels;
export const categoryIcons = data.ui.categoryIcons;

export function getGrant(id: string): Grant | undefined {
  return grants.find(g => g.id === id);
}

export function getIssue(id: string): Issue | undefined {
  return issues.find(i => i.id === id);
}

export function getIssuesByGrant(grantId: string): Issue[] {
  return issues.filter(i => i.grantId === grantId);
}

export function filterIssues({
  grantId,
  severity,
  category,
}: {
  grantId?: string;
  severity?: Severity | 'all';
  category?: Category | 'all';
}): Issue[] {
  return issues.filter(issue => {
    if (grantId && issue.grantId !== grantId) return false;
    if (severity && severity !== 'all' && issue.severity !== severity) return false;
    if (category && category !== 'all' && issue.category !== category) return false;
    return true;
  });
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCurrencyPrecise(amount: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-GB').format(num);
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// Demo state helpers
export const DEMO_GRANT_ID = 'grant_001';
export const DEMO_FILE_NAME = 'oracle_export_grant_EP-X029441_2024-25.xlsx';
