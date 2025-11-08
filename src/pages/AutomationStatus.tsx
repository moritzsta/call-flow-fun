import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { WorkflowStatusBadge } from '@/components/workflows/WorkflowStatusBadge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, Circle, Clock, AlertCircle, MessageSquare, Timer, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

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
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
    refetchInterval: (query) => {
      // Refetch every 2 seconds if pipeline is running
      return query.state.data?.status === 'running' ? 2000 : false;
    },
  });

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
    if (pipeline?.status !== 'running' || !workflows.length || !pipeline.current_phase) {
      setTimeUntilNextPhase(null);
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      let triggerTime: number | null = null;

      // Map phase names to workflow names
      const phaseToWorkflowName: {[key: string]: string} = {
        felix: 'finder_felix',
        anna: 'analyse_anna',
        paul: 'pitch_paul',
        britta: 'branding_britta',
      };

      const currentWorkflowName = phaseToWorkflowName[pipeline.current_phase];
      const currentWorkflow = workflows.find(w => w.workflow_name === currentWorkflowName);

      if (!currentWorkflow) {
        setTimeUntilNextPhase(null);
        return;
      }

      // Determine trigger time based on current workflow status
      if (currentWorkflow.status === 'completed' && currentWorkflow.completed_at) {
        // Workflow completed normally - start countdown from completed_at
        triggerTime = new Date(currentWorkflow.completed_at).getTime();
      } else if (currentWorkflow.status === 'failed') {
        // Workflow failed - start countdown from failure time (updated_at)
        triggerTime = new Date(currentWorkflow.updated_at).getTime();
      } else {
        // Workflow is running or alive - check if 4 minutes have passed since last update
        const lastUpdate = new Date(currentWorkflow.updated_at).getTime();
        const inactivityTimeout = 4 * 60 * 1000; // 4 minutes
        if (now >= lastUpdate + inactivityTimeout) {
          triggerTime = lastUpdate + inactivityTimeout;
        }
      }

      // Calculate remaining time and display only if within 2-minute window
      if (triggerTime) {
        const nextPhaseTime = triggerTime + (2 * 60 * 1000); // 2 minutes after trigger
        const remaining = Math.max(0, Math.floor((nextPhaseTime - now) / 1000));

        if (remaining > 0 && remaining <= 120) {
          setTimeUntilNextPhase(remaining);
        } else {
          setTimeUntilNextPhase(null);
        }
      } else {
        setTimeUntilNextPhase(null);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [pipeline, workflows]);

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

  const getPhaseStatus = (workflow: WorkflowState | undefined, currentPhase: string | null) => {
    if (!workflow) return 'pending';
    if (workflow.status === 'completed') return 'completed';
    if (workflow.status === 'failed') return 'failed';
    if (workflow.status === 'running') return 'running';
    return 'pending';
  };

  const calculateProgress = () => {
    if (!pipeline) return 0;
    if (pipeline.status === 'completed') return 100;
    
    const phases = ['felix', 'anna', 'paul', 'britta'];
    const currentIndex = phases.indexOf(pipeline.current_phase || '');
    
    if (currentIndex === -1) return 0;
    return ((currentIndex + 1) / 4) * 100;
  };

  if (pipelineLoading) {
    return (
      <Layout>
        <div className="container mx-auto p-6 space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </Layout>
    );
  }

  if (!pipeline) {
    return (
      <Layout>
        <div className="container mx-auto p-6">
          <Card>
            <CardHeader>
              <CardTitle>Keine Pipeline gefunden</CardTitle>
              <CardDescription>
                Es wurde noch keine Automation-Pipeline gestartet.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </Layout>
    );
  }

  const phases = [
    {
      name: 'Finder Felix',
      workflow: felixWorkflow,
      icon: Circle,
      description: 'Firmen suchen',
      chatPath: `/projects/${projectId}/workflows/finder-felix`,
    },
    {
      name: 'Analyse Anna',
      workflow: annaWorkflow,
      icon: Circle,
      description: 'Firmen analysieren',
      chatPath: `/projects/${projectId}/workflows/analyse-anna`,
    },
    {
      name: 'Pitch Paul',
      workflow: paulWorkflow,
      icon: Circle,
      description: 'E-Mails generieren',
      chatPath: `/projects/${projectId}/workflows/pitch-paul`,
    },
    {
      name: 'Branding Britta',
      workflow: brittaWorkflow,
      icon: Circle,
      description: 'E-Mails optimieren',
      chatPath: `/projects/${projectId}/workflows/branding-britta`,
    },
  ];

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Automation Pipeline</h1>
          <p className="text-muted-foreground">
            Überwachen Sie den Fortschritt Ihrer automatischen Workflows
          </p>
        </div>

        {/* Overall Status Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Gesamt-Status</CardTitle>
                <CardDescription>
                  {pipeline.status === 'running' && 'Pipeline wird ausgeführt...'}
                  {pipeline.status === 'completed' && 'Pipeline erfolgreich abgeschlossen'}
                  {pipeline.status === 'failed' && 'Pipeline fehlgeschlagen'}
                </CardDescription>
              </div>
              <Badge
                variant={
                  pipeline.status === 'completed'
                    ? 'default'
                    : pipeline.status === 'failed'
                    ? 'destructive'
                    : 'secondary'
                }
              >
                {pipeline.status === 'running' && 'Läuft'}
                {pipeline.status === 'completed' && 'Abgeschlossen'}
                {pipeline.status === 'failed' && 'Fehlgeschlagen'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Fortschritt</span>
                  <span className="text-sm text-muted-foreground">
                    {Math.round(calculateProgress())}%
                  </span>
                </div>
                <Progress value={calculateProgress()} />
              </div>

              {pipeline.error_message && (
                <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                  <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-destructive">Fehler</p>
                    <p className="text-sm text-destructive/80">{pipeline.error_message}</p>
                  </div>
                </div>
              )}

              {timeUntilNextPhase !== null && (
                <div className="flex items-center gap-3 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <Timer className="h-5 w-5 text-blue-600 animate-pulse" />
                  <div className="flex-1">
                    <p className="font-medium text-blue-600">Wartezeit zwischen Workflows</p>
                    <p className="text-sm text-blue-600/80">
                      Nächste Phase startet in {formatTime(timeUntilNextPhase)}
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Gestartet:</span>
                  <p className="font-medium">
                    {new Date(pipeline.created_at).toLocaleString('de-DE')}
                  </p>
                </div>
                {pipeline.completed_at && (
                  <div>
                    <span className="text-muted-foreground">Abgeschlossen:</span>
                    <p className="font-medium">
                      {new Date(pipeline.completed_at).toLocaleString('de-DE')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pipeline Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Konfiguration</CardTitle>
          </CardHeader>
          <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Stadt:</span>
                  <p className="font-medium">
                    {(pipeline.config as any).city}, {(pipeline.config as any).state}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Kategorie:</span>
                  <p className="font-medium">{(pipeline.config as any).category}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">Vorhaben:</span>
                  <p className="font-medium">{(pipeline.config as any).vorhaben}</p>
                </div>
              </div>
          </CardContent>
        </Card>

        {/* Workflow Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Workflow Timeline</CardTitle>
            <CardDescription>Schritt-für-Schritt Ausführung</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {phases.map((phase, index) => {
                const status = getPhaseStatus(phase.workflow, pipeline.current_phase);
                // Map current_phase to workflow_name properly
                const phaseToWorkflowName: {[key: string]: string} = {
                  felix: 'finder_felix',
                  anna: 'analyse_anna',
                  paul: 'pitch_paul',
                  britta: 'branding_britta',
                };
                const isActive = pipeline.current_phase && phaseToWorkflowName[pipeline.current_phase] === phase.workflow?.workflow_name;

                return (
                  <div key={phase.name} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div
                        className={cn(
                          'rounded-full p-2 border-2',
                          status === 'completed' &&
                            'bg-green-500/10 border-green-500 text-green-600',
                          status === 'running' &&
                            'bg-blue-500/10 border-blue-500 text-blue-600 animate-pulse',
                          status === 'failed' &&
                            'bg-red-500/10 border-red-500 text-red-600',
                          status === 'pending' &&
                            'bg-muted border-muted-foreground/20 text-muted-foreground'
                        )}
                      >
                        {status === 'completed' ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : status === 'running' ? (
                          <Clock className="h-5 w-5" />
                        ) : (
                          <phase.icon className="h-5 w-5" />
                        )}
                      </div>
                      {index < phases.length - 1 && (
                        <div
                          className={cn(
                            'w-0.5 h-12 mt-2',
                            status === 'completed'
                              ? 'bg-green-500'
                              : 'bg-muted-foreground/20'
                          )}
                        />
                      )}
                    </div>

                    <div className="flex-1 pb-6">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h3 className="font-semibold">{phase.name}</h3>
                          <p className="text-sm text-muted-foreground">{phase.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {phase.workflow && (
                            <>
                              <WorkflowStatusBadge status={phase.workflow.status} />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(phase.chatPath);
                                }}
                              >
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Chat öffnen
                              </Button>
                            </>
                          )}
                        </div>
                      </div>

                      {(phase.workflow?.status === 'running' || phase.workflow?.status === 'alive') && (
                        <div className="mt-2 text-sm text-muted-foreground">
                          Gestartet am {new Date(phase.workflow.started_at).toLocaleString('de-DE')}
                          {timeSinceUpdate[phase.workflow.workflow_name] !== undefined && (
                            <div className="flex items-center gap-2 mt-1 text-emerald-600 dark:text-emerald-400">
                              <Activity className="w-4 h-4 animate-pulse" />
                              <span>
                                {phase.workflow.status === 'alive' ? 'Workflow aktiv' : 'Läuft'} 
                                (zuletzt aktualisiert vor {timeSinceUpdate[phase.workflow.workflow_name]}s)
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {phase.workflow?.result_summary && (
                        <div className="mt-2 p-3 bg-muted/50 rounded-lg text-sm">
                          <pre className="whitespace-pre-wrap">
                            {JSON.stringify(phase.workflow.result_summary, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
