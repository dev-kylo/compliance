"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils";

interface Working {
  step: string;
  formula: string;
  result: number;
  notes?: string;
}

interface CalculationWorkingsProps {
  workings: Working[];
  claimableCost: number;
}

export function CalculationWorkings({ workings, claimableCost }: CalculationWorkingsProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border border-border">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-accent transition-colors"
      >
        <span className="text-sm font-medium">
          Claimable: {formatCurrency(claimableCost)}
        </span>
        <span className="text-xs text-muted-foreground">
          {expanded ? "Hide" : "Show"} workings ({workings.length} steps)
        </span>
      </button>
      {expanded && (
        <div className="border-t border-border">
          {workings.map((w, i) => (
            <div key={i} className="border-b border-border px-4 py-3 last:border-b-0">
              <div className="flex items-start justify-between">
                <span className="text-xs font-medium text-muted-foreground">Step {i + 1}</span>
                <span className="font-mono text-sm font-semibold">{typeof w.result === 'number' && w.step.toLowerCase().includes('percentage') ? `${(w.result * 100).toFixed(2)}%` : w.step.toLowerCase().includes('budget') ? `${w.result}%` : formatCurrency(w.result)}</span>
              </div>
              <p className="mt-0.5 text-sm font-medium">{w.step}</p>
              <p className="mt-0.5 font-mono text-xs text-muted-foreground">{w.formula}</p>
              {w.notes && <p className="mt-1 text-xs italic text-muted-foreground">{w.notes}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
