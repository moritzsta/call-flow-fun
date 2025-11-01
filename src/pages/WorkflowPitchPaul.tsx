import { useParams, useNavigate } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChatInterface } from '@/components/workflows/ChatInterface';

import { ArrowLeft, Mail } from 'lucide-react';
import { useEmails } from '@/hooks/useEmails';

export default function WorkflowPitchPaul() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { emails, isLoading } = useEmails(id || '');

  const draftEmails = emails.filter((e) => e.status === 'draft');

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
              <div className="bg-gradient-to-r from-primary/10 to-secondary/30 rounded-lg p-6 border border-border">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-secondary/50 flex items-center justify-center">
                    <Mail className="h-6 w-6 text-foreground" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-foreground">Pitch Paul</h1>
                    <p className="text-muted-foreground">
                      Chatte mit Paul, um personalisierte E-Mails zu generieren
                    </p>
                  </div>
                </div>
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Chat Section */}
                <div>
                  <ChatInterface
                    workflowName="pitch_paul"
                    projectId={id || ''}
                    title="Chat mit Paul"
                    placeholder="Sag Paul, welche E-Mails generiert werden sollen..."
                  />
                </div>

                {/* Results Section */}
                <Card>
                  <CardHeader>
                    <CardTitle>Generierte E-Mails</CardTitle>
                    <CardDescription>
                      {draftEmails.length} E-Mails bereit zum Versand
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <p className="text-center text-muted-foreground py-8">
                        Lade E-Mails...
                      </p>
                    ) : draftEmails.length === 0 ? (
                      <div className="text-center text-muted-foreground py-12">
                        <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Noch keine E-Mails generiert</p>
                        <p className="text-sm mt-2">
                          Starte einen Chat mit Paul, um E-Mails zu erstellen
                        </p>
                      </div>
                    ) : (
                      <div className="max-h-[500px] overflow-y-auto space-y-2">
                        {draftEmails.map((email) => (
                          <div
                            key={email.id}
                            className="p-3 border rounded-lg hover:bg-accent/5 cursor-pointer"
                            onClick={() => navigate(`/emails/${email.id}`)}
                          >
                            <div className="font-medium">{email.subject}</div>
                            <div className="text-sm text-muted-foreground">
                              An: {email.recipient_email}
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
