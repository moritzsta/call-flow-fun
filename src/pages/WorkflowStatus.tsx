import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { WorkflowStatusBadge } from '@/components/workflows/WorkflowStatusBadge';
import { WorkflowLoadingAnimation } from '@/components/workflows/WorkflowLoadingAnimation';
import { useWorkflowMaxLoops } from '@/hooks/useWorkflowMaxLoops';
import { useWorkflowCancel } from '@/hooks/useWorkflowCancel';
import { ArrowLeft, MessageSquare, XCircle, Building2, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { useEffect, useCallback, useState, useRef } from 'react';

interface WorkflowState {
  id: string;
  workflow_name: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'alive';
  created_at: string;
  started_at: string;
  completed_at: string | null;
  updated_at: string;
  trigger_data: any;
  result_summary: any;
  loop_count: number;
  conversation_active: boolean | null;
  last_message_at: string | null;
  project_id: string;
}

const workflowLabels: Record<string, string> = {
  finder_felix: 'Finder Felix',
  analyse_anna_auto: 'Analyse Anna',
  pitch_paul_auto: 'Pitch Paul',
  branding_britta_auto: 'Branding Britta',
  sende_susan: 'Sende Susan',
};

export default function WorkflowStatus() {
  const { id: projectId, workflowId } = useParams<{ id: string; workflowId: string }>();
  const navigate = useNavigate();
  const { cancelWorkflow, isCancelling } = useWorkflowCancel();
  
  // Track time since last DB update
  const [timeSinceUpdate, setTimeSinceUpdate] = useState<number>(0);
  const [showProgressPulse, setShowProgressPulse] = useState(false);
  const prevUpdatedAt = useRef<string | null>(null);

  const { data: workflow, isLoading, refetch } = useQuery({
    queryKey: ['workflow-state', workflowId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('n8n_workflow_states')
        .select('*')
        .eq('id', workflowId)
        .single();

      if (error) throw error;
      return data as WorkflowState;
    },
    enabled: !!workflowId,
  });

  const isActive = workflow?.status === 'running' || workflow?.status === 'alive';
  const isFinderFelix = workflow?.workflow_name === 'finder_felix';
  
  const { annaMaxLoops, paulMaxLoops, brittaMaxLoops } = useWorkflowMaxLoops(
    workflow?.project_id,
    isActive
  );

  // Live companies count for Finder Felix
  const { data: companiesCount, refetch: refetchCompanies } = useQuery({
    queryKey: ['companies-count-felix', workflow?.project_id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('companies')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', workflow?.project_id);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!workflow?.project_id && isFinderFelix,
    refetchInterval: isActive && isFinderFelix ? 3000 : false,
  });

  const stableRefetchCompanies = useCallback(() => {
    refetchCompanies();
  }, [refetchCompanies]);

  // Determine max loops based on workflow name
  const getMaxLoops = (workflowName: string): number => {
    if (workflowName.includes('anna')) return annaMaxLoops;
    if (workflowName.includes('paul')) return paulMaxLoops;
    if (workflowName.includes('britta')) return brittaMaxLoops;
    return 0;
  };

  const maxLoopsValue = workflow ? getMaxLoops(workflow.workflow_name) : 0;

  // Realtime subscription for workflow state updates
  useEffect(() => {
    if (!workflowId) return;

    const channel = supabase
      .channel(`workflow-detail-${workflowId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'n8n_workflow_states',
          filter: `id=eq.${workflowId}`,
        },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workflowId, refetch]);

  // Realtime subscription for companies (Finder Felix only)
  useEffect(() => {
    if (!workflow?.project_id || !isFinderFelix || !isActive) return;

    const channel = supabase
      .channel(`companies-felix-${workflow.project_id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'companies',
          filter: `project_id=eq.${workflow.project_id}`,
        },
        () => {
          stableRefetchCompanies();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workflow?.project_id, isFinderFelix, isActive, stableRefetchCompanies]);

  // Track time since last update
  useEffect(() => {
    if (!workflow || !isActive) {
      setTimeSinceUpdate(0);
      return;
    }

    const interval = setInterval(() => {
      if (workflow.updated_at) {
        const secondsSince = Math.floor((Date.now() - new Date(workflow.updated_at).getTime()) / 1000);
        setTimeSinceUpdate(secondsSince);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [workflow?.updated_at, isActive]);

  // Detect updates and trigger pulse effect
  useEffect(() => {
    if (!workflow?.updated_at || !isActive) return;

    const currentTimestamp = workflow.updated_at;
    const prevTimestamp = prevUpdatedAt.current;

    if (prevTimestamp && currentTimestamp !== prevTimestamp) {
      const prevTime = new Date(prevTimestamp).getTime();
      const currentTime = new Date(currentTimestamp).getTime();
      
      if (currentTime > prevTime) {
        setShowProgressPulse(true);
        setTimeout(() => setShowProgressPulse(false), 1200);
      }
    }

    prevUpdatedAt.current = currentTimestamp;
  }, [workflow?.updated_at, isActive]);

  if (isLoading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <AppSidebar />
          <div className="flex flex-col flex-1">
            <Header />
            <main className="flex-1 p-6">
              <div className="max-w-4xl mx-auto">
                <p className="text-muted-foreground">Lädt...</p>
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  if (!workflow) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <AppSidebar />
          <div className="flex flex-col flex-1">
            <Header />
            <main className="flex-1 p-6">
              <div className="max-w-4xl mx-auto text-center py-16">
                <h1 className="text-2xl font-bold mb-4">Workflow nicht gefunden</h1>
                <Button onClick={() => navigate(`/projects/${projectId}`)}>
                  Zurück zum Projekt
                </Button>
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  const workflowLabel = workflowLabels[workflow.workflow_name] || workflow.workflow_name;
  const progress = maxLoopsValue > 0 ? Math.min((workflow.loop_count / maxLoopsValue) * 100, 100) : 0;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex flex-col flex-1">
          <Header />
          <main className="flex-1 p-6 overflow-y-auto">
            <div className="max-w-4xl mx-auto space-y-6">
              <Button
                variant="ghost"
                onClick={() => navigate(`/projects/${projectId}`)}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Zurück zum Projekt
              </Button>

              <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 rounded-lg p-8 border">
                <div className="flex items-center justify-between mb-4">
                  <h1 className="text-3xl font-bold">{workflowLabel}</h1>
                  <div className="flex items-center gap-2">
                    <WorkflowStatusBadge status={workflow.status} />
                    {isActive && (
                      <Button 
                        size="sm"
                        variant="destructive"
                        disabled={isCancelling}
                        onClick={() => cancelWorkflow(workflow.id, workflowLabel)}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Abbrechen
                      </Button>
                    )}
                  </div>
                </div>
                <p className="text-muted-foreground">
                  Gestartet {formatDistanceToNow(new Date(workflow.started_at), { addSuffix: true, locale: de })}
                </p>
              </div>

              {isActive && (
                <WorkflowLoadingAnimation 
                  key={workflow.workflow_name}
                  workflowName={workflow.workflow_name} 
                />
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Status Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isFinderFelix ? (
                    // Finder Felix: Show live company count
                    <div>
                      <p className="text-sm text-muted-foreground">Gefundene Firmen</p>
                      <div className="mt-2">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-primary" />
                            <span className="text-2xl font-bold">{companiesCount ?? 0}</span>
                            {workflow.trigger_data?.maxCompanies && (
                              <span className="text-muted-foreground">
                                / {workflow.trigger_data.maxCompanies} max
                              </span>
                            )}
                          </div>
                          {isActive && (
                            <span className="text-sm text-muted-foreground animate-pulse">
                              Live aktualisiert...
                            </span>
                          )}
                        </div>
                        {workflow.trigger_data?.maxCompanies && (
                          <div className="w-full bg-secondary rounded-full h-2 mt-3">
                            <div
                              className="bg-primary h-2 rounded-full transition-all"
                              style={{ 
                                width: `${Math.min((companiesCount || 0) / workflow.trigger_data.maxCompanies * 100, 100)}%` 
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    // Other workflows: Show loop count progress
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Fortschritt</p>
                        <div className="mt-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">
                              {workflow.loop_count} / {maxLoopsValue > 0 ? maxLoopsValue : '∞'} Durchläufe
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {progress.toFixed(0)}%
                            </span>
                          </div>
                          <Progress 
                            value={progress}
                            showPulse={showProgressPulse}
                            isActive={isActive}
                            className="h-3"
                          />
                        </div>
                      </div>
                      
                      {/* Time since last DB update */}
                      {isActive && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30 border border-border/50">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Letzte DB-Änderung:</span>
                          <span className={`text-sm font-medium tabular-nums ${
                            timeSinceUpdate > 120 ? 'text-destructive' : 
                            timeSinceUpdate > 60 ? 'text-warning' : 'text-foreground'
                          }`}>
                            vor {timeSinceUpdate}s
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {workflow.trigger_data && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Trigger-Daten</p>
                      <div className="bg-muted p-3 rounded-md text-xs font-mono">
                        <pre className="whitespace-pre-wrap">
                          {JSON.stringify(workflow.trigger_data, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}

                  {workflow.conversation_active && (
                    <Button
                      onClick={() => {
                        const workflowRoutes: Record<string, string> = {
                          finder_felix: 'finder-felix',
                          analyse_anna_auto: 'analyse-anna',
                          pitch_paul_auto: 'pitch-paul',
                          branding_britta_auto: 'branding-britta',
                        };
                        const route = workflowRoutes[workflow.workflow_name];
                        if (route) {
                          navigate(`/projects/${projectId}/${route}`);
                        }
                      }}
                      variant="outline"
                      className="w-full"
                    >
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Chat öffnen
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
