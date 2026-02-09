import { User, Monitor, FlaskConical, Plane, FileText } from 'lucide-react';
import type { Category } from '@/types/fes';

interface CategoryIconProps {
  category: Category;
  className?: string;
}

const iconMap: Record<Category, React.ElementType> = {
  'Staff Costs': User,
  Equipment: Monitor,
  Consumables: FlaskConical,
  Travel: Plane,
  Other: FileText,
};

export function CategoryIcon({ category, className = 'h-4 w-4' }: CategoryIconProps) {
  const Icon = iconMap[category];
  return <Icon className={className} />;
}
