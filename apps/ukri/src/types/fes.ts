export type Severity = 'high' | 'medium' | 'low';
export type Category = 'Staff Costs' | 'Equipment' | 'Consumables' | 'Travel' | 'Other';

export interface Grant {
  id: string;
  reference: string;
  title: string;
  funder: string;
  pi: {
    name: string;
    department: string;
    email: string;
  };
  startDate: string;
  endDate: string;
  fesDeadline: string;
  daysUntilDeadline: number;
  totalAwarded: number;
  totalSpent: number;
  fecRate: number;
  status: string;
  riskLevel: Severity;
  summary: {
    totalTransactions: number;
    highRiskCount: number;
    mediumRiskCount: number;
    cleanCount: number;
    totalAtRisk: number;
    categories: Record<string, CategorySummary>;
  };
}

export interface CategorySummary {
  spent: number;
  budget: number;
  issues: number;
  atRisk: number;
}

export interface RuleReference {
  source: string;
  section: string;
  text: string;
  url: string;
}

export interface IssueDetails {
  type: string;
  title: string;
  description: string;
  ruleReference: RuleReference;
  auditRisk: string;
  totalExposure: number;
  exposureCalculation: string;
  recommendedActions: string[];
}

export interface Issue {
  id: string;
  grantId: string;
  rowNumber: number;
  severity: Severity;
  category: Category;
  costType: string;
  transactionDate: string;
  postingDate: string;
  description: string;
  vendor: string;
  amount: number;
  costCentre: string;
  projectTask: string;
  poNumber: string;
  invoiceRef: string;
  issue: IssueDetails;
  relatedStaff?: {
    name: string;
    staffId: string;
    [key: string]: unknown;
  };
  purchaseDetails?: {
    requisitionedBy: string;
    approvedBy: string;
    businessJustification: string;
    [key: string]: unknown;
  };
  expenseDetails?: {
    claimant: string;
    [key: string]: unknown;
  };
}

export interface AuditReadinessScore {
  grantId: string;
  overallScore: number;
  maxScore: number;
  rating: string;
  breakdown: Record<string, {
    score: number;
    maxScore: number;
    issues: string;
  }>;
}

export interface FunderOption {
  id: string;
  name: string;
  enabled: boolean;
}

export interface DemoData {
  grants: Grant[];
  issues: Issue[];
  auditReadinessScore: AuditReadinessScore;
  ui: {
    funderOptions: FunderOption[];
    severityLabels: Record<Severity, { label: string; color: string; icon: string }>;
    categoryIcons: Record<Category, string>;
  };
}
