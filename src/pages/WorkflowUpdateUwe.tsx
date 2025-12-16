import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { WorkflowStatusBadge } from '@/components/workflows/WorkflowStatusBadge';
import { WorkflowLoadingAnimation } from '@/components/workflows/WorkflowLoadingAnimation';
import { useWorkflowCancel } from '@/hooks/useWorkflowCancel';
import { ArrowLeft, XCircle, RefreshCw, CheckCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { useEffect } from 'react';

interface WorkflowState {
  id: string;
  workflow_name: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'alive';
  created_at: string;
  started_at: string;
  completed_at: string | null;
  trigger_data: any;
  result_summary: any;
  loop_count: number;
  project_id: string;
}

export default function WorkflowUpdateUwe() {
  const { id: projectId, workflowId } = useParams<{ id: string; workflowId: string }>();
  const navigate = useNavigate();
  const { cancelWorkflow, isCancelling } = useWorkflowCancel();

  // Workflow state query
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

  // Email counts for progress
  const { data: emailCounts, refetch: refetchEmails } = useQuery({
    queryKey: ['uwe-email-counts', projectId],
    queryFn: async () => {
      const { data: emails, error } = await supabase
        .from('project_emails')
        .select('id, body_improved')
        .eq('project_id', projectId!);

      if (error) throw error;

      const total = emails?.length || 0;
      // Count emails that have been updated (have body_improved)
      const updated = emails?.filter(e => e.body_improved && e.body_improved.length > 0).length || 0;

      return { total, updated };
    },
    enabled: !!projectId,
    refetchInterval: workflow?.status === 'running' || workflow?.status === 'alive' ? 3000 : false,
  });

  const isActive = workflow?.status === 'running' || workflow?.status === 'alive';
  const progress = emailCounts && emailCounts.total > 0 
    ? (workflow?.loop_count || 0) / emailCounts.total * 100 
    : 0;

  // Realtime subscription for workflow state
  useEffect(() => {
    if (!workflowId) return;

    const channel = supabase
      .channel(`uwe-workflow-${workflowId}`)
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

  // Realtime subscription for email updates
  useEffect(() => {
    if (!projectId || !isActive) return;

    const channel = supabase
      .channel(`uwe-emails-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'project_emails',
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          refetchEmails();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, isActive, refetchEmails]);

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

              <div className="bg-gradient-to-r from-teal-500/10 via-teal-400/10 to-teal-500/10 rounded-lg p-8 border border-teal-500/20">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-teal-500/20 flex items-center justify-center">
                      <RefreshCw className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                    </div>
                    <h1 className="text-3xl font-bold">Update Uwe</h1>
                  </div>
                  <div className="flex items-center gap-2">
                    <WorkflowStatusBadge status={workflow.status} />
                    {isActive && (
                      <Button 
                        size="sm"
                        variant="destructive"
                        disabled={isCancelling}
                        onClick={() => cancelWorkflow(workflow.id, 'Update Uwe')}
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
                {workflow.trigger_data?.userGoal && (
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Ziel:</p>
                    <p className="text-sm font-medium">{workflow.trigger_data.userGoal}</p>
                  </div>
                )}
              </div>

              {isActive && (
                <WorkflowLoadingAnimation 
                  key={workflow.workflow_name}
                  workflowName={workflow.workflow_name} 
                />
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <RefreshCw className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                    E-Mail Update Fortschritt
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Progress Display */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                        <span className="text-sm font-medium">Bearbeitet</span>
                      </div>
                      <span className="text-2xl font-bold">
                        {workflow.loop_count || 0} / {emailCounts?.total ?? 0}
                      </span>
                    </div>
                    
                    <Progress value={progress} className="h-3" />
                    
                    <p className="text-sm text-muted-foreground text-center">
                      {progress.toFixed(0)}% abgeschlossen
                    </p>
                  </div>

                  {/* Status Summary */}
                  {workflow.status === 'completed' && (
                    <div className="bg-teal-500/10 border border-teal-500/30 rounded-lg p-4 text-center">
                      <CheckCircle className="h-8 w-8 text-teal-600 dark:text-teal-400 mx-auto mb-2" />
                      <p className="font-medium text-teal-600 dark:text-teal-400">
                        Alle E-Mails wurden erfolgreich aktualisiert!
                      </p>
                    </div>
                  )}

                  {workflow.status === 'failed' && (
                    <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 text-center">
                      <XCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
                      <p className="font-medium text-destructive">
                        Der Update-Vorgang wurde abgebrochen oder ist fehlgeschlagen.
                      </p>
                    </div>
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
