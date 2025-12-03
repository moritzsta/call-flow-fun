import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Mail, RefreshCw, Send, Trash2, Loader2, TestTube } from 'lucide-react';
import { useEmails, EmailFilters as Filters, EmailSortConfig } from '@/hooks/useEmails';
import { EmailFilters } from '@/components/emails/EmailFilters';
import { EmailsTable } from '@/components/emails/EmailsTable';
import { EmailStats } from '@/components/emails/EmailStats';
import { ExportEmailsButton } from '@/components/emails/ExportEmailsButton';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { notifyEmailSent, notifyEmailSendError } from '@/lib/notifications';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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
  const [isRemovingDuplicates, setIsRemovingDuplicates] = useState(false);
  const [testEmailDialogOpen, setTestEmailDialogOpen] = useState(false);
  const [testEmail, setTestEmail] = useState('');

  const {
    emails,
    isLoading,
    refetch,
    deleteEmail,
    sendEmail,
    sendAllEmails,
    isSendingAll,
    updateAllRecipients,
    isUpdatingRecipients,
  } = useEmails(id, filters, sortConfig);

  const readyToSendCount = emails.filter(
    e => e.status === 'draft' || e.status === 'ready_to_send'
  ).length;

  // Realtime subscription for email status changes
  useEffect(() => {
    if (!id) return;

    const channel = supabase
      .channel('email-status-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'project_emails',
          filter: `project_id=eq.${id}`
        },
        (payload) => {
          const newStatus = payload.new?.status;
          if (newStatus === 'sent') {
            notifyEmailSent();
          } else if (newStatus === 'failed') {
            notifyEmailSendError('E-Mail konnte nicht versendet werden');
          }
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, refetch]);

  const handleRemoveDuplicates = async () => {
    if (!id) return;
    
    setIsRemovingDuplicates(true);
    try {
      const { data, error } = await supabase.functions.invoke('remove-duplicate-emails', {
        body: { project_id: id }
      });

      if (error) {
        throw error;
      }

      if (data.success) {
        const deletedCount = data.deleted_count;
        if (deletedCount > 0) {
          toast.success(`${deletedCount} Duplikate entfernt`);
          refetch();
        } else {
          toast.info('Keine Duplikate gefunden');
        }
      } else {
        throw new Error(data.error || 'Unbekannter Fehler');
      }
    } catch (error) {
      console.error('Error removing duplicates:', error);
      toast.error('Fehler beim Entfernen der Duplikate');
    } finally {
      setIsRemovingDuplicates(false);
    }
  };

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
            <div className={`flex gap-2 ${isMobile ? 'w-full flex-col' : 'flex-wrap'}`}>
              <ExportEmailsButton projectId={id!} />
              
              <Button 
                variant="outline" 
                onClick={() => setTestEmailDialogOpen(true)}
                className={isMobile ? 'w-full' : ''}
              >
                <TestTube className="mr-2 h-4 w-4" />
                Test-E-Mail setzen
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    disabled={isRemovingDuplicates}
                    className={isMobile ? 'w-full' : ''}
                  >
                    {isRemovingDuplicates ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="mr-2 h-4 w-4" />
                    )}
                    Duplikate entfernen
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Duplikate entfernen?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Diese Aktion entfernt alle E-Mails mit derselben Empfänger-Adresse. 
                      Die jeweils älteste E-Mail wird behalten.
                      <br /><br />
                      <strong>Diese Aktion kann nicht rückgängig gemacht werden.</strong>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                    <AlertDialogAction onClick={handleRemoveDuplicates}>
                      Duplikate löschen
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

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

        {/* Test-E-Mail Dialog */}
        <Dialog open={testEmailDialogOpen} onOpenChange={setTestEmailDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Test-E-Mail-Adresse setzen</DialogTitle>
              <DialogDescription>
                Alle Empfänger-E-Mail-Adressen in diesem Projekt werden auf die 
                angegebene Test-Adresse geändert. Dies ist nützlich zum Testen 
                des E-Mail-Versands.
                <br /><br />
                <strong className="text-destructive">
                  ⚠️ Achtung: Diese Aktion überschreibt alle {emails.length} 
                  Empfänger-Adressen unwiderruflich!
                </strong>
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="test-email">Neue E-Mail-Adresse</Label>
              <Input
                id="test-email"
                type="email"
                placeholder="test@example.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="mt-2"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setTestEmailDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button 
                variant="destructive"
                onClick={() => {
                  updateAllRecipients({ projectId: id!, newEmail: testEmail });
                  setTestEmailDialogOpen(false);
                  setTestEmail('');
                }}
                disabled={!testEmail || !testEmail.includes('@') || isUpdatingRecipients}
              >
                {isUpdatingRecipients ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Alle Adressen ändern
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
