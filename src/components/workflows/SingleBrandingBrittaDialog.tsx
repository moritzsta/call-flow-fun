import { Button } from '@/components/ui/button';
import { AdaptiveDialog } from '@/components/ui/adaptive-dialog';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SingleBrandingBrittaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStart: () => void;
  isStarting: boolean;
  emailsCount: number;
}

export const SingleBrandingBrittaDialog = ({
  open,
  onOpenChange,
  onStart,
  isStarting,
  emailsCount,
}: SingleBrandingBrittaDialogProps) => {
  return (
    <AdaptiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Branding Britta starten"
      description="Britta wird alle Draft-E-Mails verbessern und optimieren"
    >
      <div className="space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Britta wird <strong>{emailsCount} E-Mails</strong> verbessern.
          </AlertDescription>
        </Alert>

        {emailsCount === 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Keine E-Mails zum Verbessern vorhanden. Bitte starten Sie zuerst Pitch Paul.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-3 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isStarting}
          >
            Abbrechen
          </Button>
          <Button 
            onClick={onStart} 
            disabled={isStarting || emailsCount === 0}
          >
            {isStarting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Wird gestartet...
              </>
            ) : (
              'Britta starten'
            )}
          </Button>
        </div>
      </div>
    </AdaptiveDialog>
  );
};
