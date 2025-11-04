import { useParams, useNavigate } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChatInterface } from '@/components/workflows/ChatInterface';

import { ArrowLeft, Search } from 'lucide-react';
import { useCompanies } from '@/hooks/useCompanies';

export default function WorkflowFinderFelix() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { companies, isLoading } = useCompanies(id || '');

  // Deduplicate companies by ID and filter by status
  const foundCompanies = Array.from(
    new Map(
      companies
        .filter((c) => c.status === 'found')
        .map((company) => [company.id, company])
    ).values()
  );

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
                onClick={() => navigate(`/projects/${id}`)}
                className="mb-4"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Zurück zum Projekt
              </Button>

              {/* Page Header */}
              <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg p-6 border border-border">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Search className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-foreground">Finder Felix</h1>
                    <p className="text-muted-foreground">
                      Chatte mit Felix, um passende Firmen zu finden
                    </p>
                  </div>
                </div>
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Chat Section */}
                <div>
                  <ChatInterface
                    workflowName="finder_felix"
                    projectId={id || ''}
                    title="Chat mit Felix"
                    placeholder="Sag Felix, welche Firmen du suchst..."
                  />
                </div>

                {/* Results Section */}
                <Card>
                  <CardHeader>
                    <CardTitle>Gefundene Firmen</CardTitle>
                    <CardDescription>
                      {foundCompanies.length} Firmen gefunden
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <p className="text-center text-muted-foreground py-8">
                        Lade Firmen...
                      </p>
                    ) : foundCompanies.length === 0 ? (
                      <div className="text-center text-muted-foreground py-12">
                        <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Noch keine Firmen gefunden</p>
                        <p className="text-sm mt-2">
                          Starte einen Chat mit Felix, um Firmen zu finden
                        </p>
                      </div>
                    ) : (
                      <div className="max-h-[500px] overflow-y-auto space-y-2">
                        {foundCompanies.map((company) => (
                          <div
                            key={company.id}
                            className="p-3 border rounded-lg hover:bg-accent/5 cursor-pointer"
                            onClick={() => navigate(`/companies/${company.id}`)}
                          >
                            <div className="font-medium">{company.company}</div>
                            <div className="text-sm text-muted-foreground">
                              {company.industry} • {company.city}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
