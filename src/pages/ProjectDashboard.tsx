import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useProjects } from '@/hooks/useProjects';
import { useOrganizations } from '@/hooks/useOrganizations';
import { useOrganizationMembers } from '@/hooks/useOrganizationMembers';
import { useAuth } from '@/contexts/AuthContext';
import { FinderFelixDialog } from '@/components/workflows/FinderFelixDialog';
import { AnalyseAnnaDialog } from '@/components/workflows/AnalyseAnnaDialog';
import { PitchPaulDialog } from '@/components/workflows/PitchPaulDialog';
import { useWorkflowStatus } from '@/hooks/useWorkflowStatus';
import { WorkflowStatusBadge } from '@/components/workflows/WorkflowStatusBadge';
import { 
  ArrowLeft, 
  Building2, 
  Mail, 
  Zap, 
  Search, 
  BarChart3, 
  Send,
  Settings 
} from 'lucide-react';

export default function ProjectDashboard() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [finderFelixOpen, setFinderFelixOpen] = useState(false);
  const [analyseAnnaOpen, setAnalyseAnnaOpen] = useState(false);
  const [pitchPaulOpen, setPitchPaulOpen] = useState(false);

  const { organizations, isLoading: orgsLoading } = useOrganizations();
  
  // Find project across all organizations
  const allProjects = organizations.flatMap(org => {
    const { projects } = useProjects(org.id);
    return projects || [];
  });
  
  const project = allProjects.find(p => p.id === id);
  const { members, isLoading: membersLoading } = useOrganizationMembers(
    project?.organization_id
  );

  const currentMember = members.find((m) => m.user_id === user?.id);
  const canManage =
    currentMember?.role === 'owner' || currentMember?.role === 'manager';

  const organization = organizations.find(
    (org) => org.id === project?.organization_id
  );

  // Workflow Status
  const { counts: workflowCounts, isLoading: workflowsLoading } = useWorkflowStatus(id || '');

  if (orgsLoading || membersLoading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <AppSidebar />
          <div className="flex flex-col flex-1 overflow-hidden">
            <Header />
            <main className="flex-1 overflow-y-auto p-6">
              <Skeleton className="h-12 w-64 mb-6" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  if (!project) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <AppSidebar />
          <div className="flex flex-col flex-1 overflow-hidden">
            <Header />
            <main className="flex-1 overflow-y-auto p-6">
              <div className="max-w-4xl mx-auto text-center py-16">
                <h1 className="text-2xl font-bold text-foreground mb-4">
                  Projekt nicht gefunden
                </h1>
                <Button onClick={() => navigate('/projects')}>
                  Zurück zur Übersicht
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

        <div className="flex flex-col flex-1 overflow-hidden">
          <Header />

          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Back Button */}
              <Button
                variant="ghost"
                onClick={() => navigate('/projects')}
                className="mb-4"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Zurück
              </Button>

              {/* Project Header */}
              <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 rounded-lg p-8 border border-border">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Building2 className="h-4 w-4" />
                      <span>{organization?.name}</span>
                    </div>
                    <h1 className="text-3xl font-bold text-foreground mb-2">
                      {project.title}
                    </h1>
                    {project.description && (
                      <p className="text-muted-foreground max-w-2xl">
                        {project.description}
                      </p>
                    )}
                  </div>
                  {canManage && (
                    <Button
                      variant="outline"
                      onClick={() => navigate(`/projects/${id}/settings`)}
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Einstellungen
                    </Button>
                  )}
                </div>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Companies Card */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Firmen
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-3xl font-bold text-foreground">-</p>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="secondary" className="text-xs">
                            Gefunden: -
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            Analysiert: -
                          </Badge>
                        </div>
                      </div>
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Emails Card */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      E-Mails
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-3xl font-bold text-foreground">-</p>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="secondary" className="text-xs">
                            Draft: -
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            Sent: -
                          </Badge>
                        </div>
                      </div>
                      <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center">
                        <Mail className="h-6 w-6 text-accent" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Workflows Card */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Workflows
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-3xl font-bold text-foreground">
                          {workflowsLoading ? '-' : workflowCounts.total}
                        </p>
                        <div className="flex gap-2 mt-2 flex-wrap">
                          {workflowCounts.running > 0 && (
                            <WorkflowStatusBadge 
                              status="running" 
                              showIcon={false}
                              className="text-xs"
                            />
                          )}
                          {workflowCounts.completed > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              Completed: {workflowCounts.completed}
                            </Badge>
                          )}
                          {workflowCounts.failed > 0 && (
                            <WorkflowStatusBadge 
                              status="failed" 
                              showIcon={false}
                              className="text-xs"
                            />
                          )}
                        </div>
                      </div>
                      <div className="h-12 w-12 rounded-full bg-secondary/50 flex items-center justify-center">
                        <Zap className="h-6 w-6 text-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Action Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Finder Felix Card */}
                <Card className="border-2 border-primary/20 hover:border-primary/40 transition-colors">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Search className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle>Finder Felix</CardTitle>
                        <CardDescription>
                          Firmen in Deutschland finden
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Durchsuchen Sie die Datenbank nach passenden Firmen basierend auf
                      Branche, Standort und weiteren Kriterien.
                    </p>
                    <Button 
                      className="w-full" 
                      disabled={!canManage}
                      onClick={() => setFinderFelixOpen(true)}
                    >
                      <Search className="mr-2 h-4 w-4" />
                      Firmen suchen
                    </Button>
                  </CardContent>
                </Card>

                {/* Analyse Anna Card */}
                <Card className="border-2 border-accent/20 hover:border-accent/40 transition-colors">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
                        <BarChart3 className="h-5 w-5 text-accent" />
                      </div>
                      <div>
                        <CardTitle>Analyse Anna</CardTitle>
                        <CardDescription>
                          Firmen analysieren lassen
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      KI-gestützte Analyse der Firmen mit Informationen zu Produkten,
                      Services und Ansprechpartnern.
                    </p>
                    <Button 
                      className="w-full" 
                      variant="outline" 
                      disabled={!canManage}
                      onClick={() => setAnalyseAnnaOpen(true)}
                    >
                      <BarChart3 className="mr-2 h-4 w-4" />
                      Firmen analysieren
                    </Button>
                  </CardContent>
                </Card>

                {/* Pitch Paul Card */}
                <Card className="border-2 border-secondary/50 hover:border-secondary transition-colors">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-secondary/50 flex items-center justify-center">
                        <Mail className="h-5 w-5 text-foreground" />
                      </div>
                      <div>
                        <CardTitle>Pitch Paul</CardTitle>
                        <CardDescription>
                          E-Mails generieren lassen
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Lassen Sie personalisierte Cold-Calling E-Mails basierend auf der
                      Firmenanalyse erstellen.
                    </p>
                    <Button 
                      className="w-full" 
                      variant="outline" 
                      disabled={!canManage}
                      onClick={() => setPitchPaulOpen(true)}
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      E-Mails generieren
                    </Button>
                  </CardContent>
                </Card>

                {/* Email Versand Card */}
                <Card className="border-2 border-green-500/20 hover:border-green-500/40 transition-colors">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                        <Send className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <CardTitle>E-Mail Versand</CardTitle>
                        <CardDescription>
                          E-Mails versenden
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Senden Sie die generierten E-Mails einzeln oder im Batch-Modus an
                      Ihre Kontakte.
                    </p>
                    <Button className="w-full" variant="outline" disabled={!canManage}>
                      <Send className="mr-2 h-4 w-4" />
                      E-Mails senden
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity Placeholder */}
              <Card>
                <CardHeader>
                  <CardTitle>Letzte Aktivitäten</CardTitle>
                  <CardDescription>
                    Übersicht über die neuesten Änderungen in diesem Projekt
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-center text-muted-foreground py-8">
                    Noch keine Aktivitäten vorhanden.
                  </p>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>

      {/* Workflow Dialogs */}
      {id && (
        <>
          <FinderFelixDialog
            open={finderFelixOpen}
            onOpenChange={setFinderFelixOpen}
            projectId={id}
          />
          <AnalyseAnnaDialog
            open={analyseAnnaOpen}
            onOpenChange={setAnalyseAnnaOpen}
            projectId={id}
          />
          <PitchPaulDialog
            open={pitchPaulOpen}
            onOpenChange={setPitchPaulOpen}
            projectId={id}
          />
        </>
      )}
    </SidebarProvider>
  );
}
