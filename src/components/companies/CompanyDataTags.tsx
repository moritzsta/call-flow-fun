import { Badge } from '@/components/ui/badge';
import { Globe, Mail, CheckCircle2 } from 'lucide-react';
import { Company } from '@/hooks/useCompanies';
import { cn } from '@/lib/utils';

interface CompanyDataTagsProps {
  company: Company;
  className?: string;
}

export const CompanyDataTags = ({ company, className }: CompanyDataTagsProps) => {
  const hasWebsite = !!company.website;
  const hasEmail = !!company.email;
  const isAnalyzed = !!company.analysis;

  return (
    <div className={cn('flex gap-1 flex-wrap', className)}>
      <Badge
        variant={hasWebsite ? 'default' : 'outline'}
        className={cn(
          'h-5 px-2 text-[10px] font-medium',
          hasWebsite
            ? 'bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/50 hover:bg-green-500/30'
            : 'bg-muted/50 text-muted-foreground border-muted'
        )}
      >
        <Globe className="h-2.5 w-2.5 mr-1" />
        Web
      </Badge>
      <Badge
        variant={hasEmail ? 'default' : 'outline'}
        className={cn(
          'h-5 px-2 text-[10px] font-medium',
          hasEmail
            ? 'bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/50 hover:bg-blue-500/30'
            : 'bg-muted/50 text-muted-foreground border-muted'
        )}
      >
        <Mail className="h-2.5 w-2.5 mr-1" />
        Email
      </Badge>
      <Badge
        variant={isAnalyzed ? 'default' : 'outline'}
        className={cn(
          'h-5 px-2 text-[10px] font-medium',
          isAnalyzed
            ? 'bg-purple-500/20 text-purple-700 dark:text-purple-400 border-purple-500/50 hover:bg-purple-500/30'
            : 'bg-muted/50 text-muted-foreground border-muted'
        )}
      >
        <CheckCircle2 className="h-2.5 w-2.5 mr-1" />
        Analyse
      </Badge>
    </div>
  );
};
