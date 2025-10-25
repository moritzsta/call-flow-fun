import { useParams, useNavigate } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { InviteMemberDialog } from '@/components/organizations/InviteMemberDialog';
import { MemberList } from '@/components/organizations/MemberList';
import { useOrganizations } from '@/hooks/useOrganizations';
import { useOrganizationMembers } from '@/hooks/useOrganizationMembers';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';

export default function OrganizationSettings() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { organizations, isLoading: orgsLoading, updateOrganization } = useOrganizations();
  const { members, isLoading: membersLoading } = useOrganizationMembers(id);

  const organization = organizations.find((org) => org.id === id);
  const isOwner = organization?.owner_id === user?.id;

  const [name, setName] = useState(organization?.name || '');
  const [description, setDescription] = useState(organization?.description || '');

  const handleUpdateGeneral = () => {
    if (!id) return;
    updateOrganization({
      id,
      name,
      description,
    });
  };

  if (orgsLoading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <AppSidebar />
          <div className="flex flex-col flex-1 overflow-hidden">
            <Header />
            <main className="flex-1 overflow-y-auto p-6">
              <Skeleton className="h-12 w-64 mb-6" />
              <Skeleton className="h-96 w-full" />
            </main>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  if (!organization) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <AppSidebar />
          <div className="flex flex-col flex-1 overflow-hidden">
            <Header />
            <main className="flex-1 overflow-y-auto p-6">
              <div className="max-w-4xl mx-auto text-center py-16">
                <h1 className="text-2xl font-bold text-foreground mb-4">
                  Organisation nicht gefunden
                </h1>
                <Button onClick={() => navigate('/organizations')}>
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
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Back Button */}
              <Button
                variant="ghost"
                onClick={() => navigate('/organizations')}
                className="mb-4"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Zurück
              </Button>

              {/* Page Header */}
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  {organization.name}
                </h1>
                <p className="text-muted-foreground mt-1">
                  Organisationseinstellungen verwalten
                </p>
              </div>

              {/* Tabs */}
              <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="general">Allgemein</TabsTrigger>
                  <TabsTrigger value="members">Mitglieder</TabsTrigger>
                </TabsList>

                {/* General Tab */}
                <TabsContent value="general" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Organisationsdetails</CardTitle>
                      <CardDescription>
                        Ändern Sie Name und Beschreibung Ihrer Organisation
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Name *</Label>
                        <Input
                          id="name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          disabled={!isOwner}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description">Beschreibung</Label>
                        <Textarea
                          id="description"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          rows={3}
                          disabled={!isOwner}
                        />
                      </div>

                      {isOwner && (
                        <Button onClick={handleUpdateGeneral}>
                          Änderungen speichern
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Members Tab */}
                <TabsContent value="members" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Mitglieder</CardTitle>
                          <CardDescription>
                            Verwalten Sie Mitglieder und deren Rollen
                          </CardDescription>
                        </div>
                        {isOwner && <InviteMemberDialog organizationId={id!} />}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {membersLoading ? (
                        <div className="space-y-4">
                          {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-20 w-full" />
                          ))}
                        </div>
                      ) : (
                        <MemberList organizationId={id!} isOwner={isOwner} />
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
