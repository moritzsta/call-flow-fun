import { useParams, useNavigate } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChatInterface } from '@/components/workflows/ChatInterface';

import { ArrowLeft, BarChart3 } from 'lucide-react';
import { useCompanies } from '@/hooks/useCompanies';

export default function WorkflowAnalyseAnna() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { companies, isLoading } = useCompanies(id || '');

  const analyzedCompanies = companies.filter((c) => c.analysis !== null);

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
              <div className="bg-gradient-to-r from-accent/10 to-primary/10 rounded-lg p-6 border border-border">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center">
                    <BarChart3 className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-foreground">Analyse Anna</h1>
                    <p className="text-muted-foreground">
                      Chatte mit Anna, um Firmen analysieren zu lassen
                    </p>
                  </div>
                </div>
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Chat Section */}
                <div>
                  <ChatInterface
                    workflowName="analyse_anna"
                    projectId={id || ''}
                    title="Chat mit Anna"
                    placeholder="Sag Anna, welche Firmen analysiert werden sollen..."
                  />
                </div>

                {/* Results Section */}
                <Card>
                  <CardHeader>
                    <CardTitle>Analysierte Firmen</CardTitle>
                    <CardDescription>
                      {analyzedCompanies.length} Firmen analysiert
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <p className="text-center text-muted-foreground py-8">
                        Lade Firmen...
                      </p>
                    ) : analyzedCompanies.length === 0 ? (
                      <div className="text-center text-muted-foreground py-12">
                        <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Noch keine Analysen vorhanden</p>
                        <p className="text-sm mt-2">
                          Starte einen Chat mit Anna, um Firmen zu analysieren
                        </p>
                      </div>
                    ) : (
                      <div className="max-h-[500px] overflow-y-auto space-y-2">
                        {analyzedCompanies.map((company) => (
                          <div
                            key={company.id}
                            className="p-3 border rounded-lg hover:bg-accent/5 cursor-pointer"
                            onClick={() => navigate(`/companies/${company.id}`)}
                          >
                            <div className="font-medium">{company.company}</div>
                            <div className="text-sm text-muted-foreground">
                              {company.industry} • {company.city}
                            </div>
                            {company.analysis && (
                              <div className="text-xs text-green-600 mt-1">✓ Analysiert</div>
                            )}
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
