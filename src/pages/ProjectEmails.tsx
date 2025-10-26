import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Mail, RefreshCw } from 'lucide-react';
import { useEmails, EmailFilters as Filters, EmailSortConfig } from '@/hooks/useEmails';
import { EmailFilters } from '@/components/emails/EmailFilters';
import { EmailsTable } from '@/components/emails/EmailsTable';

export default function ProjectEmails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

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
  } = useEmails(id, filters, sortConfig);

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
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">E-Mails</h1>
                  <p className="text-muted-foreground">
                    {emails.length} {emails.length === 1 ? 'E-Mail' : 'E-Mails'} gefunden
                  </p>
                </div>
              </div>
            </div>
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Aktualisieren
            </Button>
          </div>
        </div>

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
              onSend={(emailId, userId) => sendEmail({ emailId, userId })}
              sortConfig={sortConfig}
              onSortChange={setSortConfig}
            />
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
