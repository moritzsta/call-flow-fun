import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Mail, RefreshCw, Send } from 'lucide-react';
import { useEmails, EmailFilters as Filters, EmailSortConfig } from '@/hooks/useEmails';
import { EmailFilters } from '@/components/emails/EmailFilters';
import { EmailsTable } from '@/components/emails/EmailsTable';
import { EmailStats } from '@/components/emails/EmailStats';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';

export default function ProjectEmails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMobile = useIsMobile();

  const [filters, setFilters] = useState<Filters>({});
  const [sortConfig, setSortConfig] = useState<EmailSortConfig>({
    field: 'created_at',
    ascending: false,
  });

  const {
    emails,
    isLoading,
    refetch,
    deleteEmail,
    sendEmail,
    sendAllEmails,
    isSendingAll,
  } = useEmails(id, filters, sortConfig);

  const readyToSendCount = emails.filter(
    e => e.status === 'draft' || e.status === 'ready_to_send'
  ).length;

  if (isLoading) {
    return (
      <Layout>
        <div className="container max-w-7xl py-8">
          <Skeleton className="h-10 w-32 mb-6" />
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container max-w-7xl py-8">
        <Button
          variant="ghost"
          onClick={() => navigate(`/projects/${id}`)}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zurück zum Projekt
        </Button>

        <div className="mb-8">
          <div className={`flex items-start ${isMobile ? 'flex-col gap-4' : 'justify-between'}`}>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className={`font-bold ${isMobile ? 'text-2xl' : 'text-3xl'}`}>E-Mails</h1>
                  <p className="text-muted-foreground text-sm">
                    {emails.length} {emails.length === 1 ? 'E-Mail' : 'E-Mails'} gesamt
                  </p>
                </div>
              </div>
            </div>
            <div className={`flex gap-2 ${isMobile ? 'w-full flex-col' : ''}`}>
              <Button variant="outline" onClick={() => refetch()} className={isMobile ? 'w-full' : ''}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Aktualisieren
              </Button>
              
              <Button
                variant="default"
                onClick={() => sendAllEmails({ projectId: id!, userId: user?.id! })}
                disabled={isSendingAll || readyToSendCount === 0}
                className={isMobile ? 'w-full' : ''}
              >
                <Send className="mr-2 h-4 w-4" />
                {isSendingAll ? 'Versende...' : `Alle versenden (${readyToSendCount})`}
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <EmailStats emails={emails} isLoading={isLoading} />

        <Card>
          <CardHeader>
            <CardTitle>E-Mail-Liste</CardTitle>
            <CardDescription>
              Filtern, sortieren und verwalten Sie die E-Mails dieses Projekts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <EmailFilters filters={filters} onFiltersChange={setFilters} />
            <EmailsTable
              emails={emails}
              projectId={id!}
              onDelete={deleteEmail}
              onSend={(emailId) => sendEmail({ emailId, projectId: id!, userId: user?.id! })}
              sortConfig={sortConfig}
              onSortChange={setSortConfig}
            />
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
