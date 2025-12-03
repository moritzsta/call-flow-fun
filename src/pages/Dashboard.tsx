import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganizations } from '@/hooks/useOrganizations';
import { useProjects } from '@/hooks/useProjects';
import { useAllWorkflows } from '@/hooks/useAllWorkflows';
import { OrganizationCards } from '@/components/dashboard/OrganizationCards';
import { RecentProjects } from '@/components/dashboard/RecentProjects';
import { ActiveWorkflows } from '@/components/dashboard/ActiveWorkflows';
import { CreateOrganizationDialog } from '@/components/organizations/CreateOrganizationDialog';
import { Building2, FolderOpen, Zap } from 'lucide-react';

export default function Dashboard() {
  const { profile } = useAuth();
  const [createOrgDialogOpen, setCreateOrgDialogOpen] = useState(false);

  const { organizations, isLoading: orgsLoading, error: orgsError, refetch: refetchOrgs } = useOrganizations();
  const { projects, isLoading: projectsLoading, error: projectsError, refetch: refetchProjects } = useProjects();
  const { workflows, isLoading: workflowsLoading, error: workflowsError, refetch: refetchWorkflows } = useAllWorkflows();

  // Get projects with organization names
  const projectsWithOrgNames = projects.map((project) => {
    const org = organizations.find((o) => o.id === project.organization_id);
    return {
      ...project,
      organization_name: org?.name,
    };
  });

  return (
    <Layout>
      <div className="container max-w-7xl py-8">
        {/* Welcome Section with animated background */}
        <div className="relative overflow-hidden rounded-2xl p-8 border bg-gradient-to-br from-primary/5 via-accent/5 to-highlight/5 mb-8">
          {/* Animated background blobs */}
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/20 rounded-full blur-3xl animate-float" />
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-accent/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-highlight/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
          
          <div className="relative z-10">
            <h1 className="text-3xl font-bold mb-2">
              Willkommen{profile?.full_name ? `, ${profile.full_name}` : ''}! 👋
            </h1>
            <p className="text-muted-foreground">
              Verwalten Sie Ihre Cold Calling Projekte und Workflows von hier aus.
            </p>
          </div>
        </div>

        {/* Quick Stats with color coding */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Organisationen - Blue */}
          <div className="group bg-card border rounded-xl p-6 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1 border-l-4 border-l-primary">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Organisationen</p>
                <p className="text-3xl font-bold mt-1 text-gradient">
                  {orgsLoading ? '-' : organizations.length}
                </p>
              </div>
              <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300" aria-hidden="true">
                <Building2 className="h-7 w-7 text-primary" />
              </div>
            </div>
          </div>

          {/* Projekte - Violet/Highlight */}
          <div className="group bg-card border rounded-xl p-6 transition-all duration-300 hover:shadow-lg hover:shadow-highlight/10 hover:-translate-y-1 border-l-4 border-l-highlight">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Projekte</p>
                <p className="text-3xl font-bold mt-1">
                  <span className="bg-gradient-to-r from-highlight to-primary bg-clip-text text-transparent">
                    {projectsLoading ? '-' : projects.filter((p) => !p.archived).length}
                  </span>
                </p>
              </div>
              <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-highlight/20 to-highlight/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300" aria-hidden="true">
                <FolderOpen className="h-7 w-7 text-highlight" />
              </div>
            </div>
          </div>

          {/* Workflows - Orange/Accent */}
          <div className="group bg-card border rounded-xl p-6 transition-all duration-300 hover:shadow-lg hover:shadow-accent/10 hover:-translate-y-1 border-l-4 border-l-accent">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Aktive Workflows</p>
                <p className="text-3xl font-bold mt-1">
                  <span className="bg-gradient-to-r from-accent to-warning bg-clip-text text-transparent">
                    {workflowsLoading
                      ? '-'
                      : workflows.filter((w) => w.status === 'running' || w.status === 'pending')
                          .length}
                  </span>
                </p>
              </div>
              <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-accent/20 to-accent/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300" aria-hidden="true">
                <Zap className="h-7 w-7 text-accent" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Sections */}
        <div className="space-y-8">
          <OrganizationCards
            organizations={organizations}
            isLoading={orgsLoading}
            isError={!!orgsError}
            onCreateNew={() => setCreateOrgDialogOpen(true)}
            onRetry={refetchOrgs}
          />

          <RecentProjects
            projects={projectsWithOrgNames}
            isLoading={projectsLoading}
            isError={!!projectsError}
            onRetry={refetchProjects}
          />

          <ActiveWorkflows
            workflows={workflows}
            isLoading={workflowsLoading}
            isError={!!workflowsError}
            onRetry={refetchWorkflows}
          />
        </div>

        {/* Create Organization Dialog */}
        <CreateOrganizationDialog
          open={createOrgDialogOpen}
          onOpenChange={setCreateOrgDialogOpen}
        />
      </div>
    </Layout>
  );
}
