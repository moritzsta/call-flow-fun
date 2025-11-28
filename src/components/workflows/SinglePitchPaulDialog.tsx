import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AdaptiveDialog } from '@/components/ui/adaptive-dialog';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const paulSchema = z.object({
  vorhaben: z.string().min(10, 'Bitte beschreiben Sie Ihr Vorhaben (mind. 10 Zeichen)').max(1000),
});

type PaulFormData = z.infer<typeof paulSchema>;

interface SinglePitchPaulDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStart: (vorhaben: string) => void;
  isStarting: boolean;
  companiesCount: number;
}

export const SinglePitchPaulDialog = ({
  open,
  onOpenChange,
  onStart,
  isStarting,
  companiesCount,
}: SinglePitchPaulDialogProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PaulFormData>({
    resolver: zodResolver(paulSchema),
    defaultValues: {
      vorhaben: '',
    },
  });

  const onSubmit = (data: PaulFormData) => {
    onStart(data.vorhaben);
    reset();
  };

  return (
    <AdaptiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Pitch Paul starten"
      description="Paul wird für alle analysierten Firmen personalisierte E-Mails erstellen"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Paul wird E-Mails für <strong>{companiesCount} analysierte Firmen</strong> erstellen.
          </AlertDescription>
        </Alert>

        {companiesCount === 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Keine analysierten Firmen vorhanden. Bitte starten Sie zuerst Analyse Anna.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="vorhaben">Ihr Vorhaben *</Label>
          <Textarea
            id="vorhaben"
            placeholder="Beschreiben Sie Ihr Vorhaben, z.B. 'Ich möchte eine neue Dienstleistung anbieten...'"
            className="min-h-[120px]"
            {...register('vorhaben')}
            disabled={isStarting}
          />
          {errors.vorhaben && (
            <p className="text-sm text-destructive">{errors.vorhaben.message}</p>
          )}
        </div>

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
            type="submit" 
            disabled={isStarting || companiesCount === 0}
          >
            {isStarting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Wird gestartet...
              </>
            ) : (
              'Paul starten'
            )}
          </Button>
        </div>
      </form>
    </AdaptiveDialog>
  );
};
