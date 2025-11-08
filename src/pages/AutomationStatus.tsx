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
  Timer
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

interface WorkflowState {
  id: string;
  workflow_name: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'alive';
  result_summary: any;
  started_at: string;
  completed_at: string | null;
  updated_at: string;
}

export default function AutomationStatus() {
  const { id: projectId } = useParams();
  const navigate = useNavigate();
  const [timeUntilNextPhase, setTimeUntilNextPhase] = useState<number | null>(null);
  const [timeSinceUpdate, setTimeSinceUpdate] = useState<{[key: string]: number}>({});
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowState | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showProgressPulse, setShowProgressPulse] = useState(false);
  const prevTimeSinceUpdate = useRef<number>(0);

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

  // Fetch workflow states
  const { data: workflows = [] } = useQuery({
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

  // Calculate time until next phase (2 minutes between workflows)
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
      const nextPhaseTime = lastFinishTime + (2 * 60 * 1000); // 2 minutes gap
      const remaining = Math.max(0, Math.floor((nextPhaseTime - now) / 1000));
      if (remaining > 0 && remaining <= 120) {
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

  // Detect workflow updates and trigger pulse effect
  useEffect(() => {
    if (Object.keys(timeSinceUpdate).length === 0) return;

    const currentMax = Math.max(...Object.values(timeSinceUpdate));
    
    // If time since update drops significantly (> 5 seconds), an update occurred
    if (prevTimeSinceUpdate.current > 5 && currentMax < prevTimeSinceUpdate.current - 5) {
      setShowProgressPulse(true);
      setTimeout(() => setShowProgressPulse(false), 1200);
    }
    
    prevTimeSinceUpdate.current = currentMax;
  }, [timeSinceUpdate]);

  const getPhaseStatus = (workflow: WorkflowState | undefined, currentPhase: string | null): 'pending' | 'running' | 'completed' | 'failed' | 'alive' => {
    if (!workflow) return 'pending';
    return workflow.status;
  };

  const calculateProgress = () => {
    if (!pipeline) return 0;
    if (pipeline.status === 'completed') return 100;

    const total = 4;
    const completed = workflows.filter(w => w.status === 'completed').length;
    const hasActive = workflows.some(w => w.status === 'running' || w.status === 'alive');
    const value = ((completed + (hasActive ? 1 : 0)) / total) * 100;
    return Math.min(100, Math.max(0, value));
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
    },
    {
      name: 'Analyse Anna',
      description: 'Analysiert gefundene Unternehmen im Detail',
      workflow: annaWorkflow,
      progressIcon: BarChart3,
      progressCount: workflowProgress.annaCount,
      progressLabel: 'Analysen erstellt',
    },
    {
      name: 'Pitch Paul',
      description: 'Erstellt personalisierte E-Mails für jedes Unternehmen',
      workflow: paulWorkflow,
      progressIcon: Mail,
      progressCount: workflowProgress.paulCount,
      progressLabel: 'E-Mails erstellt',
    },
    {
      name: 'Branding Britta',
      description: 'Optimiert und finalisiert alle E-Mails',
      workflow: brittaWorkflow,
      progressIcon: Sparkles,
      progressCount: workflowProgress.brittaCount,
      progressLabel: 'E-Mails optimiert',
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
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <Activity className={`h-6 w-6 ${pipeline.status === 'running' ? 'animate-pulse' : ''}`} />
              Gesamtstatus
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            <div className="grid md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Status</p>
                <WorkflowStatusBadge 
                  status={pipeline.status as 'pending' | 'running' | 'completed' | 'failed' | 'alive'}
                  className="text-base px-4 py-2 animate-scale-in"
                />
              </div>
              {(
                (workflows && workflows.length > 0) || pipeline.status === 'completed'
              ) && (
                <div className="space-y-2 text-right">
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Aktuelle Phase</p>
                  <p className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                    {(() => {
                      const map: Record<string, string> = {
                        finder_felix: 'Finder Felix',
                        analyse_anna: 'Analyse Anna',
                        pitch_paul: 'Pitch Paul',
                        branding_britta: 'Branding Britta',
                      };
                      const active = workflows.find(w => w.status === 'running' || w.status === 'alive');
                      if (active) return map[active.workflow_name] || active.workflow_name;
                      if (pipeline.status === 'completed') return 'Abgeschlossen';
                      // fallback: last completed
                      const lastDone = [...workflows].filter(w => w.status === 'completed').sort((a,b) => {
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
              if (activeWorkflow) {
                return <WorkflowLoadingAnimation workflowName={activeWorkflow.workflow_name} />;
              }
              // Show timer animation during waiting period between workflows
              if (timeUntilNextPhase !== null && timeUntilNextPhase > 0) {
                return <WorkflowLoadingAnimation workflowName="timer" />;
              }
              return null;
            })()}

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-base">Gesamtfortschritt</span>
                <span className="text-2xl font-bold tabular-nums">{Math.round(progress)}%</span>
              </div>
              <Progress 
                value={progress}
                showPulse={showProgressPulse}
                className={`
                  h-3 transition-all duration-500
                  ${pipeline.status === 'running' ? 'bg-primary/10' : 'bg-secondary'}
                `}
              />
            </div>

            {pipeline.error_message && (
              <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg animate-fade-in">
                <AlertCircle className="h-6 w-6 text-destructive mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="font-semibold text-destructive text-base">Fehler aufgetreten</p>
                  <p className="text-sm text-destructive/90 leading-relaxed">{pipeline.error_message}</p>
                </div>
              </div>
            )}

            {pipeline.status === 'running' && timeUntilNextPhase !== null && timeUntilNextPhase > 0 && (
              <div className="flex items-center gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg animate-fade-in">
                <Timer className="h-6 w-6 text-blue-600 dark:text-blue-400 animate-pulse flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Nächste Phase startet in</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                    {formatTime(timeUntilNextPhase)}
                  </p>
                </div>
              </div>
            )}

            {timeSinceUpdate && Object.keys(timeSinceUpdate).length > 0 && pipeline.status === 'running' && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t">
                <Clock className="h-4 w-4 animate-pulse" />
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
                          
                          {/* Progress Badge */}
                          <div className="pt-3">
                            <WorkflowProgressBadge
                              icon={phase.progressIcon}
                              count={phase.progressCount}
                              label={phase.progressLabel}
                              isLoading={workflowProgress.isLoading}
                            />
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
