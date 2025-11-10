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
  maxCount?: number;
  showRatio?: boolean;
  timeRemaining?: number;
}

export const WorkflowProgressBadge = ({
  icon: Icon,
  count,
  label,
  isLoading = false,
  className,
  maxCount,
  showRatio = false,
  timeRemaining,
}: WorkflowProgressBadgeProps) => {
  if (isLoading) {
    return <Skeleton className="h-6 w-32" />;
  }

  // Felix: Show time remaining
  if (timeRemaining !== undefined) {
    return (
      <Badge
        variant="secondary"
        className={cn(
          'bg-primary/5 text-primary border-primary/20 px-3 py-1.5 animate-scale-in',
          className
        )}
      >
        <Icon className="mr-1.5 h-3.5 w-3.5" />
        <span className="font-semibold tabular-nums">≈ {timeRemaining}s</span>
        <span className="ml-1 text-muted-foreground">{label}</span>
      </Badge>
    );
  }

  // Loop-based: Show ratio
  if (showRatio && maxCount !== undefined) {
    return (
      <Badge
        variant="secondary"
        className={cn(
          'bg-primary/5 text-primary border-primary/20 px-3 py-1.5 animate-scale-in',
          className
        )}
      >
        <Icon className="mr-1.5 h-3.5 w-3.5" />
        <span className="font-semibold tabular-nums">{count} / {maxCount}</span>
        <span className="ml-1 text-muted-foreground">{label}</span>
      </Badge>
    );
  }

  // Default: Just count
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
