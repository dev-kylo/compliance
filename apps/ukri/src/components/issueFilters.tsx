'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Severity, Category } from '@/types/fes';

interface IssueFiltersProps {
  severity: Severity | 'all';
  category: Category | 'all';
}

const severities: { value: Severity | 'all'; label: string }[] = [
  { value: 'all', label: 'All Severities' },
  { value: 'high', label: 'High Risk' },
  { value: 'medium', label: 'Medium Risk' },
];

const categories: { value: Category | 'all'; label: string }[] = [
  { value: 'all', label: 'All Categories' },
  { value: 'Staff Costs', label: 'Staff Costs' },
  { value: 'Equipment', label: 'Equipment' },
  { value: 'Consumables', label: 'Consumables' },
  { value: 'Travel', label: 'Travel' },
  { value: 'Other', label: 'Other' },
];

export function IssueFilters({ severity, category }: IssueFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'all') {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`/issues?${params.toString()}`);
  };

  return (
    <div className="flex gap-2">
      <Select value={severity} onValueChange={(v) => updateFilter('severity', v)}>
        <SelectTrigger className="w-[140px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {severities.map((s) => (
            <SelectItem key={s.value} value={s.value}>
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={category} onValueChange={(v) => updateFilter('category', v)}>
        <SelectTrigger className="w-[150px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {categories.map((c) => (
            <SelectItem key={c.value} value={c.value}>
              {c.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
