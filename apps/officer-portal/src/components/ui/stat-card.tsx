import { Card } from "./card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  variant?: "default" | "success" | "warning" | "error";
}

export function StatCard({ title, value, subtitle, variant = "default" }: StatCardProps) {
  const borderColors = {
    default: "border-l-primary",
    success: "border-l-green-500",
    warning: "border-l-amber-500",
    error: "border-l-red-500",
  };
  return (
    <Card className={cn("border-l-4", borderColors[variant])}>
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <p className="mt-1 text-3xl font-bold text-foreground">{value}</p>
      {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
    </Card>
  );
}
