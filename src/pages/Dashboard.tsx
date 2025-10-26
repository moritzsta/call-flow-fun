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
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 rounded-lg p-8 border mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Willkommen{profile?.full_name ? `, ${profile.full_name}` : ''}!
          </h1>
          <p className="text-muted-foreground">
            Verwalten Sie Ihre Cold Calling Projekte und Workflows von hier aus.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Organisationen</p>
                <p className="text-2xl font-bold mt-1">
                  {orgsLoading ? '-' : organizations.length}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center" aria-hidden="true">
                <span className="text-2xl">🏢</span>
              </div>
            </div>
          </div>

          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Projekte</p>
                <p className="text-2xl font-bold mt-1">
                  {projectsLoading ? '-' : projects.filter((p) => !p.archived).length}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center" aria-hidden="true">
                <span className="text-2xl">📁</span>
              </div>
            </div>
          </div>

          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Workflows</p>
                <p className="text-2xl font-bold mt-1">
                  {workflowsLoading
                    ? '-'
                    : workflows.filter((w) => w.status === 'running' || w.status === 'pending')
                        .length}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-secondary/50 flex items-center justify-center" aria-hidden="true">
                <span className="text-2xl">⚡</span>
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
