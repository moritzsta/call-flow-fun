import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useWorkflowTrigger } from '@/hooks/useWorkflowTrigger';
import { useCompanies } from '@/hooks/useCompanies';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

const pitchPaulSchema = z.object({
  userInput: z.string().min(10, 'Mindestens 10 Zeichen').max(500, 'Maximal 500 Zeichen'),
  companyIds: z.array(z.string()).min(1, 'Mindestens eine Firma auswählen'),
});

type PitchPaulFormData = z.infer<typeof pitchPaulSchema>;

interface PitchPaulDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

export const PitchPaulDialog = ({ open, onOpenChange, projectId }: PitchPaulDialogProps) => {
  const { user } = useAuth();
  const { companies, isLoading: loadingCompanies } = useCompanies(projectId);
  const { triggerWorkflow, isTriggering } = useWorkflowTrigger();
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PitchPaulFormData>({
    resolver: zodResolver(pitchPaulSchema),
    defaultValues: {
      userInput: '',
      companyIds: [],
    },
  });

  const onSubmit = (data: PitchPaulFormData) => {
    if (!user) return;

    triggerWorkflow({
      workflowName: 'pitch_paul',
      projectId,
      userId: user.id,
      triggerData: {
        user_input: data.userInput,
        company_ids: selectedCompanyIds,
      },
    });

    reset();
    setSelectedCompanyIds([]);
    onOpenChange(false);
  };

  const toggleCompany = (companyId: string) => {
    setSelectedCompanyIds((prev) =>
      prev.includes(companyId) ? prev.filter((id) => id !== companyId) : [...prev, companyId]
    );
  };

  const selectAll = () => {
    setSelectedCompanyIds(companies.map((c) => c.id));
  };

  const deselectAll = () => {
    setSelectedCompanyIds([]);
  };

  const analyzedCompanies = companies.filter((c) => c.status === 'analyzed');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Pitch Paul - E-Mail-Pitch generieren</DialogTitle>
          <DialogDescription>
            Wähle Firmen aus und beschreibe, was du pitchen möchtest. Pitch Paul erstellt
            überzeugende E-Mails für deine Kaltakquise.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* User Input */}
          <div>
            <Label htmlFor="userInput">Was möchtest du pitchen?</Label>
            <Textarea
              id="userInput"
              {...register('userInput')}
              placeholder="z.B. 'Automatisiere deine internen Prozesse mit unserer KI-Lösung...'"
              rows={4}
              className="mt-2"
            />
            {errors.userInput && (
              <p className="text-sm text-destructive mt-1">{errors.userInput.message}</p>
            )}
          </div>

          {/* Company Selection */}
          <div>
            <Label>Firmen auswählen (nur analysierte)</Label>
            <div className="flex gap-2 mt-2">
              <Button type="button" variant="outline" size="sm" onClick={selectAll}>
                Alle auswählen
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={deselectAll}>
                Alle abwählen
              </Button>
            </div>

            {loadingCompanies ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : analyzedCompanies.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Keine analysierten Firmen gefunden. Führe zuerst "Analyse Anna" aus.
              </div>
            ) : (
              <ScrollArea className="h-60 mt-2 border rounded-md p-4">
                <div className="space-y-3">
                  {analyzedCompanies.map((company) => (
                    <div key={company.id} className="flex items-start space-x-3">
                      <Checkbox
                        id={company.id}
                        checked={selectedCompanyIds.includes(company.id)}
                        onCheckedChange={() => toggleCompany(company.id)}
                      />
                      <label
                        htmlFor={company.id}
                        className="text-sm leading-none cursor-pointer flex-1"
                      >
                        <div className="font-medium">{company.company}</div>
                        <div className="text-muted-foreground">
                          {company.industry} • {company.city || 'Unbekannter Ort'}
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}

            {selectedCompanyIds.length === 0 && (
              <p className="text-sm text-destructive mt-1">Mindestens eine Firma auswählen</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button
              type="submit"
              disabled={isTriggering || selectedCompanyIds.length === 0}
            >
              {isTriggering ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Wird gestartet...
                </>
              ) : (
                'Pitch generieren'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
