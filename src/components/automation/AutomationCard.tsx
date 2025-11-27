import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AutomationDialog } from './AutomationDialog';
import { useAutomatedPipeline } from '@/hooks/useAutomatedPipeline';
import { useWorkflowProgress } from '@/hooks/useWorkflowProgress';
import { useWorkflowMaxLoops } from '@/hooks/useWorkflowMaxLoops';
import { useAuth } from '@/contexts/AuthContext';
import { Zap, Loader2, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface AutomationCardProps {
  projectId: string;
}

export const AutomationCard = ({ projectId }: AutomationCardProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showProgressPulse, setShowProgressPulse] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { startPipeline, isRunning, currentPhase } = useAutomatedPipeline(projectId);
  
  // Fetch workflow data and progress
  const workflowProgress = useWorkflowProgress(projectId, isRunning);
  const workflowMaxLoops = useWorkflowMaxLoops(projectId, isRunning);
  
  // Fetch individual workflow states
  const { data: workflows } = useQuery({
    queryKey: ['workflow-states', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('n8n_workflow_states')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(4);
      
      if (error) throw error;
      return data;
    },
    enabled: isRunning,
    refetchInterval: isRunning ? 5000 : false,
  });

  const handleStart = (config: any) => {
    if (!user) return;

    startPipeline(
      {
        config: {
          projectId,
          userId: user.id,
          searchCriteria: config,
        },
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

  // Trigger pulse effect on workflow updates
  useEffect(() => {
    if (!workflows || !isRunning) return;
    
    setShowProgressPulse(true);
    const timer = setTimeout(() => setShowProgressPulse(false), 1200);
    return () => clearTimeout(timer);
  }, [workflows, isRunning]);
  
  const getWorkflowByName = (name: string) => {
    if (name === 'analyse_anna') {
      return workflows?.find((w) => w.workflow_name === 'analyse_anna' || w.workflow_name === 'analyse_anna_auto');
    }
    if (name === 'pitch_paul') {
      return workflows?.find((w) => w.workflow_name === 'pitch_paul' || w.workflow_name === 'pitch_paul_auto');
    }
    if (name === 'branding_britta') {
      return workflows?.find((w) => w.workflow_name === 'branding_britta' || w.workflow_name === 'branding_britta_auto');
    }
    return workflows?.find((w) => w.workflow_name === name);
  };

  const felixWorkflow = getWorkflowByName('finder_felix');
  const annaWorkflow = getWorkflowByName('analyse_anna');
  const paulWorkflow = getWorkflowByName('pitch_paul');
  const brittaWorkflow = getWorkflowByName('branding_britta');

  // Calculate phase progress (same logic as AutomationStatus page)
  const getPhaseProgress = (
    workflow: any,
    maxLoops: number,
    phaseType: 'felix' | 'loop'
  ): number => {
    if (!workflow) return 0;
    if (workflow.status === 'completed' || workflow.status === 'failed') return 25;
    if (maxLoops === 0 && phaseType === 'loop') return 0;
    
    if (phaseType === 'felix') {
      const elapsed = (Date.now() - new Date(workflow.started_at).getTime()) / 1000;
      const progress = (elapsed / 60) * 25;
      return Math.min(25, Math.max(0, progress));
    } else {
      const progress = (workflow.loop_count / maxLoops) * 25;
      return Math.min(25, Math.max(0, progress));
    }
  };

  const calculateProgress = () => {
    const felixProgress = getPhaseProgress(felixWorkflow, 0, 'felix');
    const annaProgress = getPhaseProgress(annaWorkflow, workflowMaxLoops.annaMaxLoops, 'loop');
    const paulProgress = getPhaseProgress(paulWorkflow, workflowMaxLoops.paulMaxLoops, 'loop');
    const brittaProgress = getPhaseProgress(brittaWorkflow, workflowMaxLoops.brittaMaxLoops, 'loop');

    const total = felixProgress + annaProgress + paulProgress + brittaProgress;
    return Math.min(100, Math.max(0, total));
  };
  
  const getPhaseLabel = () => {
    if (!isRunning) return null;
    
    switch (currentPhase) {
      case 'finder_felix':
        return 'Phase 1/4: Firmen finden...';
      case 'analyse_anna_auto':
        return 'Phase 2/4: Firmen analysieren...';
      case 'pitch_paul_auto':
        return 'Phase 3/4: E-Mails generieren...';
      case 'branding_britta_auto':
        return 'Phase 4/4: E-Mails optimieren...';
      default:
        return 'Pipeline läuft...';
    }
  };
  
  const getPhaseDetails = () => {
    if (!isRunning || !workflows) return null;
    
    switch (currentPhase) {
      case 'finder_felix':
        return `${workflowProgress.felixCount} Firmen gefunden`;
      case 'analyse_anna_auto':
        return `${workflowProgress.annaCount}/${workflowMaxLoops.annaMaxLoops} Firmen analysiert`;
      case 'pitch_paul_auto':
        return `${workflowProgress.paulCount}/${workflowMaxLoops.paulMaxLoops} E-Mails generiert`;
      case 'branding_britta_auto':
        return `${workflowProgress.brittaCount}/${workflowMaxLoops.brittaMaxLoops} E-Mails optimiert`;
      default:
        return null;
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
                    : 'Felix → Anna → Paul → Britta automatisch ausführen'}
                </CardDescription>
              </div>
            </div>
            {!isRunning && <ArrowRight className="h-5 w-5 text-muted-foreground" />}
          </div>
        </CardHeader>

        {isRunning && (
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Fortschritt</span>
                <span className="font-medium text-primary">{Math.round(calculateProgress())}%</span>
              </div>
              
              <Progress 
                value={calculateProgress()} 
                showPulse={showProgressPulse}
                isActive={true}
                className="h-3"
              />
              
              {getPhaseDetails() && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Aktuell</span>
                  <span className="font-medium">{getPhaseDetails()}</span>
                </div>
              )}
              
              <p className="text-xs text-muted-foreground text-center pt-1">
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
