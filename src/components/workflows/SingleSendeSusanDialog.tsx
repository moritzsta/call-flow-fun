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
import { AlertTriangle, Send } from 'lucide-react';

interface SingleSendeSusanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  emailCount: number;
  isLoading: boolean;
}

export function SingleSendeSusanDialog({
  open,
  onOpenChange,
  onConfirm,
  emailCount,
  isLoading,
}: SingleSendeSusanDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Achtung: Massenversand
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p className="text-base font-semibold text-foreground">
                Du bist dabei, alle E-Mails aus diesem Projekt zu versenden!
              </p>
              
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
                <p className="text-sm text-destructive font-medium">
                  ⚠️ Diese Aktion kann nicht rückgängig gemacht werden.
                </p>
              </div>

              <div className="bg-muted rounded-lg p-4">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">{emailCount}</strong> E-Mail{emailCount !== 1 ? 's' : ''} werden versendet
                </p>
              </div>

              <p className="text-sm text-muted-foreground">
                Stelle sicher, dass alle E-Mails korrekt sind, bevor du fortfährst.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>
            Abbrechen
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading || emailCount === 0}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            <Send className="mr-2 h-4 w-4" />
            {isLoading ? 'Wird gestartet...' : `Ja, ${emailCount} E-Mails versenden`}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
