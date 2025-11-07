import { useParams, useNavigate } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChatInterface } from '@/components/workflows/ChatInterface';
import { ArrowLeft, Sparkles, Mail } from 'lucide-react';
import { useEmails } from '@/hooks/useEmails';

export default function WorkflowBrandingBritta() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { emails, isLoading } = useEmails(id || '');

  // Filter emails that have been improved
  // @ts-ignore - body_improved will be available after types regenerate
  const improvedEmails = emails.filter((e) => (e as any).body_improved !== null && (e as any).body_improved?.length > 0);

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
              <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg p-6 border border-border">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <Sparkles className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-foreground">Branding Britta</h1>
                    <p className="text-muted-foreground">
                      Verschönere deine E-Mails mit Icons, Formatierung und professionellem Design
                    </p>
                  </div>
                </div>
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Chat Section */}
                <div>
                  <ChatInterface
                    workflowName="branding_britta"
                    projectId={id || ''}
                    title="Chat mit Britta"
                    placeholder="Sag Britta, welche E-Mails verschönert werden sollen..."
                  />
                </div>

                {/* Results Section */}
                <Card>
                  <CardHeader>
                    <CardTitle>Verschönerte E-Mails</CardTitle>
                    <CardDescription>
                      {improvedEmails.length} E-Mails wurden verbessert
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <p className="text-center text-muted-foreground py-8">
                        Lade E-Mails...
                      </p>
                    ) : improvedEmails.length === 0 ? (
                      <div className="text-center text-muted-foreground py-12">
                        <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Noch keine E-Mails verschönert</p>
                        <p className="text-sm mt-2">
                          Starte einen Chat mit Britta, um E-Mails zu verschönern
                        </p>
                      </div>
                    ) : (
                      <div className="max-h-[500px] overflow-y-auto space-y-2">
                        {improvedEmails.map((email) => (
                          <div
                            key={email.id}
                            className="p-3 border rounded-lg hover:bg-accent/5 cursor-pointer transition-colors"
                            onClick={() => navigate(`/emails/${email.id}`)}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="font-medium truncate">{email.subject}</div>
                                <div className="text-sm text-muted-foreground truncate">
                                  An: {email.recipient_email}
                                </div>
                              </div>
                              <Badge variant="secondary" className="shrink-0">
                                <Sparkles className="h-3 w-3 mr-1" />
                                Verbessert
                              </Badge>
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
