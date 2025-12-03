import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Mail, Sparkles } from 'lucide-react';
import { useEmail } from '@/hooks/useEmail';
import { useEmails, ProjectEmail } from '@/hooks/useEmails';
import { EmailPreview } from '@/components/emails/EmailPreview';
import { EmailEditor } from '@/components/emails/EmailEditor';
import { useAuth } from '@/contexts/AuthContext';
import { notifyError } from '@/lib/notifications';

const statusMap: Record<ProjectEmail['status'], { label: string; className: string }> = {
  draft: { label: 'Entwurf', className: 'bg-gray-500/10 text-gray-700 dark:text-gray-400' },
  ready_to_send: { label: 'Bereit', className: 'bg-blue-500/10 text-blue-700 dark:text-blue-400' },
  sending: { label: 'Wird versendet...', className: 'bg-orange-500/10 text-orange-700 dark:text-orange-400' },
  sent: { label: 'Versendet', className: 'bg-green-500/10 text-green-700 dark:text-green-400' },
  failed: { label: 'Fehlgeschlagen', className: 'bg-red-500/10 text-red-700 dark:text-red-400' },
};

export default function EmailDetail() {
  const { emailId } = useParams<{ emailId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { email, isLoading, updateEmail, updateStatus, isUpdating } = useEmail(emailId);
  const { sendEmail } = useEmails();

  const handleStatusChange = (newStatus: ProjectEmail['status']) => {
    if (email) {
      updateStatus(newStatus);
    }
  };

  const handleSend = (userId: string) => {
    if (!email || !emailId) {
      notifyError('Fehler: E-Mail nicht gefunden');
      return;
    }

    sendEmail({ emailId, projectId: email.project_id, userId });
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

  if (!email) {
    return (
      <Layout>
        <div className="container max-w-7xl py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">E-Mail nicht gefunden</h1>
            <Button onClick={() => navigate(-1)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Zurück
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container max-w-7xl py-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zurück
        </Button>

        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">{email.subject}</h1>
                  <p className="text-muted-foreground">
                    An: {email.recipient_email}
                    {email.company_name && ` (${email.company_name})`}
                  </p>
                  {email.body_improved && (
                    <Badge variant="secondary" className="mt-2 bg-purple-500/10 text-purple-700 dark:text-purple-400">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Von Britta verschönert
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Status:</span>
                <Select
                  value={email.status}
                  onValueChange={(value) =>
                    handleStatusChange(value as ProjectEmail['status'])
                  }
                  disabled={email.status === 'sent'}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Entwurf</SelectItem>
                    <SelectItem value="ready_to_send">Bereit</SelectItem>
                    <SelectItem value="sent" disabled>
                      Versendet
                    </SelectItem>
                    <SelectItem value="failed" disabled>
                      Fehlgeschlagen
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Badge variant="secondary" className={statusMap[email.status].className}>
                {statusMap[email.status].label}
              </Badge>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            Erstellt: {new Date(email.created_at).toLocaleString('de-DE')}
            {email.sent_at && ` · Versendet: ${new Date(email.sent_at).toLocaleString('de-DE')}`}
          </div>
        </div>

        <Tabs defaultValue={email.body_improved ? "verbessert" : "original"} className="w-full">
          <TabsList>
            {email.body_improved && (
              <TabsTrigger value="verbessert">
                <Sparkles className="h-4 w-4 mr-2" />
                Verbessert
              </TabsTrigger>
            )}
            <TabsTrigger value="original">Original</TabsTrigger>
            <TabsTrigger value="edit" disabled={email.status === 'sent'}>
              Bearbeiten
            </TabsTrigger>
          </TabsList>

          {email.body_improved && (
            <TabsContent value="verbessert" className="mt-6">
              <EmailPreview
                subject={email.subject}
                body={email.body_improved}
                recipientEmail={email.recipient_email}
              />
            </TabsContent>
          )}

          <TabsContent value="original" className="mt-6">
            <EmailPreview
              subject={email.subject}
              body={email.body}
              recipientEmail={email.recipient_email}
            />
          </TabsContent>

          <TabsContent value="edit" className="mt-6">
            <EmailEditor
              email={email}
              onSave={updateEmail}
              onSend={handleSend}
              isUpdating={isUpdating}
              userId={user?.id || ''}
            />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
