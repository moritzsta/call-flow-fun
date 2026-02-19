import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  notifyEmailsSentBatch, 
  notifyCrudError 
} from '@/lib/notifications';
import { Send, Loader2 } from 'lucide-react';
import type { ProjectEmail } from '@/hooks/useEmails';

interface SendEmailsBatchButtonProps {
  emails: ProjectEmail[];
  projectId: string;
  onSuccess: () => void;
}

export const SendEmailsBatchButton = ({
  emails,
  projectId,
  onSuccess,
}: SendEmailsBatchButtonProps) => {
  const { user } = useAuth();
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [progress, setProgress] = useState(0);

  // Filter emails that can be sent (draft or ready_to_send)
  const sendableEmails = emails.filter(
    (e) => e.status === 'draft' || e.status === 'ready_to_send'
  );

  const toggleEmail = (emailId: string) => {
    setSelectedEmails((prev) =>
      prev.includes(emailId) ? prev.filter((id) => id !== emailId) : [...prev, emailId]
    );
  };

  const selectAll = () => {
    setSelectedEmails(sendableEmails.map((e) => e.id));
  };

  const deselectAll = () => {
    setSelectedEmails([]);
  };

  const handleBatchSend = async () => {
    if (!user || selectedEmails.length === 0) return;

    setIsSending(true);
    setProgress(0);
    setShowConfirmDialog(false);

    let successCount = 0;
    let failCount = 0;

    // Send emails sequentially to avoid rate limits
    for (let i = 0; i < selectedEmails.length; i++) {
      const emailId = selectedEmails[i];

      try {
        // Call n8n webhook via Edge Function - use sende_susan_single for each email
        const { error: functionError } = await supabase.functions.invoke(
          'trigger-n8n-workflow',
          {
            body: {
              workflow_name: 'sende_susan_single',
              workflow_id: crypto.randomUUID(),
              project_id: projectId,
              user_id: user.id,
              trigger_data: {
                email_id: emailId,
              },
            },
          }
        );

        if (functionError) {
          console.error(`Failed to send email ${emailId}:`, functionError);
          failCount++;
        } else {
          successCount++;
        }
      } catch (error) {
        console.error(`Error sending email ${emailId}:`, error);
        failCount++;
      }

      // Update progress
      setProgress(((i + 1) / selectedEmails.length) * 100);
    }

    setIsSending(false);
    setProgress(0);
    setSelectedEmails([]);

    // Show summary toast
    if (successCount > 0) {
      notifyEmailsSentBatch(successCount, selectedEmails.length);
    } else {
      notifyCrudError('Versenden der E-Mails', 'Alle E-Mails sind fehlgeschlagen');
    }

    onSuccess();
  };

  return (
    <div className="space-y-4">
      {/* Selection Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {selectedEmails.length} von {sendableEmails.length} ausgewählt
          </span>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={selectAll}
            disabled={sendableEmails.length === 0 || isSending}
          >
            Alle auswählen
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={deselectAll}
            disabled={selectedEmails.length === 0 || isSending}
          >
            Keine auswählen
          </Button>
          <Button
            onClick={() => setShowConfirmDialog(true)}
            disabled={selectedEmails.length === 0 || isSending}
            size="sm"
          >
            {isSending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Wird versendet...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Ausgewählte versenden ({selectedEmails.length})
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Email Selection List */}
      {sendableEmails.length > 0 && (
        <div className="border rounded-lg p-4 space-y-2 max-h-60 overflow-y-auto">
          {sendableEmails.map((email) => (
            <div
              key={email.id}
              className="flex items-start space-x-3 p-2 rounded hover:bg-accent/5 transition-colors"
            >
              <Checkbox
                id={email.id}
                checked={selectedEmails.includes(email.id)}
                onCheckedChange={() => toggleEmail(email.id)}
                disabled={isSending}
              />
              <label
                htmlFor={email.id}
                className="text-sm cursor-pointer flex-1 min-w-0"
              >
                <div className="font-medium truncate">{email.subject}</div>
                <div className="text-muted-foreground text-xs">{email.recipient_email}</div>
              </label>
            </div>
          ))}
        </div>
      )}

      {/* Progress Bar */}
      {isSending && (
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-muted-foreground text-center">
            Versende E-Mails... {Math.round(progress)}%
          </p>
        </div>
      )}

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Batch-Versand bestätigen</AlertDialogTitle>
            <AlertDialogDescription>
              Sie sind dabei, <strong>{selectedEmails.length} E-Mail(s)</strong> zu versenden.
              Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleBatchSend}>
              Jetzt versenden
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};