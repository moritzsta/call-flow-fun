import { useState } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { CreateProjectDialog } from '@/components/projects/CreateProjectDialog';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { useProjects } from '@/hooks/useProjects';
import { useOrganizations } from '@/hooks/useOrganizations';
import { useOrganizationMembers } from '@/hooks/useOrganizationMembers';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FolderOpen } from 'lucide-react';

export default function Projects() {
  const { user } = useAuth();
  const { organizations, isLoading: orgsLoading } = useOrganizations();
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');

  // Auto-select first organization
  if (!selectedOrgId && organizations.length > 0) {
    setSelectedOrgId(organizations[0].id);
  }

  const { projects, isLoading: projectsLoading } = useProjects(selectedOrgId);
  const { members, isLoading: membersLoading } = useOrganizationMembers(selectedOrgId);

  const currentMember = members.find((m) => m.user_id === user?.id);
  const canManage =
    currentMember?.role === 'owner' || currentMember?.role === 'manager';

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />

        <div className="flex flex-col flex-1 overflow-hidden">
          <Header />

          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Page Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-foreground">Projekte</h1>
                  <p className="text-muted-foreground mt-1">
                    Verwalten Sie Ihre Cold Calling Projekte
                  </p>
                </div>
              </div>

              {/* Organization Selector */}
              {orgsLoading ? (
                <Skeleton className="h-10 w-64" />
              ) : organizations.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-muted-foreground mb-4">
                    Erstellen Sie zuerst eine Organisation.
                  </p>
                  <a
                    href="/organizations"
                    className="text-primary hover:underline font-medium"
                  >
                    Zur Organisations-Übersicht
                  </a>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-4">
                    <label className="text-sm font-medium text-foreground">
                      Organisation:
                    </label>
                    <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
                      <SelectTrigger className="w-64">
                        <SelectValue placeholder="Organisation auswählen" />
                      </SelectTrigger>
                      <SelectContent>
                        {organizations.map((org) => (
                          <SelectItem key={org.id} value={org.id}>
                            {org.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {canManage && selectedOrgId && (
                      <CreateProjectDialog organizationId={selectedOrgId} />
                    )}
                  </div>

                  {/* Projects Grid */}
                  {projectsLoading || membersLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-64 w-full" />
                      ))}
                    </div>
                  ) : projects.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center mb-4">
                        <FolderOpen className="h-12 w-12 text-muted-foreground" />
                      </div>
                      <h2 className="text-xl font-semibold text-foreground mb-2">
                        Noch keine Projekte
                      </h2>
                      <p className="text-muted-foreground mb-6 max-w-md">
                        {canManage
                          ? 'Erstellen Sie Ihr erstes Projekt, um mit dem Cold Calling zu beginnen.'
                          : 'Es wurden noch keine Projekte in dieser Organisation erstellt.'}
                      </p>
                      {canManage && selectedOrgId && (
                        <CreateProjectDialog organizationId={selectedOrgId} />
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {projects.map((project) => (
                        <ProjectCard
                          key={project.id}
                          project={project}
                          canManage={canManage}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
