import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useEmails } from '@/hooks/useEmails';
import { SendEmailButton } from '@/components/emails/SendEmailButton';
import { ArrowLeft, Mail, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

const statusMap = {
  draft: { label: 'Entwurf', variant: 'secondary' as const },
  ready_to_send: { label: 'Bereit', variant: 'default' as const },
  sent: { label: 'Versendet', variant: 'outline' as const },
  failed: { label: 'Fehlgeschlagen', variant: 'destructive' as const },
};

export default function ProjectEmails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { emails, isLoading, error } = useEmails(id);

  if (isLoading) {
    return (
      <Layout>
        <div className="container max-w-7xl py-8">
          <Skeleton className="h-10 w-48 mb-6" />
          <Skeleton className="h-12 w-64 mb-8" />
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="container max-w-7xl py-8">
          <Button variant="ghost" onClick={() => navigate(`/projects/${id}`)} className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück zum Projekt
          </Button>
          <Card>
            <CardContent className="py-8">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                <p className="text-lg font-medium">Fehler beim Laden der E-Mails</p>
                <p className="text-sm text-muted-foreground mt-2">
                  {error instanceof Error ? error.message : 'Unbekannter Fehler'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container max-w-7xl py-8">
        <Button variant="ghost" onClick={() => navigate(`/projects/${id}`)} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zurück zum Projekt
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">E-Mails</h1>
          <p className="text-muted-foreground">
            Verwalten Sie die E-Mails für dieses Projekt
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              E-Mail-Liste ({emails.length})
            </CardTitle>
            <CardDescription>
              Übersicht aller generierten E-Mails für dieses Projekt
            </CardDescription>
          </CardHeader>
          <CardContent>
            {emails.length === 0 ? (
              <div className="text-center py-12">
                <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium mb-2">Noch keine E-Mails vorhanden</p>
                <p className="text-sm text-muted-foreground">
                  Starten Sie "Pitch Paul" um E-Mails zu generieren
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Betreff</TableHead>
                    <TableHead>Empfänger</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Erstellt</TableHead>
                    <TableHead>Versendet</TableHead>
                    <TableHead className="text-right">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {emails.map((email) => (
                    <TableRow key={email.id}>
                      <TableCell className="font-medium max-w-xs truncate">
                        {email.subject}
                      </TableCell>
                      <TableCell>{email.recipient_email}</TableCell>
                      <TableCell>
                        <Badge variant={statusMap[email.status].variant}>
                          {statusMap[email.status].label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(email.created_at), 'dd.MM.yyyy HH:mm', { locale: de })}
                      </TableCell>
                      <TableCell>
                        {email.sent_at
                          ? format(new Date(email.sent_at), 'dd.MM.yyyy HH:mm', { locale: de })
                          : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        {email.status === 'draft' || email.status === 'ready_to_send' ? (
                          <SendEmailButton
                            emailId={email.id}
                            projectId={id!}
                            recipientEmail={email.recipient_email}
                          />
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
