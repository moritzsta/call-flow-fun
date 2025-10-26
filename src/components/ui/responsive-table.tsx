import { useIsMobile } from '@/hooks/use-mobile';
import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface ResponsiveTableProps {
  children: ReactNode;
  mobileView?: ReactNode;
  className?: string;
}

export const ResponsiveTable = ({
  children,
  mobileView,
  className = '',
}: ResponsiveTableProps) => {
  const isMobile = useIsMobile();

  if (isMobile && mobileView) {
    return <div className={className}>{mobileView}</div>;
  }

  if (isMobile) {
    return (
      <ScrollArea className={`w-full ${className}`}>
        <div className="min-w-[800px]">{children}</div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    );
  }

  return <div className={className}>{children}</div>;
};

interface MobileCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export const MobileCard = ({ children, className = '', onClick }: MobileCardProps) => {
  return (
    <Card
      className={`cursor-pointer hover:shadow-md transition-shadow ${className}`}
      onClick={onClick}
    >
      <CardContent className="p-4">{children}</CardContent>
    </Card>
  );
};
