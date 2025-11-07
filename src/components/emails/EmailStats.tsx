import { Card, CardContent } from '@/components/ui/card';
import { ProjectEmail } from '@/hooks/useEmails';
import { Mail, Clock, CheckCircle2, Send } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface EmailStatsProps {
  emails: ProjectEmail[];
  isLoading?: boolean;
}

export const EmailStats = ({ emails, isLoading }: EmailStatsProps) => {
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

  const total = emails.length;
  const draft = emails.filter((e) => e.status === 'draft').length;
  const readyToSend = emails.filter((e) => e.status === 'ready_to_send').length;
  const sent = emails.filter((e) => e.status === 'sent').length;

  const draftPercent = total > 0 ? Math.round((draft / total) * 100) : 0;
  const readyPercent = total > 0 ? Math.round((readyToSend / total) * 100) : 0;
  const sentPercent = total > 0 ? Math.round((sent / total) * 100) : 0;

  const stats = [
    {
      label: 'Gesamt',
      value: total,
      icon: Mail,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Entwürfe',
      value: draft,
      percent: draftPercent,
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-500/10',
      progressColor: 'bg-orange-500',
    },
    {
      label: 'Bereit',
      value: readyToSend,
      percent: readyPercent,
      icon: CheckCircle2,
      color: 'text-green-600',
      bgColor: 'bg-green-500/10',
      progressColor: 'bg-green-500',
    },
    {
      label: 'Versendet',
      value: sent,
      percent: sentPercent,
      icon: Send,
      color: 'text-blue-600',
      bgColor: 'bg-blue-500/10',
      progressColor: 'bg-blue-500',
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
