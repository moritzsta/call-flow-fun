import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { DangerZone } from '@/components/projects/DangerZone';
import { useProjects } from '@/hooks/useProjects';
import { useOrganizations } from '@/hooks/useOrganizations';
import { useOrganizationMembers } from '@/hooks/useOrganizationMembers';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const projectSchema = z.object({
  title: z.string().min(3, 'Titel muss mindestens 3 Zeichen lang sein'),
  description: z.string().optional(),
});

type ProjectFormData = z.infer<typeof projectSchema>;

export default function ProjectSettings() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');

  const { organizations } = useOrganizations();
  const { projects, updateProject, archiveProject, deleteProject, isUpdating, isArchiving, isDeleting } = useProjects(selectedOrgId);
  const { members } = useOrganizationMembers(selectedOrgId);

  const project = projects.find((p) => p.id === id);

  useEffect(() => {
    if (project) {
      setSelectedOrgId(project.organization_id);
    }
  }, [project]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
  });

  useEffect(() => {
    if (project) {
      reset({
        title: project.title,
        description: project.description || '',
      });
    }
  }, [project, reset]);

  // Check if current user is Owner or Manager
  const currentMember = members.find((m) => m.user_id === user?.id);
  const canManage = currentMember?.role === 'owner' || currentMember?.role === 'manager';

  const onSubmit = (data: ProjectFormData) => {
    if (!id) return;
    updateProject({
      id,
      title: data.title,
      description: data.description || null,
    });
  };

  if (!id) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <AppSidebar />
          <div className="flex flex-col flex-1 overflow-hidden">
            <Header />
            <main className="flex-1 overflow-y-auto p-8">
              <p className="text-muted-foreground">Projekt-ID fehlt</p>
            </main>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  if (!project && projects.length > 0) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <AppSidebar />
          <div className="flex flex-col flex-1 overflow-hidden">
            <Header />
            <main className="flex-1 overflow-y-auto p-8">
              <p className="text-muted-foreground">Projekt nicht gefunden</p>
            </main>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  const organization = organizations.find((org) => org.id === selectedOrgId);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto">
          <div className="container max-w-4xl py-8">
            {/* Back Button */}
            <Button
              variant="ghost"
              onClick={() => navigate(`/projects/${id}`)}
              className="mb-6"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Zurück zum Projekt
            </Button>

            {/* Project Header */}
            {project ? (
              <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">{project.title}</h1>
                <p className="text-muted-foreground">
                  Organisation: {organization?.name || 'Unbekannt'}
                </p>
              </div>
            ) : (
              <div className="mb-8 space-y-2">
                <Skeleton className="h-10 w-2/3" />
                <Skeleton className="h-5 w-1/3" />
              </div>
            )}

            {/* Tabs */}
            <Tabs defaultValue="general">
              <TabsList>
                <TabsTrigger value="general">Allgemein</TabsTrigger>
                {canManage && <TabsTrigger value="danger">Gefahrenbereich</TabsTrigger>}
              </TabsList>

              {/* General Tab */}
              <TabsContent value="general" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Projekt-Informationen</CardTitle>
                    <CardDescription>
                      Bearbeiten Sie Titel und Beschreibung Ihres Projekts
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {project ? (
                      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="title">Titel*</Label>
                          <Input
                            id="title"
                            {...register('title')}
                            placeholder="z.B. Solar-Kampagne Q1 2025"
                            disabled={!canManage}
                          />
                          {errors.title && (
                            <p className="text-sm text-destructive">{errors.title.message}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="description">Beschreibung</Label>
                          <Textarea
                            id="description"
                            {...register('description')}
                            placeholder="Beschreiben Sie Ihr Projekt..."
                            rows={4}
                            disabled={!canManage}
                          />
                          {errors.description && (
                            <p className="text-sm text-destructive">{errors.description.message}</p>
                          )}
                        </div>

                        {canManage && (
                          <Button type="submit" disabled={isUpdating}>
                            {isUpdating ? 'Speichere...' : 'Änderungen speichern'}
                          </Button>
                        )}

                        {!canManage && (
                          <p className="text-sm text-muted-foreground">
                            Nur Owner und Manager können das Projekt bearbeiten.
                          </p>
                        )}
                      </form>
                    ) : (
                      <div className="space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-24 w-full" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Danger Zone Tab */}
              {canManage && (
                <TabsContent value="danger">
                  {project ? (
                    <DangerZone
                      projectId={id}
                      projectTitle={project.title}
                      organizationId={project.organization_id}
                      onArchive={() => archiveProject(id)}
                      onDelete={deleteProject}
                      isArchiving={isArchiving}
                      isDeleting={isDeleting}
                    />
                  ) : (
                    <Skeleton className="h-64 w-full" />
                  )}
                </TabsContent>
              )}
            </Tabs>
          </div>
        </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
