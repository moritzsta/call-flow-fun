import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AdaptiveDialog } from '@/components/ui/adaptive-dialog';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useEmailTemplates } from '@/hooks/useEmailTemplates';
import { useEmailInstructions } from '@/hooks/useEmailInstructions';
import { PaulWorkflowConfig } from '@/types/workflow';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const paulSchema = z.object({
  vorhaben: z.string().min(10, 'Bitte beschreiben Sie Ihr Vorhaben (mind. 10 Zeichen)').max(5000),
  templateId: z.string().optional(),
  sellerName: z.string().min(2, 'Name erforderlich'),
  sellerCompany: z.string().min(2, 'Firma erforderlich'),
  sellerAddress: z.string().optional(),
  sellerPhone: z.string().optional(),
  sellerWebsite: z.string().url('Ungültige URL').optional().or(z.literal('')),
});

type PaulFormData = z.infer<typeof paulSchema>;

interface SinglePitchPaulDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStart: (config: PaulWorkflowConfig) => void;
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
  const { templates, isLoading: templatesLoading } = useEmailTemplates();
  const { instructions: emailInstructions, isLoading: instructionsLoading } = useEmailInstructions();
  const [selectedInstructionId, setSelectedInstructionId] = useState<string>('custom');
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<PaulFormData>({
    resolver: zodResolver(paulSchema),
    defaultValues: {
      vorhaben: '',
      templateId: '',
      sellerName: '',
      sellerCompany: '',
      sellerAddress: '',
      sellerPhone: '',
      sellerWebsite: '',
    },
  });

  const selectedTemplateId = watch('templateId');

  const handleInstructionChange = (instructionId: string) => {
    setSelectedInstructionId(instructionId);
    
    if (instructionId === 'custom') {
      setValue('vorhaben', '');
    } else {
      const instruction = emailInstructions.find(i => i.id === instructionId);
      if (instruction) {
        setValue('vorhaben', instruction.instruction);
      }
    }
  };

  const onSubmit = (data: PaulFormData) => {
    const selectedTemplate = templates.find(t => t.id === data.templateId);
    
    const config: PaulWorkflowConfig = {
      vorhaben: data.vorhaben,
      templateEnumName: selectedTemplate?.enum_name,
      sellerContact: {
        name: data.sellerName,
        company: data.sellerCompany,
        address: data.sellerAddress || '',
        phone: data.sellerPhone || '',
        website: data.sellerWebsite || '',
      },
    };
    
    reset();
    setSelectedInstructionId('custom');
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

        {/* Email Instruction Dropdown */}
        <div className="space-y-2">
          <Label htmlFor="instructionSelect">Anweisung auswählen</Label>
          <Select
            value={selectedInstructionId}
            onValueChange={handleInstructionChange}
            disabled={isStarting || instructionsLoading}
          >
            <SelectTrigger id="instructionSelect">
              <SelectValue placeholder="Anweisung auswählen..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="custom">Eigene Anweisung</SelectItem>
              {emailInstructions.map((instruction) => (
                <SelectItem key={instruction.id} value={instruction.id}>
                  {instruction.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Wählen Sie eine gespeicherte Anweisung oder schreiben Sie Ihre eigene.
          </p>
        </div>

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

        {/* Email Template */}
        <div className="space-y-2">
          <Label htmlFor="templateId">E-Mail Template *</Label>
          <Select
            value={selectedTemplateId}
            onValueChange={(value) => setValue('templateId', value, { shouldValidate: true })}
            disabled={isStarting || templatesLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Template auswählen..." />
            </SelectTrigger>
            <SelectContent>
              {templates.map((template) => (
                <SelectItem key={template.id} value={template.id}>
                  {template.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.templateId && (
            <p className="text-sm text-destructive">{errors.templateId.message}</p>
          )}
        </div>

        {/* Seller Contact Data */}
        <div className="space-y-4 border-t pt-4">
          <h3 className="font-semibold text-sm">Verkäufer-Kontaktdaten</h3>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="sellerName">Name *</Label>
              <Input
                id="sellerName"
                placeholder="Max Mustermann"
                {...register('sellerName')}
                disabled={isStarting}
              />
              {errors.sellerName && (
                <p className="text-sm text-destructive">{errors.sellerName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="sellerCompany">Firma *</Label>
              <Input
                id="sellerCompany"
                placeholder="MusterFirma GmbH"
                {...register('sellerCompany')}
                disabled={isStarting}
              />
              {errors.sellerCompany && (
                <p className="text-sm text-destructive">{errors.sellerCompany.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sellerAddress">Adresse (optional)</Label>
            <Input
              id="sellerAddress"
              placeholder="Musterstraße 123, 12345 Musterstadt"
              {...register('sellerAddress')}
              disabled={isStarting}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="sellerPhone">Telefon (optional)</Label>
              <Input
                id="sellerPhone"
                placeholder="+49 123 456789"
                {...register('sellerPhone')}
                disabled={isStarting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sellerWebsite">Website (optional)</Label>
              <Input
                id="sellerWebsite"
                type="url"
                placeholder="https://example.com"
                {...register('sellerWebsite')}
                disabled={isStarting}
              />
              {errors.sellerWebsite && (
                <p className="text-sm text-destructive">{errors.sellerWebsite.message}</p>
              )}
            </div>
          </div>
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
