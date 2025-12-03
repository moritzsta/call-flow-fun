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
import { ArrowLeft, XCircle, Mail, CheckCircle } from 'lucide-react';
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

export default function WorkflowSendeSusan() {
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
    queryKey: ['susan-email-counts', projectId],
    queryFn: async () => {
      const { data: emails, error } = await supabase
        .from('project_emails')
        .select('id, status')
        .eq('project_id', projectId!);

      if (error) throw error;

      const total = emails?.length || 0;
      const sent = emails?.filter(e => e.status === 'sent').length || 0;

      return { total, sent };
    },
    enabled: !!projectId,
    refetchInterval: workflow?.status === 'running' || workflow?.status === 'alive' ? 3000 : false,
  });

  const isActive = workflow?.status === 'running' || workflow?.status === 'alive';
  const progress = emailCounts && emailCounts.total > 0 
    ? (emailCounts.sent / emailCounts.total) * 100 
    : 0;

  // Realtime subscription for workflow state
  useEffect(() => {
    if (!workflowId) return;

    const channel = supabase
      .channel(`susan-workflow-${workflowId}`)
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
      .channel(`susan-emails-${projectId}`)
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

              <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 rounded-lg p-8 border">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <Mail className="h-5 w-5 text-primary" />
                    </div>
                    <h1 className="text-3xl font-bold">Sende Susan</h1>
                  </div>
                  <div className="flex items-center gap-2">
                    <WorkflowStatusBadge status={workflow.status} />
                    {isActive && (
                      <Button 
                        size="sm"
                        variant="destructive"
                        disabled={isCancelling}
                        onClick={() => cancelWorkflow(workflow.id, 'Sende Susan')}
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
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    E-Mail Versand Fortschritt
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Progress Display */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">Versendet</span>
                      </div>
                      <span className="text-2xl font-bold">
                        {emailCounts?.sent ?? 0} / {emailCounts?.total ?? 0}
                      </span>
                    </div>
                    
                    <Progress value={progress} className="h-3" />
                    
                    <p className="text-sm text-muted-foreground text-center">
                      {progress.toFixed(0)}% abgeschlossen
                    </p>
                  </div>

                  {/* Status Summary */}
                  {workflow.status === 'completed' && (
                    <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 text-center">
                      <CheckCircle className="h-8 w-8 text-primary mx-auto mb-2" />
                      <p className="font-medium text-primary">
                        Alle E-Mails wurden erfolgreich versendet!
                      </p>
                    </div>
                  )}

                  {workflow.status === 'failed' && (
                    <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 text-center">
                      <XCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
                      <p className="font-medium text-destructive">
                        Der Versand wurde abgebrochen oder ist fehlgeschlagen.
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
