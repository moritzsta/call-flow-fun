import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WorkflowProgressBadgeProps {
  icon: LucideIcon;
  count: number;
  label: string;
  isLoading?: boolean;
  className?: string;
}

export const WorkflowProgressBadge = ({
  icon: Icon,
  count,
  label,
  isLoading = false,
  className,
}: WorkflowProgressBadgeProps) => {
  if (isLoading) {
    return <Skeleton className="h-6 w-32" />;
  }

  return (
    <Badge
      variant="secondary"
      className={cn(
        'bg-primary/5 text-primary border-primary/20 px-3 py-1.5 animate-scale-in',
        className
      )}
    >
      <Icon className="mr-1.5 h-3.5 w-3.5" />
      <span className="font-semibold tabular-nums">{count}</span>
      <span className="ml-1 text-muted-foreground">{label}</span>
    </Badge>
  );
};
