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
import { BarChart3, Building2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const analyseAnnaSchema = z.object({
  userInput: z
    .string()
    .trim()
    .min(10, 'Bitte geben Sie mindestens 10 Zeichen ein')
    .max(500, 'Maximal 500 Zeichen erlaubt'),
  companyIds: z.array(z.string()).min(1, 'Bitte wählen Sie mindestens eine Firma aus'),
});

type AnalyseAnnaFormData = z.infer<typeof analyseAnnaSchema>;

interface AnalyseAnnaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

export const AnalyseAnnaDialog = ({
  open,
  onOpenChange,
  projectId,
}: AnalyseAnnaDialogProps) => {
  const { user } = useAuth();
  const { triggerWorkflow, isTriggering } = useWorkflowTrigger();
  const { companies, isLoading: companiesLoading } = useCompanies(projectId);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
  } = useForm<AnalyseAnnaFormData>({
    resolver: zodResolver(analyseAnnaSchema),
    defaultValues: {
      userInput: '',
      companyIds: [],
    },
  });

  const onSubmit = (data: AnalyseAnnaFormData) => {
    if (!user) return;

    triggerWorkflow(
      {
        workflowName: 'analyse_anna',
        projectId,
        userId: user.id,
        triggerData: {
          user_input: data.userInput,
          company_ids: data.companyIds,
        },
      },
      {
        onSuccess: () => {
          reset();
          setSelectedCompanies([]);
          onOpenChange(false);
        },
      }
    );
  };

  const handleClose = () => {
    if (!isTriggering) {
      reset();
      setSelectedCompanies([]);
      onOpenChange(false);
    }
  };

  const toggleCompany = (companyId: string) => {
    setSelectedCompanies((prev) => {
      const newSelection = prev.includes(companyId)
        ? prev.filter((id) => id !== companyId)
        : [...prev, companyId];
      
      setValue('companyIds', newSelection);
      return newSelection;
    });
  };

  const selectAll = () => {
    const allIds = companies.map((c) => c.id);
    setSelectedCompanies(allIds);
    setValue('companyIds', allIds);
  };

  const deselectAll = () => {
    setSelectedCompanies([]);
    setValue('companyIds', []);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-accent" />
            Analyse Anna: Firmen analysieren
          </DialogTitle>
          <DialogDescription>
            Beschreiben Sie, was Sie über die ausgewählten Firmen herausfinden möchten.
            Anna analysiert die Firmen mit KI und findet relevante Informationen.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* User Input */}
          <div className="space-y-2">
            <Label htmlFor="userInput">
              Analyseanfrage*
              <span className="text-xs text-muted-foreground ml-2">
                (z.B. "Finde CEO und Wärmepumpen-Angebote")
              </span>
            </Label>
            <Textarea
              id="userInput"
              {...register('userInput')}
              placeholder="Was möchten Sie über die Firmen erfahren?"
              rows={3}
              disabled={isTriggering}
            />
            {errors.userInput && (
              <p className="text-sm text-destructive">{errors.userInput.message}</p>
            )}
          </div>

          {/* Company Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Firmen auswählen* ({selectedCompanies.length} ausgewählt)</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={selectAll}
                  disabled={isTriggering || companiesLoading || companies.length === 0}
                >
                  Alle
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={deselectAll}
                  disabled={isTriggering || selectedCompanies.length === 0}
                >
                  Keine
                </Button>
              </div>
            </div>

            {errors.companyIds && (
              <p className="text-sm text-destructive">{errors.companyIds.message}</p>
            )}

            {companiesLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Lade Firmen...
              </div>
            ) : companies.length === 0 ? (
              <div className="text-center py-8 border rounded-lg bg-muted/10">
                <Building2 className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground">
                  Keine Firmen gefunden. Starten Sie zuerst "Finder Felix" um Firmen zu finden.
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[250px] border rounded-lg p-4">
                <div className="space-y-2">
                  {companies.map((company) => (
                    <div
                      key={company.id}
                      className="flex items-start space-x-3 p-3 rounded-lg hover:bg-accent/5 transition-colors"
                    >
                      <Checkbox
                        id={company.id}
                        checked={selectedCompanies.includes(company.id)}
                        onCheckedChange={() => toggleCompany(company.id)}
                        disabled={isTriggering}
                      />
                      <div className="flex-1 min-w-0">
                        <label
                          htmlFor={company.id}
                          className="text-sm font-medium cursor-pointer block"
                        >
                          {company.company}
                        </label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {company.industry && (
                            <Badge variant="secondary" className="text-xs">
                              {company.industry}
                            </Badge>
                          )}
                          {company.city && (
                            <Badge variant="outline" className="text-xs">
                              {company.city}
                            </Badge>
                          )}
                          <Badge
                            variant={company.status === 'analyzed' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {company.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isTriggering}
            >
              Abbrechen
            </Button>
            <Button type="submit" disabled={isTriggering || companies.length === 0}>
              {isTriggering ? 'Starte Analyse...' : 'Analyse starten'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
