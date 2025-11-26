import { useParams, useNavigate } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { WorkflowStatusBadge } from '@/components/workflows/WorkflowStatusBadge';
import { useWorkflowStatus } from '@/hooks/useWorkflowStatus';
import { ArrowLeft, Zap, MessageSquare, Activity, CheckCircle2, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

const workflowNameMap: Record<string, string> = {
  finder_felix: 'Finder Felix',
  analyse_anna: 'Analyse Anna',
  analyse_anna_auto: 'Analyse Anna',
  pitch_paul: 'Pitch Paul',
  pitch_paul_auto: 'Pitch Paul',
  branding_britta: 'Branding Britta',
  branding_britta_auto: 'Branding Britta',
};

const workflowChatPaths: Record<string, string> = {
  finder_felix: 'finder-felix',
  analyse_anna: 'analyse-anna',
  pitch_paul: 'pitch-paul',
  branding_britta: 'branding-britta',
};

export default function ProjectWorkflows() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { workflows, counts, isLoading } = useWorkflowStatus(id || '');

  if (isLoading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <AppSidebar />
          <div className="flex flex-col flex-1 overflow-hidden">
            <Header />
            <main className="flex-1 overflow-y-auto p-6">
              <Skeleton className="h-12 w-64 mb-6" />
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
              <Skeleton className="h-96 w-full" />
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

        <div className="flex flex-col flex-1 overflow-hidden">
          <Header />

          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Header with Back Button */}
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  onClick={() => navigate(`/projects/${id}`)}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Zurück
                </Button>
                <div>
                  <h1 className="text-3xl font-bold text-foreground">Workflow-Übersicht</h1>
                  <p className="text-muted-foreground mt-1">
                    Alle Workflows und deren Status im Überblick
                  </p>
                </div>
              </div>

              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Gesamt
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-foreground">{counts.total}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400 animate-pulse" />
                      Aktiv
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                      {counts.running + counts.pending}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                      Abgeschlossen
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                      {counts.completed}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                      Fehlgeschlagen
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                      {counts.failed}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Workflows Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Alle Workflows</CardTitle>
                </CardHeader>
                <CardContent>
                  {workflows.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Noch keine Workflows gestartet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {workflows.map((workflow) => (
                        <Card key={workflow.id} className="border-border/50">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="font-semibold text-foreground">
                                    {workflowNameMap[workflow.workflow_name] || workflow.workflow_name}
                                  </h3>
                                  <WorkflowStatusBadge status={workflow.status} />
                                </div>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <span className="font-medium">Gestartet:</span>
                                    {format(new Date(workflow.started_at), 'dd.MM.yyyy HH:mm', { locale: de })}
                                  </span>
                                  {workflow.completed_at && (
                                    <span className="flex items-center gap-1">
                                      <span className="font-medium">Abgeschlossen:</span>
                                      {format(new Date(workflow.completed_at), 'dd.MM.yyyy HH:mm', { locale: de })}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                {workflowChatPaths[workflow.workflow_name] && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      navigate(`/projects/${id}/${workflowChatPaths[workflow.workflow_name]}`)
                                    }
                                  >
                                    <MessageSquare className="h-4 w-4 mr-2" />
                                    Chat öffnen
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
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
