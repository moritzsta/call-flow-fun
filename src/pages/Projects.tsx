import { useState, useMemo } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { CreateProjectDialog } from '@/components/projects/CreateProjectDialog';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { ProjectsTable } from '@/components/projects/ProjectsTable';
import { ProjectsToolbar, ViewMode, SortOption } from '@/components/projects/ProjectsToolbar';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [viewMode, setViewMode] = useState<ViewMode>('cards');

  // Auto-select first organization
  if (!selectedOrgId && organizations.length > 0) {
    setSelectedOrgId(organizations[0].id);
  }

  const { projects, isLoading: projectsLoading } = useProjects(selectedOrgId);
  const { members, isLoading: membersLoading } = useOrganizationMembers(selectedOrgId);

  const currentMember = members.find((m) => m.user_id === user?.id);
  const canManage =
    currentMember?.role === 'owner' || currentMember?.role === 'manager';

  // Filter and sort projects
  const filteredProjects = useMemo(() => {
    let result = projects.filter((p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    switch (sortBy) {
      case 'newest':
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case 'name':
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      // 'companies' sorting would need stats data - keeping original order
    }

    return result;
  }, [projects, searchQuery, sortBy]);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />

        <div className="flex flex-col flex-1 overflow-hidden">
          <Header />

          <main className="flex-1 overflow-y-auto p-6 relative">
            {/* Decorative background blobs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-float" />
              <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-highlight/5 rounded-full blur-3xl" />
              <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-accent/5 rounded-full blur-3xl" />
            </div>
            
            <div className="relative max-w-7xl mx-auto space-y-5">
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
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-foreground">
                        Organisation:
                      </label>
                      <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
                        <SelectTrigger className="w-48">
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
                    </div>

                    {canManage && selectedOrgId && (
                      <CreateProjectDialog organizationId={selectedOrgId} />
                    )}
                  </div>

                  {/* Toolbar */}
                  {projects.length > 0 && (
                    <ProjectsToolbar
                      searchQuery={searchQuery}
                      onSearchChange={setSearchQuery}
                      sortBy={sortBy}
                      onSortChange={setSortBy}
                      viewMode={viewMode}
                      onViewModeChange={setViewMode}
                    />
                  )}

                  {/* Projects List */}
                  {projectsLoading || membersLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-32 w-full" />
                      ))}
                    </div>
                  ) : projects.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="relative h-24 w-24 rounded-full bg-gradient-to-br from-highlight/20 via-primary/10 to-accent/20 flex items-center justify-center mb-4">
                        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-highlight/10 to-transparent animate-pulse" />
                        <FolderOpen className="h-12 w-12 text-highlight" />
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
                  ) : filteredProjects.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">
                        Keine Projekte gefunden für "{searchQuery}"
                      </p>
                    </div>
                  ) : viewMode === 'table' ? (
                    <ProjectsTable projects={filteredProjects} canManage={canManage} />
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {filteredProjects.map((project) => (
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
