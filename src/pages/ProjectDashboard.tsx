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
import { useWorkflowStatus } from '@/hooks/useWorkflowStatus';
import { useCompanies } from '@/hooks/useCompanies';
import { useEmails } from '@/hooks/useEmails';
import { useSingleWorkflowStatus } from '@/hooks/useSingleWorkflowStatus';
import { WorkflowStatusBadge } from '@/components/workflows/WorkflowStatusBadge';
import { AutomationCard } from '@/components/automation/AutomationCard';
import { SingleFinderFelixDialog } from '@/components/workflows/SingleFinderFelixDialog';
import { SingleAnalyseAnnaDialog } from '@/components/workflows/SingleAnalyseAnnaDialog';
import { SinglePitchPaulDialog } from '@/components/workflows/SinglePitchPaulDialog';
import { SingleBrandingBrittaDialog } from '@/components/workflows/SingleBrandingBrittaDialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PaulWorkflowConfig } from '@/types/workflow';
import { 
  ArrowLeft, 
  Building2, 
  Mail, 
  Zap, 
  Search, 
  BarChart3, 
  Send,
  Settings,
  Sparkles,
  XCircle
} from 'lucide-react';
import { useWorkflowCancel } from '@/hooks/useWorkflowCancel';

export default function ProjectDashboard() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Dialog states
  const [felixDialogOpen, setFelixDialogOpen] = useState(false);
  const [annaDialogOpen, setAnnaDialogOpen] = useState(false);
  const [paulDialogOpen, setPaulDialogOpen] = useState(false);
  const [brittaDialogOpen, setBrittaDialogOpen] = useState(false);
  
  // Trigger states
  const [isTriggeringFelix, setIsTriggeringFelix] = useState(false);
  const [isTriggeringAnna, setIsTriggeringAnna] = useState(false);
  const [isTriggeringPaul, setIsTriggeringPaul] = useState(false);
  const [isTriggeringBritta, setIsTriggeringBritta] = useState(false);

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

  // Companies Data
  const { companies, isLoading: companiesLoading } = useCompanies(
    id || '',
    undefined,
    undefined,
    { page: 0, pageSize: 1000 }
  );

  const totalCompanies = companies.length;
  const foundCompanies = companies.filter((c) => c.status === 'found').length;
  const analyzedCompanies = companies.filter((c) => c.analysis !== null).length;

  // Emails Data
  const { emails, isLoading: emailsLoading } = useEmails(
    id || '',
    undefined,
    undefined
  );

  const totalEmails = emails.length;
  const draftEmails = emails.filter((e) => e.status === 'draft').length;
  const sentEmails = emails.filter((e) => e.status === 'sent').length;
  const improvedEmails = emails.filter((e) => e.body_improved && e.body_improved.length > 0).length;
  
  // Single workflow status tracking
  const { workflow: felixWorkflow, isRunning: felixRunning } = useSingleWorkflowStatus(id || '', 'finder_felix');
  const { workflow: annaWorkflow, isRunning: annaRunning } = useSingleWorkflowStatus(id || '', 'analyse_anna_auto');
  const { workflow: paulWorkflow, isRunning: paulRunning } = useSingleWorkflowStatus(id || '', 'pitch_paul_auto');
  const { workflow: brittaWorkflow, isRunning: brittaRunning } = useSingleWorkflowStatus(id || '', 'branding_britta_auto');
  
  // Cancel workflow hook
  const { cancelWorkflow, isCancelling } = useWorkflowCancel();
  
  // Counts for dialogs
  const companiesWithWebsite = companies.filter((c) => c.website && c.website.length > 0).length;
  const emailsWithoutImprovement = emails.filter((e) => !e.body_improved || e.body_improved.length === 0).length;
  
  // Trigger functions
  const triggerFelix = async (config: { city: string; state: string; category: string; maxCompanies?: number }) => {
    if (!id || !user?.id) return;
    setIsTriggeringFelix(true);
    
    try {
      const { data: workflowState, error: dbError } = await supabase
        .from('n8n_workflow_states')
        .insert({
          project_id: id,
          user_id: user.id,
          workflow_name: 'finder_felix',
          status: 'running',
          trigger_data: config,
        })
        .select()
        .single();
      
      if (dbError) throw dbError;
      
      const { error: functionError } = await supabase.functions.invoke('trigger-n8n-workflow', {
        body: {
          workflow_name: 'finder_felix',
          workflow_id: workflowState.id,
          project_id: id,
          user_id: user.id,
          trigger_data: config,
        },
      });
      
      if (functionError) throw functionError;
      
      toast.success('Finder Felix wurde gestartet');
      setFelixDialogOpen(false);
      navigate(`/projects/${id}/workflow-status/${workflowState.id}`);
    } catch (error: any) {
      console.error('Error triggering Felix:', error);
      toast.error(`Fehler: ${error.message}`);
    } finally {
      setIsTriggeringFelix(false);
    }
  };
  
  const triggerAnna = async () => {
    if (!id || !user?.id) return;
    setIsTriggeringAnna(true);
    
    try {
      const { data: workflowState, error: dbError } = await supabase
        .from('n8n_workflow_states')
        .insert({
          project_id: id,
          user_id: user.id,
          workflow_name: 'analyse_anna_auto',
          status: 'running',
          trigger_data: {},
        })
        .select()
        .single();
      
      if (dbError) throw dbError;
      
      const { error: functionError } = await supabase.functions.invoke('trigger-n8n-workflow', {
        body: {
          workflow_name: 'analyse_anna_auto',
          workflow_id: workflowState.id,
          project_id: id,
          user_id: user.id,
          trigger_data: {},
        },
      });
      
      if (functionError) throw functionError;
      
      toast.success('Analyse Anna wurde gestartet');
      setAnnaDialogOpen(false);
      navigate(`/projects/${id}/workflow-status/${workflowState.id}`);
    } catch (error: any) {
      console.error('Error triggering Anna:', error);
      toast.error(`Fehler: ${error.message}`);
    } finally {
      setIsTriggeringAnna(false);
    }
  };
  
  const triggerPaul = async (config: PaulWorkflowConfig) => {
    if (!id || !user?.id) return;
    setIsTriggeringPaul(true);
    
    try {
      const { data: workflowState, error: dbError } = await supabase
        .from('n8n_workflow_states')
        .insert([{
          project_id: id,
          user_id: user.id,
          workflow_name: 'pitch_paul_auto',
          status: 'running' as const,
          trigger_data: { 
            userGoal: config.vorhaben,
            templateEnumName: config.templateEnumName,
            sellerContact: config.sellerContact,
          } as any,
        }])
        .select()
        .single();
      
      if (dbError) throw dbError;
      
      const { error: functionError } = await supabase.functions.invoke('trigger-n8n-workflow', {
        body: {
          workflow_name: 'pitch_paul_auto',
          workflow_id: workflowState.id,
          project_id: id,
          user_id: user.id,
          trigger_data: { 
            userGoal: config.vorhaben,
            templateEnumName: config.templateEnumName,
            sellerContact: config.sellerContact,
          } as any,
        },
      });
      
      if (functionError) throw functionError;
      
      toast.success('Pitch Paul wurde gestartet');
      setPaulDialogOpen(false);
      navigate(`/projects/${id}/workflow-status/${workflowState.id}`);
    } catch (error: any) {
      console.error('Error triggering Paul:', error);
      toast.error(`Fehler: ${error.message}`);
    } finally {
      setIsTriggeringPaul(false);
    }
  };
  
  const triggerBritta = async () => {
    if (!id || !user?.id) return;
    setIsTriggeringBritta(true);
    
    try {
      const { data: workflowState, error: dbError } = await supabase
        .from('n8n_workflow_states')
        .insert({
          project_id: id,
          user_id: user.id,
          workflow_name: 'branding_britta_auto',
          status: 'running',
          trigger_data: {},
        })
        .select()
        .single();
      
      if (dbError) throw dbError;
      
      const { error: functionError } = await supabase.functions.invoke('trigger-n8n-workflow', {
        body: {
          workflow_name: 'branding_britta_auto',
          workflow_id: workflowState.id,
          project_id: id,
          user_id: user.id,
          trigger_data: {},
        },
      });
      
      if (functionError) throw functionError;
      
      toast.success('Branding Britta wurde gestartet');
      setBrittaDialogOpen(false);
      navigate(`/projects/${id}/workflow-status/${workflowState.id}`);
    } catch (error: any) {
      console.error('Error triggering Britta:', error);
      toast.error(`Fehler: ${error.message}`);
    } finally {
      setIsTriggeringBritta(false);
    }
  };

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

              {/* Automation Card - Full Width */}
              <AutomationCard projectId={id || ''} />

              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Companies Card */}
                <Card 
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => navigate(`/projects/${id}/companies`)}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Firmen
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-3xl font-bold text-foreground">
                          {companiesLoading ? '-' : totalCompanies}
                        </p>
                        <div className="flex gap-2 mt-2 flex-wrap">
                          <Badge variant="secondary" className="text-xs">
                            Gefunden: {companiesLoading ? '-' : foundCompanies}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            Analysiert: {companiesLoading ? '-' : analyzedCompanies}
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
                <Card 
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => navigate(`/projects/${id}/emails`)}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      E-Mails
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-3xl font-bold text-foreground">
                          {emailsLoading ? '-' : totalEmails}
                        </p>
                        <div className="flex gap-2 mt-2 flex-wrap">
                          <Badge variant="secondary" className="text-xs">
                            Entwürfe: {emailsLoading ? '-' : draftEmails}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            Verbessert: {emailsLoading ? '-' : improvedEmails}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            Versendet: {emailsLoading ? '-' : sentEmails}
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
                <Card 
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => navigate(`/projects/${id}/workflows`)}
                >
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Finder Felix Card */}
                <Card className="border-2 border-primary/20 hover:border-primary/40 transition-colors">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <Search className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <CardTitle className="text-base">Finder Felix</CardTitle>
                          <CardDescription className="text-xs">
                            Firmen finden
                          </CardDescription>
                        </div>
                      </div>
                      {felixRunning && <WorkflowStatusBadge status="running" />}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-2">
                    {felixRunning ? (
                      <>
                        <Button 
                          size="sm"
                          className="w-full" 
                          onClick={() => navigate(`/projects/${id}/workflow-status/${felixWorkflow?.id}`)}
                        >
                          Details anzeigen
                        </Button>
                        <Button 
                          size="sm"
                          variant="destructive"
                          className="w-full"
                          disabled={isCancelling}
                          onClick={() => felixWorkflow && cancelWorkflow(felixWorkflow.id, 'Finder Felix')}
                        >
                          <XCircle className="mr-2 h-3 w-3" />
                          Abbrechen
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button 
                          size="sm"
                          className="w-full" 
                          disabled={!canManage}
                          onClick={() => navigate(`/projects/${id}/finder-felix`)}
                        >
                          <Search className="mr-2 h-3 w-3" />
                          Mit Felix chatten
                        </Button>
                        <Button 
                          size="sm"
                          variant="outline"
                          className="w-full" 
                          disabled={!canManage}
                          onClick={() => setFelixDialogOpen(true)}
                        >
                          Batch starten
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Analyse Anna Card */}
                <Card className="border-2 border-accent/20 hover:border-accent/40 transition-colors">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                          <BarChart3 className="h-4 w-4 text-accent" />
                        </div>
                        <div className="min-w-0">
                          <CardTitle className="text-base">Analyse Anna</CardTitle>
                          <CardDescription className="text-xs">
                            Firmen analysieren
                          </CardDescription>
                        </div>
                      </div>
                      {annaRunning && <WorkflowStatusBadge status="running" />}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-2">
                    {annaRunning ? (
                      <>
                        <Button 
                          size="sm"
                          className="w-full" 
                          onClick={() => navigate(`/projects/${id}/workflow-status/${annaWorkflow?.id}`)}
                        >
                          Details anzeigen
                        </Button>
                        <Button 
                          size="sm"
                          variant="destructive"
                          className="w-full"
                          disabled={isCancelling}
                          onClick={() => annaWorkflow && cancelWorkflow(annaWorkflow.id, 'Analyse Anna')}
                        >
                          <XCircle className="mr-2 h-3 w-3" />
                          Abbrechen
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button 
                          size="sm"
                          className="w-full" 
                          variant="outline" 
                          disabled={!canManage}
                          onClick={() => navigate(`/projects/${id}/analyse-anna`)}
                        >
                          <BarChart3 className="mr-2 h-3 w-3" />
                          Mit Anna chatten
                        </Button>
                        <Button 
                          size="sm"
                          variant="outline"
                          className="w-full" 
                          disabled={!canManage}
                          onClick={() => setAnnaDialogOpen(true)}
                        >
                          Batch starten
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Pitch Paul Card */}
                <Card className="border-2 border-secondary/50 hover:border-secondary transition-colors">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-secondary/50 flex items-center justify-center shrink-0">
                          <Mail className="h-4 w-4 text-foreground" />
                        </div>
                        <div className="min-w-0">
                          <CardTitle className="text-base">Pitch Paul</CardTitle>
                          <CardDescription className="text-xs">
                            E-Mails generieren
                          </CardDescription>
                        </div>
                      </div>
                      {paulRunning && <WorkflowStatusBadge status="running" />}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-2">
                    {paulRunning ? (
                      <>
                        <Button 
                          size="sm"
                          className="w-full" 
                          onClick={() => navigate(`/projects/${id}/workflow-status/${paulWorkflow?.id}`)}
                        >
                          Details anzeigen
                        </Button>
                        <Button 
                          size="sm"
                          variant="destructive"
                          className="w-full"
                          disabled={isCancelling}
                          onClick={() => paulWorkflow && cancelWorkflow(paulWorkflow.id, 'Pitch Paul')}
                        >
                          <XCircle className="mr-2 h-3 w-3" />
                          Abbrechen
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button 
                          size="sm"
                          className="w-full" 
                          variant="outline" 
                          disabled={!canManage}
                          onClick={() => navigate(`/projects/${id}/pitch-paul`)}
                        >
                          <Mail className="mr-2 h-3 w-3" />
                          Mit Paul chatten
                        </Button>
                        <Button 
                          size="sm"
                          variant="outline"
                          className="w-full" 
                          disabled={!canManage}
                          onClick={() => setPaulDialogOpen(true)}
                        >
                          Batch starten
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Branding Britta Card */}
                <Card className="border-2 border-purple-500/20 hover:border-purple-500/40 transition-colors">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0">
                          <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div className="min-w-0">
                          <CardTitle className="text-base">Branding Britta</CardTitle>
                          <CardDescription className="text-xs">
                            E-Mails verschönern
                          </CardDescription>
                        </div>
                      </div>
                      {brittaRunning && <WorkflowStatusBadge status="running" />}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-2">
                    {brittaRunning ? (
                      <>
                        <Button 
                          size="sm"
                          className="w-full" 
                          onClick={() => navigate(`/projects/${id}/workflow-status/${brittaWorkflow?.id}`)}
                        >
                          Details anzeigen
                        </Button>
                        <Button 
                          size="sm"
                          variant="destructive"
                          className="w-full"
                          disabled={isCancelling}
                          onClick={() => brittaWorkflow && cancelWorkflow(brittaWorkflow.id, 'Branding Britta')}
                        >
                          <XCircle className="mr-2 h-3 w-3" />
                          Abbrechen
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button 
                          size="sm"
                          className="w-full" 
                          variant="outline" 
                          disabled={!canManage}
                          onClick={() => navigate(`/projects/${id}/branding-britta`)}
                        >
                          <Sparkles className="mr-2 h-3 w-3" />
                          Mit Britta chatten
                        </Button>
                        <Button 
                          size="sm"
                          variant="outline"
                          className="w-full" 
                          disabled={!canManage}
                          onClick={() => setBrittaDialogOpen(true)}
                        >
                          Batch starten
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Email Versand Card */}
                <Card className="border-2 border-green-500/20 hover:border-green-500/40 transition-colors">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                        <Send className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="text-base">E-Mail Versand</CardTitle>
                        <CardDescription className="text-xs">
                          E-Mails versenden
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Button size="sm" className="w-full" variant="outline" disabled={!canManage}>
                      <Send className="mr-2 h-3 w-3" />
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
      <SingleFinderFelixDialog
        open={felixDialogOpen}
        onOpenChange={setFelixDialogOpen}
        onStart={triggerFelix}
        isStarting={isTriggeringFelix}
      />
      
      <SingleAnalyseAnnaDialog
        open={annaDialogOpen}
        onOpenChange={setAnnaDialogOpen}
        onStart={triggerAnna}
        isStarting={isTriggeringAnna}
        companiesCount={companiesWithWebsite}
      />
      
      <SinglePitchPaulDialog
        open={paulDialogOpen}
        onOpenChange={setPaulDialogOpen}
        onStart={triggerPaul}
        isStarting={isTriggeringPaul}
        companiesCount={analyzedCompanies}
      />
      
      <SingleBrandingBrittaDialog
        open={brittaDialogOpen}
        onOpenChange={setBrittaDialogOpen}
        onStart={triggerBritta}
        isStarting={isTriggeringBritta}
        emailsCount={emailsWithoutImprovement}
      />
    </SidebarProvider>
  );
}
