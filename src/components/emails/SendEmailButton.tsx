import { useState } from 'react';
import { Button } from '@/components/ui/button';
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
import { useEmails } from '@/hooks/useEmails';
import { useAuth } from '@/contexts/AuthContext';
import { Send, Loader2 } from 'lucide-react';

interface SendEmailButtonProps {
  emailId: string;
  projectId: string;
  recipientEmail: string;
  disabled?: boolean;
}

export const SendEmailButton = ({
  emailId,
  projectId,
  recipientEmail,
  disabled = false,
}: SendEmailButtonProps) => {
  const { user } = useAuth();
  const { sendEmail, isSending } = useEmails(projectId);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const handleSend = () => {
    if (!user) return;
    sendEmail({ emailId, projectId, userId: user.id });
    setShowConfirmDialog(false);
  };

  return (
    <>
      <Button
        onClick={() => setShowConfirmDialog(true)}
        disabled={disabled || isSending}
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
            Versenden
          </>
        )}
      </Button>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>E-Mail versenden?</AlertDialogTitle>
            <AlertDialogDescription>
              Die E-Mail wird an <strong>{recipientEmail}</strong> versendet. Diese Aktion kann
              nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleSend}>Jetzt versenden</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
