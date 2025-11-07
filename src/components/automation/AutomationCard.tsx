import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AutomationDialog } from './AutomationDialog';
import { useAutomatedPipeline } from '@/hooks/useAutomatedPipeline';
import { useAuth } from '@/contexts/AuthContext';
import { Zap, Loader2, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AutomationCardProps {
  projectId: string;
}

export const AutomationCard = ({ projectId }: AutomationCardProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { startPipeline, isRunning, currentPhase } = useAutomatedPipeline(projectId);

  const handleStart = (config: any) => {
    if (!user) return;

    startPipeline(
      {
        projectId,
        userId: user.id,
        config,
      },
      {
        onSuccess: () => {
          setDialogOpen(false);
          // Navigate to status page after a short delay
          setTimeout(() => {
            navigate(`/projects/${projectId}/automation-status`);
          }, 500);
        },
      }
    );
  };

  const getPhaseLabel = () => {
    switch (currentPhase) {
      case 'felix':
        return 'Finder Felix läuft...';
      case 'anna':
        return 'Analyse Anna läuft...';
      case 'paul':
        return 'Pitch Paul läuft...';
      default:
        return 'Pipeline läuft...';
    }
  };

  return (
    <>
      <Card
        className={cn(
          'cursor-pointer transition-all hover:shadow-lg',
          isRunning && 'border-primary bg-primary/5'
        )}
        onClick={() => {
          if (isRunning) {
            navigate(`/projects/${projectId}/automation-status`);
          } else {
            setDialogOpen(true);
          }
        }}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'p-2 rounded-lg',
                  isRunning
                    ? 'bg-primary/10'
                    : 'bg-gradient-to-br from-orange-500/10 to-pink-500/10'
                )}
              >
                {isRunning ? (
                  <Loader2 className="h-6 w-6 text-primary animate-spin" />
                ) : (
                  <Zap className="h-6 w-6 text-orange-500" />
                )}
              </div>
              <div>
                <CardTitle className="text-lg">
                  {isRunning ? 'Pipeline aktiv' : 'Prozess Automatisieren'}
                </CardTitle>
                <CardDescription className="text-sm">
                  {isRunning
                    ? getPhaseLabel()
                    : 'Felix → Anna → Paul automatisch ausführen'}
                </CardDescription>
              </div>
            </div>
            {!isRunning && <ArrowRight className="h-5 w-5 text-muted-foreground" />}
          </div>
        </CardHeader>

        {isRunning && (
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <span className="font-medium text-primary">In Bearbeitung</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-500 animate-pulse"
                  style={{
                    width:
                      currentPhase === 'felix'
                        ? '33%'
                        : currentPhase === 'anna'
                        ? '66%'
                        : '100%',
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Klicken für Details
              </p>
            </div>
          </CardContent>
        )}
      </Card>

      <AutomationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onStart={handleStart}
        isStarting={isRunning}
      />
    </>
  );
};
