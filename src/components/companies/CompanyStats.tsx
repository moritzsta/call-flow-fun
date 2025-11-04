import { Card, CardContent } from '@/components/ui/card';
import { Company } from '@/hooks/useCompanies';
import { Building2, Globe, Mail, CheckCircle2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface CompanyStatsProps {
  companies: Company[];
  isLoading?: boolean;
}

export const CompanyStats = ({ companies, isLoading }: CompanyStatsProps) => {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 animate-pulse bg-muted rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const total = companies.length;
  const withWebsite = companies.filter((c) => c.website).length;
  const withEmail = companies.filter((c) => c.email).length;
  const analyzed = companies.filter((c) => c.analysis).length;

  const websitePercent = total > 0 ? Math.round((withWebsite / total) * 100) : 0;
  const emailPercent = total > 0 ? Math.round((withEmail / total) * 100) : 0;
  const analyzedPercent = total > 0 ? Math.round((analyzed / total) * 100) : 0;

  const stats = [
    {
      label: 'Gesamt',
      value: total,
      icon: Building2,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Mit Website',
      value: withWebsite,
      percent: websitePercent,
      icon: Globe,
      color: 'text-green-600',
      bgColor: 'bg-green-500/10',
      progressColor: 'bg-green-500',
    },
    {
      label: 'Mit Email',
      value: withEmail,
      percent: emailPercent,
      icon: Mail,
      color: 'text-blue-600',
      bgColor: 'bg-blue-500/10',
      progressColor: 'bg-blue-500',
    },
    {
      label: 'Analysiert',
      value: analyzed,
      percent: analyzedPercent,
      icon: CheckCircle2,
      color: 'text-purple-600',
      bgColor: 'bg-purple-500/10',
      progressColor: 'bg-purple-500',
    },
  ];

  return (
    <Card>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`h-8 w-8 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                      <Icon className={`h-4 w-4 ${stat.color}`} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                  </div>
                </div>
                {stat.percent !== undefined && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{stat.percent}%</span>
                    </div>
                    <Progress value={stat.percent} className="h-1.5" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
