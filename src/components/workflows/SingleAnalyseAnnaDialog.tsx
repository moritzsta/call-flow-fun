import { Button } from '@/components/ui/button';
import { AdaptiveDialog } from '@/components/ui/adaptive-dialog';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SingleAnalyseAnnaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStart: () => void;
  isStarting: boolean;
  companiesCount: number;
}

export const SingleAnalyseAnnaDialog = ({
  open,
  onOpenChange,
  onStart,
  isStarting,
  companiesCount,
}: SingleAnalyseAnnaDialogProps) => {
  return (
    <AdaptiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Analyse Anna starten"
      description="Anna wird alle gefundenen Firmen mit Website analysieren"
    >
      <div className="space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Anna wird <strong>{companiesCount} Firmen</strong> mit Website analysieren.
          </AlertDescription>
        </Alert>

        {companiesCount === 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Keine Firmen zum Analysieren vorhanden. Bitte starten Sie zuerst Finder Felix.
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
            disabled={isStarting || companiesCount === 0}
          >
            {isStarting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Wird gestartet...
              </>
            ) : (
              'Anna starten'
            )}
          </Button>
        </div>
      </div>
    </AdaptiveDialog>
  );
};
