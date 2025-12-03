import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { WorkflowStatusBadge } from '@/components/workflows/WorkflowStatusBadge';
import { WorkflowProgressBadge } from '@/components/workflows/WorkflowProgressBadge';
import { useWorkflowProgress } from '@/hooks/useWorkflowProgress';
import { useWorkflowMaxLoops } from '@/hooks/useWorkflowMaxLoops';
import { ChatInterface } from '@/components/workflows/ChatInterface';
import { WorkflowLoadingAnimation } from '@/components/workflows/WorkflowLoadingAnimation';
import { 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft, 
  MessageSquare,
  Activity,
  MapPin,
  Target,
  FileText,
  Building2,
  BarChart3,
  Mail,
  Sparkles,
  Timer,
  RefreshCcw,
  XCircle
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';

interface WorkflowState {
  id: string;
  workflow_name: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'alive';
  result_summary: any;
  started_at: string;
  completed_at: string | null;
  updated_at: string;
  loop_count: number;
}

export default function AutomationStatus() {
  const { id: projectId } = useParams();
  const navigate = useNavigate();
  const [timeUntilNextPhase, setTimeUntilNextPhase] = useState<number | null>(null);
  const [timeSinceUpdate, setTimeSinceUpdate] = useState<{[key: string]: number}>({});
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowState | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showProgressPulse, setShowProgressPulse] = useState(false);
  const prevWorkflowTimestamps = useRef<{[key: string]: string}>({});

  // Fetch latest pipeline
  const { data: pipeline, isLoading: pipelineLoading, refetch } = useQuery({
    queryKey: ['automation-pipeline', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('automation_pipelines')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
    refetchInterval: (query) => {
      return query.state.data?.status === 'running' ? 2000 : false;
    },
  });

  // Get workflow progress data
  const workflowProgress = useWorkflowProgress(
    pipeline?.project_id, 
    pipeline?.status === 'running'
  );

  // Get workflow max loops
  const workflowMaxLoops = useWorkflowMaxLoops(
    pipeline?.project_id,
    pipeline?.status === 'running'
  );

  // Fetch workflow states
  const { data: workflows = [], refetch: refetchWorkflows } = useQuery({
    queryKey: ['pipeline-workflows', pipeline?.id],
    queryFn: async () => {
      if (!pipeline) return [];

      const workflowIds = [
        pipeline.felix_workflow_id,
        pipeline.anna_workflow_id,
        pipeline.paul_workflow_id,
        pipeline.britta_workflow_id,
      ].filter(Boolean);

      if (workflowIds.length === 0) return [];

      const { data, error } = await supabase
        .from('n8n_workflow_states')
        .select('*')
        .in('id', workflowIds);

      if (error) throw error;
      return data as WorkflowState[];
    },
    enabled: !!pipeline,
    refetchInterval: pipeline?.status === 'running' ? 2000 : false,
  });

  // Setup realtime subscription
  useEffect(() => {
    if (!projectId || !pipeline?.id) return;

    const channel = supabase
      .channel(`automation:${pipeline.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'automation_pipelines',
          filter: `id=eq.${pipeline.id}`,
        },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, pipeline?.id, refetch]);

  // Watchdog: Automatically detect and recover from stuck workflows
  useEffect(() => {
    if (!pipeline?.id || pipeline.status !== 'running') return;

    const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 Minuten
    const CHECK_INTERVAL = 30 * 1000; // Check alle 30 Sekunden

    console.log('[AutomationStatus] Starting workflow watchdog');

    const watchdog = setInterval(async () => {
      console.log('[AutomationStatus] Watchdog check running...');
      
      // Get all workflow IDs from pipeline
      const workflowIds = [
        pipeline.felix_workflow_id,
        pipeline.anna_workflow_id,
        pipeline.paul_workflow_id,
        pipeline.britta_workflow_id,
      ].filter(Boolean);

      if (workflowIds.length === 0) return;

      // Check each workflow for inactivity
      const { data: currentWorkflows } = await supabase
        .from('n8n_workflow_states')
        .select('id, workflow_name, status, updated_at')
        .in('id', workflowIds)
        .in('status', ['running', 'alive']);

      if (!currentWorkflows || currentWorkflows.length === 0) return;

      for (const workflow of currentWorkflows) {
        const timeSinceUpdate = Date.now() - new Date(workflow.updated_at).getTime();
        
        if (timeSinceUpdate >= INACTIVITY_TIMEOUT) {
          console.warn(`[AutomationStatus] Workflow ${workflow.workflow_name} stuck for ${Math.floor(timeSinceUpdate / 1000)}s - marking as failed`);
          
          // Mark workflow as failed
          const { error } = await supabase
            .from('n8n_workflow_states')
            .update({ status: 'failed' })
            .eq('id', workflow.id);

          if (!error) {
            const workflowLabels: Record<string, string> = {
              finder_felix: 'Finder Felix',
              analyse_anna: 'Analyse Anna',
              analyse_anna_auto: 'Analyse Anna',
              pitch_paul: 'Pitch Paul',
              pitch_paul_auto: 'Pitch Paul',
              branding_britta: 'Branding Britta',
              branding_britta_auto: 'Branding Britta',
            };
            
            toast.warning(
              `${workflowLabels[workflow.workflow_name] || workflow.workflow_name} wurde nach 5 Minuten Inaktivität beendet. Pipeline läuft weiter.`,
              { duration: 5000 }
            );
            
            // Trigger advance-pipeline recovery to start next workflow
            console.log('[AutomationStatus] Triggering pipeline recovery after timeout');
            try {
              await supabase.functions.invoke('advance-pipeline', {
                body: { recover: true, pipeline_id: pipeline.id }
              });
            } catch (recoveryError) {
              console.error('[AutomationStatus] Recovery trigger failed:', recoveryError);
            }
            
            // Trigger refetch to update UI
            refetch();
            refetchWorkflows();
          }
        }
      }
    }, CHECK_INTERVAL);

    return () => {
      console.log('[AutomationStatus] Stopping workflow watchdog');
      clearInterval(watchdog);
    };
  }, [pipeline?.id, pipeline?.status, pipeline?.felix_workflow_id, pipeline?.anna_workflow_id, pipeline?.paul_workflow_id, pipeline?.britta_workflow_id, refetchWorkflows]);

  // Calculate time until next phase (30 seconds between workflows)
  useEffect(() => {
    if (pipeline?.status !== 'running' || !workflows.length) {
      setTimeUntilNextPhase(null);
      return;
    }

    const interval = setInterval(() => {
      const list = workflows as WorkflowState[];
      const hasActive = list.some(w => w.status === 'running' || w.status === 'alive');
      if (hasActive) {
        setTimeUntilNextPhase(null);
        return;
      }

      // Find most recent finished workflow (completed or failed)
      let lastFinishTime: number | null = null;
      list.forEach(w => {
        if (w.status === 'completed' && w.completed_at) {
          const t = new Date(w.completed_at).getTime();
          if (!lastFinishTime || t > lastFinishTime) lastFinishTime = t;
        } else if (w.status === 'failed') {
          const t = new Date(w.updated_at).getTime();
          if (!lastFinishTime || t > lastFinishTime) lastFinishTime = t;
        }
      });

      if (!lastFinishTime) {
        setTimeUntilNextPhase(null);
        return;
      }

      const now = Date.now();
      const nextPhaseTime = lastFinishTime + (30 * 1000); // 30 seconds gap
      const remaining = Math.max(0, Math.floor((nextPhaseTime - now) / 1000));
      if (remaining > 0 && remaining <= 30) {
        setTimeUntilNextPhase(remaining);
      } else {
        setTimeUntilNextPhase(null);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [pipeline?.status, workflows]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getWorkflowByName = (name: string) => {
    if (name === 'analyse_anna') {
      return workflows.find((w) => w.workflow_name === 'analyse_anna' || w.workflow_name === 'analyse_anna_auto');
    }
    if (name === 'pitch_paul') {
      return workflows.find((w) => w.workflow_name === 'pitch_paul' || w.workflow_name === 'pitch_paul_auto');
    }
    if (name === 'branding_britta') {
      return workflows.find((w) => w.workflow_name === 'branding_britta' || w.workflow_name === 'branding_britta_auto');
    }
    return workflows.find((w) => w.workflow_name === name);
  };

  const felixWorkflow = getWorkflowByName('finder_felix');
  const annaWorkflow = getWorkflowByName('analyse_anna');
  const paulWorkflow = getWorkflowByName('pitch_paul');
  const brittaWorkflow = getWorkflowByName('branding_britta');

  // Track time since last update for running and alive workflows
  useEffect(() => {
    const interval = setInterval(() => {
      const updates: {[key: string]: number} = {};
      [felixWorkflow, annaWorkflow, paulWorkflow, brittaWorkflow].forEach(workflow => {
        if (workflow && (workflow.status === 'running' || workflow.status === 'alive') && workflow.updated_at) {
          const secondsSince = Math.floor((Date.now() - new Date(workflow.updated_at).getTime()) / 1000);
          updates[workflow.workflow_name] = secondsSince;
        }
      });
      setTimeSinceUpdate(updates);
    }, 1000);

    return () => clearInterval(interval);
  }, [felixWorkflow, annaWorkflow, paulWorkflow, brittaWorkflow]);

  // Felix timer: Force re-render every second for time-based progress
  useEffect(() => {
    if (!felixWorkflow || felixWorkflow.status !== 'running') return;
    
    const interval = setInterval(() => {
      // Force re-render to update Felix progress bar
      setTimeSinceUpdate(prev => ({...prev}));
    }, 1000);
    
    return () => clearInterval(interval);
  }, [felixWorkflow?.status, felixWorkflow?.started_at]);

  // Detect workflow updates and trigger pulse effect
  useEffect(() => {
    // Track active workflows and detect when their updated_at timestamp changes
    const activeWorkflows = [felixWorkflow, annaWorkflow, paulWorkflow, brittaWorkflow].filter(
      w => w && (w.status === 'running' || w.status === 'alive')
    );

    if (activeWorkflows.length === 0) {
      // Reset tracking when no active workflows
      prevWorkflowTimestamps.current = {};
      return;
    }

    let updateDetected = false;

    activeWorkflows.forEach(workflow => {
      const currentTimestamp = workflow.updated_at;
      const prevTimestamp = prevWorkflowTimestamps.current[workflow.workflow_name];

      // If we have a previous timestamp and it's different (newer), an update occurred
      if (prevTimestamp && currentTimestamp !== prevTimestamp) {
        const prevTime = new Date(prevTimestamp).getTime();
        const currentTime = new Date(currentTimestamp).getTime();
        
        // Only trigger if the new timestamp is actually newer (not older due to refetch quirks)
        if (currentTime > prevTime) {
          updateDetected = true;
        }
      }

      // Update the tracked timestamp
      prevWorkflowTimestamps.current[workflow.workflow_name] = currentTimestamp;
    });

    if (updateDetected) {
      setShowProgressPulse(true);
      setTimeout(() => setShowProgressPulse(false), 1200);
    }
  }, [felixWorkflow, annaWorkflow, paulWorkflow, brittaWorkflow]);

  // Recovery handler
  const handleRecoverPipeline = async () => {
    if (!pipeline?.id) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('advance-pipeline', {
        body: { recover: true, pipeline_id: pipeline.id }
      });
      
      if (error) throw error;
      toast.success('Pipeline wird fortgesetzt...');
      refetch();
      refetchWorkflows();
    } catch (err) {
      console.error('Recovery error:', err);
      toast.error('Fehler beim Fortsetzen der Pipeline');
    }
  };

  // Cancel handler
  const handleCancelPipeline = async () => {
    if (!pipeline?.id) return;
    
    if (!window.confirm('Möchtest du die Pipeline wirklich abbrechen? Diese Aktion kann nicht rückgängig gemacht werden.')) {
      return;
    }
    
    try {
      // Mark all active workflows as failed
      const workflowIds = [
        pipeline.felix_workflow_id,
        pipeline.anna_workflow_id,
        pipeline.paul_workflow_id,
        pipeline.britta_workflow_id,
      ].filter(Boolean);
      
      if (workflowIds.length > 0) {
        await supabase
          .from('n8n_workflow_states')
          .update({ status: 'failed' })
          .in('id', workflowIds)
          .in('status', ['running', 'alive', 'pending']);
      }
      
      // Set pipeline to failed with cancellation message
      const { error } = await supabase
        .from('automation_pipelines')
        .update({ 
          status: 'failed',
          error_message: 'Pipeline wurde manuell abgebrochen'
        })
        .eq('id', pipeline.id);
      
      if (error) throw error;
      
      toast.success('Pipeline wurde abgebrochen');
      refetch();
      refetchWorkflows();
    } catch (err) {
      console.error('Cancel error:', err);
      toast.error('Fehler beim Abbrechen der Pipeline');
    }
  };

  const getPhaseStatus = (workflow: WorkflowState | undefined, currentPhase: string | null): 'pending' | 'running' | 'completed' | 'failed' | 'alive' => {
    if (!workflow) return 'pending';
    return workflow.status;
  };

  // Calculate individual phase progress (0-25%)
  const getPhaseProgress = (
    workflow: WorkflowState | undefined,
    maxLoops: number,
    phaseType: 'felix' | 'loop'
  ): number => {
    if (!workflow) return 0;
    // Phase completed or failed -> always 25%
    if (workflow.status === 'completed' || workflow.status === 'failed') return 25;
    if (maxLoops === 0 && phaseType === 'loop') return 0; // indeterminate
    
    if (phaseType === 'felix') {
      // Time-based: 60 seconds
      const elapsed = (Date.now() - new Date(workflow.started_at).getTime()) / 1000;
      const progress = (elapsed / 60) * 25;
      return Math.min(25, Math.max(0, progress));
    } else {
      // Loop-based
      const progress = (workflow.loop_count / maxLoops) * 25;
      return Math.min(25, Math.max(0, progress));
    }
  };

  // Calculate individual workflow progress (0-100%)
  const getIndividualProgress = (
    workflow: WorkflowState | undefined,
    maxLoops: number,
    phaseType: 'felix' | 'loop'
  ): number => {
    if (!workflow) return 0;
    // Phase completed or failed -> always 100%
    if (workflow.status === 'completed' || workflow.status === 'failed') return 100;
    if (maxLoops === 0 && phaseType === 'loop') return 0; // indeterminate
    
    if (phaseType === 'felix') {
      // Time-based: 60 seconds
      const elapsed = (Date.now() - new Date(workflow.started_at).getTime()) / 1000;
      return Math.min(100, Math.max(0, (elapsed / 60) * 100));
    } else {
      // Loop-based
      return Math.min(100, Math.max(0, (workflow.loop_count / maxLoops) * 100));
    }
  };

  const calculateProgress = () => {
    if (!pipeline) return 0;
    if (pipeline.status === 'completed') return 100;

    const felixProgress = getPhaseProgress(felixWorkflow, 0, 'felix');
    const annaProgress = getPhaseProgress(annaWorkflow, workflowMaxLoops.annaMaxLoops, 'loop');
    const paulProgress = getPhaseProgress(paulWorkflow, workflowMaxLoops.paulMaxLoops, 'loop');
    const brittaProgress = getPhaseProgress(brittaWorkflow, workflowMaxLoops.brittaMaxLoops, 'loop');

    const total = felixProgress + annaProgress + paulProgress + brittaProgress;
    return Math.min(100, Math.max(0, total));
  };

  if (pipelineLoading) {
    return (
      <Layout>
        <div className="container mx-auto py-8 space-y-8">
          <div className="animate-pulse space-y-6">
            <div className="h-10 bg-muted rounded w-1/3"></div>
            <div className="h-72 bg-muted rounded"></div>
            <div className="h-[500px] bg-muted rounded"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!pipeline) {
    return (
      <Layout>
        <div className="container mx-auto py-8 animate-fade-in">
          <Card className="border-destructive/50">
            <CardContent className="py-12 text-center">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <p className="text-lg font-medium text-muted-foreground">Pipeline nicht gefunden</p>
              <Button 
                variant="outline" 
                onClick={() => navigate(-1)} 
                className="mt-4"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Zurück
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  const phases = [
    {
      name: 'Finder Felix',
      description: 'Findet passende Unternehmen basierend auf Ihren Kriterien',
      workflow: felixWorkflow,
      progressIcon: Building2,
      progressCount: workflowProgress.felixCount,
      progressLabel: 'Firmen gefunden',
      loopCount: 0,
      maxLoops: 0,
      phaseType: 'felix' as const,
      startedAt: felixWorkflow?.started_at,
    },
    {
      name: 'Analyse Anna',
      description: 'Analysiert gefundene Unternehmen im Detail',
      workflow: annaWorkflow,
      progressIcon: BarChart3,
      progressCount: workflowProgress.annaCount,
      progressLabel: 'Analysen erstellt',
      loopCount: annaWorkflow?.loop_count || 0,
      maxLoops: workflowMaxLoops.annaMaxLoops,
      phaseType: 'loop' as const,
      startedAt: annaWorkflow?.started_at,
    },
    {
      name: 'Pitch Paul',
      description: 'Erstellt personalisierte E-Mails für jedes Unternehmen',
      workflow: paulWorkflow,
      progressIcon: Mail,
      progressCount: workflowProgress.paulCount,
      progressLabel: 'E-Mails erstellt',
      loopCount: paulWorkflow?.loop_count || 0,
      maxLoops: workflowMaxLoops.paulMaxLoops,
      phaseType: 'loop' as const,
      startedAt: paulWorkflow?.started_at,
    },
    {
      name: 'Branding Britta',
      description: 'Optimiert und finalisiert alle E-Mails',
      workflow: brittaWorkflow,
      progressIcon: Sparkles,
      progressCount: workflowProgress.brittaCount,
      progressLabel: 'E-Mails optimiert',
      loopCount: brittaWorkflow?.loop_count || 0,
      maxLoops: workflowMaxLoops.brittaMaxLoops,
      phaseType: 'loop' as const,
      startedAt: brittaWorkflow?.started_at,
    },
  ];

  const progress = calculateProgress();

  return (
    <Layout>
      <div className="container mx-auto py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between animate-fade-in">
          <div>
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="mb-4 hover-scale"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Zurück
            </Button>
            <h1 className="text-4xl font-bold tracking-tight">Automatisierungs-Pipeline</h1>
            <p className="text-muted-foreground mt-2 text-lg">
              Status und Fortschritt Ihrer automatischen Akquise
            </p>
          </div>
        </div>

        {/* Overall Status Card */}
        <Card className={`
          animate-fade-in transition-all duration-300
          ${pipeline.status === 'running' ? 'ring-2 ring-primary/30 shadow-lg shadow-primary/10' : ''}
          ${pipeline.status === 'completed' ? 'ring-2 ring-green-500/30 shadow-lg shadow-green-500/10' : ''}
          ${pipeline.status === 'failed' ? 'ring-2 ring-destructive/30 shadow-lg shadow-destructive/10' : ''}
        `}>
          <CardHeader className="pb-1 pt-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Activity className={`h-4 w-4 ${pipeline.status === 'running' ? 'animate-pulse' : ''}`} />
                Gesamtstatus
              </CardTitle>
              {pipeline.status === 'running' && (
                <div className="flex gap-2">
                  <Button 
                    onClick={handleRecoverPipeline} 
                    variant="outline" 
                    size="sm"
                    className="gap-2"
                  >
                    <RefreshCcw className="h-4 w-4" />
                    Pipeline fortsetzen
                  </Button>
                  <Button 
                    onClick={handleCancelPipeline} 
                    variant="destructive" 
                    size="sm"
                    className="gap-2"
                  >
                    <XCircle className="h-4 w-4" />
                    Abbrechen
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-1.5 pt-0 pb-3">
            <div className="grid md:grid-cols-2 gap-2">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</p>
                <WorkflowStatusBadge 
                  status={pipeline.status as 'pending' | 'running' | 'completed' | 'failed' | 'alive'}
                  className="text-xs px-2 py-1 animate-scale-in"
                />
              </div>
              {(
                (workflows && workflows.length > 0) || pipeline.status === 'completed'
              ) && (
                <div className="space-y-1 text-right">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Aktuelle Phase</p>
                  <p className="text-lg font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                    {(() => {
                      const map: Record<string, string> = {
                        finder_felix: 'Finder Felix',
                        analyse_anna: 'Analyse Anna',
                        analyse_anna_auto: 'Analyse Anna',
                        pitch_paul: 'Pitch Paul',
                        pitch_paul_auto: 'Pitch Paul',
                        branding_britta: 'Branding Britta',
                        branding_britta_auto: 'Branding Britta',
                      };
                      const active = workflows.find(w => w.status === 'running' || w.status === 'alive');
                      if (active) return map[active.workflow_name] || active.workflow_name;
                      if (pipeline.status === 'completed') return 'Abgeschlossen';
                      // fallback: last completed
                      const workflowList = workflows || [];
                      const lastDone = [...workflowList].filter(w => w.status === 'completed').sort((a,b) => {
                        const ta = a.completed_at ? new Date(a.completed_at).getTime() : 0;
                        const tb = b.completed_at ? new Date(b.completed_at).getTime() : 0;
                        return tb - ta;
                      })[0];
                      return lastDone ? map[lastDone.workflow_name] : '—';
                    })()}
                  </p>
                </div>
              )}
            </div>

            {/* Ladeanimation */}
            {(pipeline.status === 'running' || pipeline.status === 'alive') && (() => {
              const activeWorkflow = workflows.find(w => w.status === 'running' || w.status === 'alive');
              
              // 1. If active workflow found → show its animation
              if (activeWorkflow) {
                return <div className="-mt-[100px] mb-[-80px]">
                  <WorkflowLoadingAnimation key={activeWorkflow.workflow_name} workflowName={activeWorkflow.workflow_name} />
                </div>;
              }
              
              // 2. Check if we're waiting for next phase (30-second timer active)
              if (timeUntilNextPhase !== null && timeUntilNextPhase > 0) {
                return <div className="-mt-[100px] mb-[-80px]">
                  <WorkflowLoadingAnimation key="timer" workflowName="timer" />
                </div>;
              }
              
              // 3. Check if current_phase workflow exists - if not, we're still waiting
              // This handles the edge case where current_phase is updated but workflow not yet created
              if (pipeline.current_phase) {
                const phaseToWorkflowMap: Record<string, string> = {
                  finder_felix: 'finder_felix',
                  analyse_anna: 'analyse_anna_auto',
                  analyse_anna_auto: 'analyse_anna_auto',
                  pitch_paul: 'pitch_paul_auto',
                  pitch_paul_auto: 'pitch_paul_auto',
                  branding_britta: 'branding_britta_auto',
                  branding_britta_auto: 'branding_britta_auto',
                };
                
                // Check if the current phase workflow actually exists
                const currentPhaseWorkflow = workflows.find(w => 
                  w.workflow_name === pipeline.current_phase ||
                  w.workflow_name === phaseToWorkflowMap[pipeline.current_phase]
                );
                
                // If current_phase is set but workflow doesn't exist yet → show timer (still waiting)
                if (!currentPhaseWorkflow && pipeline.current_phase !== 'finder_felix' && pipeline.current_phase !== 'completed') {
                  return <div className="-mt-[100px] mb-[-80px]">
                    <WorkflowLoadingAnimation key="timer-waiting" workflowName="timer" />
                  </div>;
                }
                
                // Workflow exists → show its animation
                const workflowName = phaseToWorkflowMap[pipeline.current_phase];
                if (workflowName) {
                  return <div className="-mt-[100px] mb-[-80px]">
                    <WorkflowLoadingAnimation key={workflowName} workflowName={workflowName} />
                  </div>;
                }
              }
              
              return null;
            })()}

            <div className="space-y-3">
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-xs">Gesamtfortschritt</span>
                  <span className="text-lg font-bold tabular-nums">{Math.round(progress)}%</span>
                </div>
                <Progress 
                  value={progress}
                  showPulse={showProgressPulse}
                  isActive={pipeline.status === 'running'}
                  className="h-3"
                />
              </div>

              {/* Phase Details */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-1">
                <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 border border-border/50">
                  <Building2 className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide truncate">Firmen</p>
                    <p className="text-sm font-bold tabular-nums">{workflowProgress.felixCount}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 border border-border/50">
                  <BarChart3 className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide truncate">Analysen</p>
                    <p className="text-sm font-bold tabular-nums">
                      {workflowProgress.annaCount} <span className="text-muted-foreground text-xs">von {workflowMaxLoops.annaMaxLoops}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 border border-border/50">
                  <Mail className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide truncate">Emails</p>
                    <p className="text-sm font-bold tabular-nums">
                      {workflowProgress.paulCount} <span className="text-muted-foreground text-xs">von {workflowMaxLoops.paulMaxLoops}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 border border-border/50">
                  <Sparkles className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide truncate">Optimiert</p>
                    <p className="text-sm font-bold tabular-nums">
                      {workflowProgress.brittaCount} <span className="text-muted-foreground text-xs">von {workflowMaxLoops.brittaMaxLoops}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {pipeline.error_message && (
              <div className="flex items-start gap-2 p-2 bg-destructive/10 border border-destructive/20 rounded-lg animate-fade-in">
                <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                <div className="space-y-0.5">
                  <p className="font-semibold text-destructive text-xs">Fehler aufgetreten</p>
                  <p className="text-xs text-destructive/90 leading-relaxed">{pipeline.error_message}</p>
                </div>
              </div>
            )}

            {pipeline.status === 'running' && timeUntilNextPhase !== null && timeUntilNextPhase > 0 && (
              <div className="flex items-center gap-2 p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg animate-fade-in">
                <Timer className="h-4 w-4 text-blue-600 dark:text-blue-400 animate-pulse flex-shrink-0" />
                <div>
                  <p className="text-[10px] font-medium text-muted-foreground">Nächste Phase startet in</p>
                  <p className="text-lg font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                    {formatTime(timeUntilNextPhase)}
                  </p>
                </div>
              </div>
            )}

            {timeSinceUpdate && Object.keys(timeSinceUpdate).length > 0 && pipeline.status === 'running' && (
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground pt-1 border-t">
                <Clock className="h-3 w-3 animate-pulse" />
                <span className="tabular-nums">
                  Letzte Aktivität vor <span className="font-semibold">
                    {Math.floor(Math.max(...Object.values(timeSinceUpdate)) / 60)}m {Math.max(...Object.values(timeSinceUpdate)) % 60}s
                  </span>
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pipeline Configuration */}
        <Card className="animate-fade-in" style={{ animationDelay: '100ms' }}>
          <CardHeader>
            <CardTitle className="text-xl">Pipeline-Konfiguration</CardTitle>
            <CardDescription>Einstellungen für diese Automatisierung</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              {(pipeline.config as any).city && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Stadt</p>
                    <p className="text-base font-medium mt-1">{(pipeline.config as any).city}</p>
                  </div>
                </div>
              )}
              {(pipeline.config as any).state && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Bundesland</p>
                    <p className="text-base font-medium mt-1">{(pipeline.config as any).state}</p>
                  </div>
                </div>
              )}
              {(pipeline.config as any).category && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <Target className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Branche</p>
                    <p className="text-base font-medium mt-1">{(pipeline.config as any).category}</p>
                  </div>
                </div>
              )}
              {((pipeline.config as any).projectDescription || (pipeline.config as any).vorhaben) && (
                <div className="flex items-start gap-3 md:col-span-3 p-4 rounded-lg bg-muted/50">
                  <FileText className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Ihr Vorhaben</p>
                    <p className="text-base leading-relaxed mt-2">
                      {(pipeline.config as any).projectDescription || (pipeline.config as any).vorhaben}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Workflow Timeline */}
        <Card className="animate-fade-in" style={{ animationDelay: '200ms' }}>
          <CardHeader>
            <CardTitle className="text-xl">Workflow-Ablauf</CardTitle>
            <CardDescription>Status der einzelnen Automatisierungsschritte</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {phases.map((phase, index) => {
                const status = getPhaseStatus(phase.workflow, pipeline.current_phase);
                const isActive = phase.workflow?.status === 'running' || phase.workflow?.status === 'alive';

                return (
                  <div 
                    key={phase.name} 
                    className="flex gap-6 animate-fade-in"
                    style={{ animationDelay: `${300 + index * 100}ms` }}
                  >
                    {/* Timeline indicator */}
                    <div className="flex flex-col items-center">
                      <div
                        className={`
                          w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300
                          ${status === 'completed' ? 'bg-green-500 text-white shadow-lg shadow-green-500/50' : ''}
                          ${status === 'running' || status === 'alive' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/50 ring-4 ring-blue-500/20' : ''}
                          ${status === 'pending' ? 'bg-muted text-muted-foreground' : ''}
                          ${status === 'failed' ? 'bg-destructive text-destructive-foreground shadow-lg shadow-destructive/50' : ''}
                        `}
                      >
                        {status === 'completed' && <CheckCircle2 className="h-6 w-6 animate-scale-in" />}
                        {(status === 'running' || status === 'alive') && <Activity className="h-6 w-6 animate-pulse" />}
                        {status === 'pending' && <Clock className="h-6 w-6" />}
                        {status === 'failed' && <AlertCircle className="h-6 w-6" />}
                      </div>
                      {index < phases.length - 1 && (
                        <div className={`
                          w-1 h-20 my-2 rounded-full transition-all duration-500
                          ${status === 'completed' ? 'bg-green-500' : 'bg-border'}
                          ${(status === 'running' || status === 'alive') ? 'bg-gradient-to-b from-blue-500 to-border animate-pulse' : ''}
                        `} />
                      )}
                    </div>

                    {/* Phase content */}
                    <div className={`
                      flex-1 pb-8 transition-all duration-300
                      ${isActive ? 'transform scale-[1.02]' : ''}
                    `}>
                      <Card className={`
                        transition-all duration-300 hover:shadow-lg
                        ${isActive ? 'ring-2 ring-primary/50 shadow-lg shadow-primary/20 bg-primary/5' : ''}
                        ${status === 'completed' ? 'border-green-500/30 bg-green-500/5' : ''}
                        ${status === 'failed' ? 'border-destructive/30 bg-destructive/5' : ''}
                      `}>
                        <CardHeader>
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-2">
                              <h3 className="font-bold text-xl">{phase.name}</h3>
                              <p className="text-sm text-muted-foreground leading-relaxed">{phase.description}</p>
                            </div>
                            {phase.workflow && (
                              <WorkflowStatusBadge 
                                status={phase.workflow.status} 
                                className="flex-shrink-0"
                              />
                            )}
                          </div>
                          
                          {/* Progress Badge and Bar */}
                          <div className="pt-3 space-y-3">
                            <WorkflowProgressBadge
                              icon={phase.progressIcon}
                              count={phase.phaseType === 'felix' && phase.workflow?.status === 'running'
                                ? Math.max(0, 60 - Math.floor((Date.now() - new Date(phase.workflow.started_at).getTime()) / 1000))
                                : phase.phaseType === 'loop' ? phase.loopCount : phase.progressCount}
                              label={phase.progressLabel}
                              isLoading={workflowProgress.isLoading || workflowMaxLoops.isLoading}
                              maxCount={phase.phaseType === 'loop' ? phase.maxLoops : undefined}
                              showRatio={phase.phaseType === 'loop'}
                              timeRemaining={phase.phaseType === 'felix' && phase.workflow?.status === 'running'
                                ? Math.max(0, 60 - Math.floor((Date.now() - new Date(phase.workflow.started_at).getTime()) / 1000))
                                : undefined}
                            />
                            {phase.workflow && (
                              <div className="space-y-1.5">
                                <div className="flex justify-between items-center">
                                  <span className="text-xs font-medium text-muted-foreground">Workflow-Fortschritt</span>
                                  <span className="text-sm font-bold tabular-nums">
                                    {Math.round(getIndividualProgress(phase.workflow, phase.maxLoops, phase.phaseType))}%
                                  </span>
                                </div>
                                <Progress
                                  value={getIndividualProgress(phase.workflow, phase.maxLoops, phase.phaseType)}
                                  showPulse={isActive && showProgressPulse}
                                  isActive={isActive}
                                  isIndeterminate={phase.maxLoops === 0 && phase.phaseType === 'loop' && phase.workflow.status !== 'completed' && phase.workflow.status !== 'failed'}
                                  className="h-2"
                                />
                              </div>
                            )}
                          </div>
                        </CardHeader>

                        {phase.workflow?.result_summary && (
                          <CardContent className="pt-0">
                            <div className="p-4 bg-muted/50 rounded-lg border">
                              <p className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wide">
                                Ergebnis
                              </p>
                              <p className="text-sm leading-relaxed">
                                {typeof phase.workflow.result_summary === 'string'
                                  ? phase.workflow.result_summary
                                  : JSON.stringify(phase.workflow.result_summary)}
                              </p>
                            </div>
                            
                            {phase.workflow && (
                              <Button
                                variant="outline"
                                size="default"
                                className="mt-4 hover-scale w-full sm:w-auto"
                                onClick={() => {
                                  setSelectedWorkflow(phase.workflow || null);
                                  setIsChatOpen(true);
                                }}
                              >
                                <MessageSquare className="mr-2 h-4 w-4" />
                                Chat öffnen
                              </Button>
                            )}
                          </CardContent>
                        )}

                        {!phase.workflow?.result_summary && phase.workflow && (
                          <CardContent className="pt-0">
                            <Button
                              variant="outline"
                              size="default"
                              className="hover-scale w-full sm:w-auto"
                              onClick={() => {
                                setSelectedWorkflow(phase.workflow || null);
                                setIsChatOpen(true);
                              }}
                            >
                              <MessageSquare className="mr-2 h-4 w-4" />
                              Chat öffnen
                            </Button>
                          </CardContent>
                        )}
                      </Card>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Chat Interface Dialog */}
        <Dialog open={isChatOpen} onOpenChange={setIsChatOpen}>
          <DialogContent className="max-w-3xl h-[80vh]">
            <DialogHeader>
              <DialogTitle>
                {selectedWorkflow ? 
                  `Chat: ${selectedWorkflow.workflow_name.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}` 
                  : 'Chat'
                }
              </DialogTitle>
            </DialogHeader>
            {selectedWorkflow && (
              <ChatInterface
                workflowStateId={selectedWorkflow.id}
                workflowName={selectedWorkflow.workflow_name as 'finder_felix' | 'analyse_anna' | 'pitch_paul' | 'branding_britta'}
                projectId={pipeline.project_id}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
