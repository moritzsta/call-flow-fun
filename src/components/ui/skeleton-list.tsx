import { Skeleton } from '@/components/ui/skeleton';

interface SkeletonListProps {
  items?: number;
  showAvatar?: boolean;
  showActions?: boolean;
  className?: string;
}

export const SkeletonList = ({
  items = 5,
  showAvatar = false,
  showActions = false,
  className = '',
}: SkeletonListProps) => {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: items }).map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between p-4 border rounded-lg"
        >
          <div className="flex items-center gap-3 flex-1">
            {showAvatar && <Skeleton className="h-10 w-10 rounded-full" />}
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
          {showActions && <Skeleton className="h-8 w-20" />}
        </div>
      ))}
    </div>
  );
};

export const SkeletonListCompact = ({ items = 3 }: { items?: number }) => {
  return (
    <div className="space-y-2">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center justify-between p-3 border-b">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-6 w-16" />
        </div>
      ))}
    </div>
  );
};
