import { Badge } from '@/components/ui/badge';
import { Clock, Loader2, CheckCircle2, XCircle, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WorkflowStatusBadgeProps {
  status: 'pending' | 'running' | 'completed' | 'failed' | 'alive';
  className?: string;
  showIcon?: boolean;
}

export const WorkflowStatusBadge = ({
  status,
  className,
  showIcon = true,
}: WorkflowStatusBadgeProps) => {
  const config = {
    pending: {
      label: 'Ausstehend',
      variant: 'secondary' as const,
      className: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20',
      icon: Clock,
    },
    running: {
      label: 'Läuft',
      variant: 'secondary' as const,
      className: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
      icon: Loader2,
    },
    alive: {
      label: 'Aktiv',
      variant: 'secondary' as const,
      className: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
      icon: Activity,
    },
    completed: {
      label: 'Abgeschlossen',
      variant: 'secondary' as const,
      className: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
      icon: CheckCircle2,
    },
    failed: {
      label: 'Fehlgeschlagen',
      variant: 'secondary' as const,
      className: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20',
      icon: XCircle,
    },
  };

  const { label, variant, className: statusClass, icon: Icon } = config[status];

  return (
    <Badge variant={variant} className={cn(statusClass, className)}>
      {showIcon && (
        <Icon
          className={cn(
            'mr-1 h-3 w-3',
            status === 'running' && 'animate-spin',
            status === 'alive' && 'animate-pulse'
          )}
        />
      )}
      {label}
    </Badge>
  );
};
