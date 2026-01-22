import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useCitySearch } from '@/hooks/useCitySearch';
import { useEmailTemplates } from '@/hooks/useEmailTemplates';
import { useAnalyseInstructions } from '@/hooks/useAnalyseInstructions';
import { PaulWorkflowConfig } from '@/types/workflow';
import { 
  Loader2, 
  X, 
  MapPin, 
  Target, 
  FileText, 
  User, 
  Sparkles,
  Building2,
  Search
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

const automationSchema = z.object({
  city: z.string().min(1, 'Bitte wählen Sie eine Stadt'),
  state: z.string().min(1, 'Bundesland erforderlich'),
  category: z.string().min(1, 'Kategorie ist erforderlich').max(200),
  vorhaben: z.string().min(10, 'Bitte beschreiben Sie Ihr Vorhaben (mind. 10 Zeichen)').max(5000),
  maxCompanies: z.number().positive('Bitte geben Sie eine positive Zahl ein').optional().or(z.literal(undefined)),
  analyseInstructionId: z.string().min(1, 'Bitte wählen Sie eine Analyse-Anweisung'),
  templateId: z.string().optional(),
  sellerName: z.string().min(2, 'Name erforderlich'),
  sellerCompany: z.string().min(2, 'Firma erforderlich'),
  sellerAddress: z.string().optional(),
  sellerPhone: z.string().optional(),
  sellerWebsite: z.string().url('Ungültige URL').optional().or(z.literal('')),
});

type AutomationFormData = z.infer<typeof automationSchema>;

interface AutomationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStart: (config: AutomationFormData) => void;
  isStarting: boolean;
}

export const AutomationDialog = ({
  open,
  onOpenChange,
  onStart,
  isStarting,
}: AutomationDialogProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const { templates, isLoading: templatesLoading } = useEmailTemplates();
  const { instructions: analyseInstructions, isLoading: instructionsLoading } = useAnalyseInstructions();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<AutomationFormData>({
    resolver: zodResolver(automationSchema),
    defaultValues: {
      city: '',
      state: '',
      category: '',
      vorhaben: '',
      maxCompanies: undefined,
      analyseInstructionId: '',
      templateId: '',
      sellerName: '',
      sellerCompany: '',
      sellerAddress: '',
      sellerPhone: '',
      sellerWebsite: '',
    },
  });

  const selectedCity = watch('city');
  const selectedState = watch('state');
  const selectedTemplateId = watch('templateId');
  const selectedAnalyseInstructionId = watch('analyseInstructionId');

  // Debounce Effect (500ms)
  useEffect(() => {
    setIsSearching(true);
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setIsSearching(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: cities = [], isLoading: citiesLoading } = useCitySearch(
    debouncedSearchTerm,
    searchTerm.length >= 2
  );

  const onSubmit = (data: AutomationFormData) => {
    const selectedTemplate = templates.find(t => t.id === data.templateId);
    const selectedInstruction = analyseInstructions.find(i => i.id === data.analyseInstructionId);
    
    const extendedData = {
      ...data,
      templateEnumName: selectedTemplate?.enum_name,
      analyseInstruction: selectedInstruction?.instruction,
      analyseInstructionId: data.analyseInstructionId,
      analyseInstructionName: selectedInstruction?.name,
      sellerContact: {
        name: data.sellerName,
        company: data.sellerCompany,
        address: data.sellerAddress || '',
        phone: data.sellerPhone || '',
        website: data.sellerWebsite || '',
      },
    };
    
    onStart(extendedData);
    reset();
    setSearchTerm('');
  };

  const handleCitySelect = (city: string, state: string) => {
    setValue('city', city, { shouldValidate: true });
    setValue('state', state, { shouldValidate: true });
    setSearchTerm('');
  };

  const handleClearCity = () => {
    setValue('city', '');
    setValue('state', '');
    setSearchTerm('');
  };

  const handleFillTestData = () => {
    setValue('city', 'Leinfelden-Echterdingen', { shouldValidate: true });
    setValue('state', 'Baden-Württemberg', { shouldValidate: true });
    setValue('category', 'Fitnessstudios', { shouldValidate: true });
    setValue('vorhaben', 'Ich habe eine Kalorienzählerapp mit innovativen KI Features entwickelt, welche ich gerne verkaufen möchte!', { shouldValidate: true });
    setValue('maxCompanies', 10, { shouldValidate: true });
    
    const salesTemplate = templates.find(t => t.enum_name === 'sales');
    if (salesTemplate) {
      setValue('templateId', salesTemplate.id, { shouldValidate: true });
    }
    
    if (analyseInstructions.length > 0) {
      setValue('analyseInstructionId', analyseInstructions[0].id, { shouldValidate: true });
    }
    
    setValue('sellerName', 'Moritz', { shouldValidate: true });
    setValue('sellerCompany', 'up2summit', { shouldValidate: true });
    
    setSearchTerm('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background border-b px-6 py-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              Prozess Automatisieren
            </DialogTitle>
            <DialogDescription>
              Starten Sie die automatische Pipeline: Finder Felix → Analyse Anna → Pitch Paul → Branding Britta
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Grid Layout: 2 Spalten */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Linke Spalte: Suche & Ziel */}
            <div className="space-y-6">
              {/* Suchkriterien Card */}
              <Card className="p-4 space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                  <Search className="h-4 w-4" />
                  Suchkriterien
                </div>

                {/* City Search */}
                <div className="space-y-2">
                  <Label htmlFor="city-search" className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                    Stadt & Bundesland *
                  </Label>
                  
                  <div className="relative">
                    <Input
                      id="city-search"
                      type="text"
                      placeholder="Stadt eingeben (mind. 2 Zeichen)..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      disabled={isStarting || !!selectedCity}
                      className="w-full"
                      autoComplete="off"
                    />
                    
                    {isSearching && (
                      <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                  </div>
                  
                  {selectedCity && selectedState && (
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-sm">
                        {selectedCity}, {selectedState}
                      </Badge>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleClearCity}
                        disabled={isStarting}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                  
                  {searchTerm.length >= 2 && !selectedCity && (
                    <div className="max-h-48 overflow-y-auto border rounded-md bg-popover shadow-md">
                      {citiesLoading ? (
                        <div className="p-3 text-center text-muted-foreground text-sm">
                          <Loader2 className="h-4 w-4 animate-spin mx-auto mb-1" />
                          Suche...
                        </div>
                      ) : cities.length === 0 ? (
                        <div className="p-3 text-center text-muted-foreground text-sm">
                          Keine Städte gefunden
                        </div>
                      ) : (
                        <div className="divide-y">
                          {cities.map((city) => (
                            <button
                              key={city.id}
                              type="button"
                              className="w-full p-2.5 text-left hover:bg-accent transition-colors"
                              onClick={() => handleCitySelect(city.city, city.state)}
                            >
                              <div className="font-medium text-sm">{city.city}</div>
                              <div className="text-xs text-muted-foreground">{city.state}</div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {errors.city && (
                    <p className="text-sm text-destructive">{errors.city.message}</p>
                  )}
                </div>

                {/* Category & Max Companies Row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="category" className="flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                      Branche *
                    </Label>
                    <Input
                      id="category"
                      placeholder="z.B. Handwerksbetriebe"
                      {...register('category')}
                      disabled={isStarting}
                    />
                    {errors.category && (
                      <p className="text-xs text-destructive">{errors.category.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxCompanies">Max. Firmen</Label>
                    <Input
                      id="maxCompanies"
                      type="number"
                      min="1"
                      placeholder="z.B. 50"
                      {...register('maxCompanies', { 
                        setValueAs: (v) => v === '' || v === null ? undefined : parseInt(v, 10) 
                      })}
                      disabled={isStarting}
                    />
                    {errors.maxCompanies && (
                      <p className="text-xs text-destructive">{String(errors.maxCompanies.message)}</p>
                    )}
                  </div>
                </div>
              </Card>

              {/* Vorhaben Card */}
              <Card className="p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Target className="h-4 w-4" />
                  Ihr Vorhaben *
                </div>
                <Textarea
                  id="vorhaben"
                  placeholder="Beschreiben Sie Ihr Vorhaben, z.B. 'Ich möchte eine neue Dienstleistung anbieten...'"
                  className="min-h-[140px] resize-none"
                  {...register('vorhaben')}
                  disabled={isStarting}
                />
                {errors.vorhaben && (
                  <p className="text-sm text-destructive">{errors.vorhaben.message}</p>
                )}
              </Card>
            </div>

            {/* Rechte Spalte: Einstellungen & Kontakt */}
            <div className="space-y-6">
              {/* Workflow-Einstellungen Card */}
              <Card className="p-4 space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                  <FileText className="h-4 w-4" />
                  Workflow-Einstellungen
                </div>

                {/* Analyse Instruction */}
                <div className="space-y-2">
                  <Label htmlFor="analyseInstructionId">Analyse-Anweisung *</Label>
                  <Select
                    value={selectedAnalyseInstructionId}
                    onValueChange={(value) => setValue('analyseInstructionId', value, { shouldValidate: true })}
                    disabled={isStarting || instructionsLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Analyse-Anweisung auswählen..." />
                    </SelectTrigger>
                    <SelectContent>
                      {analyseInstructions.map((instruction) => (
                        <SelectItem key={instruction.id} value={instruction.id}>
                          {instruction.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.analyseInstructionId && (
                    <p className="text-xs text-destructive">{errors.analyseInstructionId.message}</p>
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
                    <p className="text-xs text-destructive">{errors.templateId.message}</p>
                  )}
                </div>
              </Card>

              {/* Verkäufer-Kontaktdaten Card */}
              <Card className="p-4 space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                  <User className="h-4 w-4" />
                  Verkäufer-Kontaktdaten
                </div>
                
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
                      <p className="text-xs text-destructive">{errors.sellerName.message}</p>
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
                      <p className="text-xs text-destructive">{errors.sellerCompany.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sellerAddress">Adresse</Label>
                  <Input
                    id="sellerAddress"
                    placeholder="Musterstraße 123, 12345 Musterstadt"
                    {...register('sellerAddress')}
                    disabled={isStarting}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="sellerPhone">Telefon</Label>
                    <Input
                      id="sellerPhone"
                      placeholder="+49 123 456789"
                      {...register('sellerPhone')}
                      disabled={isStarting}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sellerWebsite">Website</Label>
                    <Input
                      id="sellerWebsite"
                      type="url"
                      placeholder="https://example.com"
                      {...register('sellerWebsite')}
                      disabled={isStarting}
                    />
                    {errors.sellerWebsite && (
                      <p className="text-xs text-destructive">{errors.sellerWebsite.message}</p>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex gap-3 justify-between pt-4 border-t">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleFillTestData}
              disabled={isStarting}
              className="text-muted-foreground"
            >
              🧪 Testdaten
            </Button>
            
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isStarting}
              >
                Abbrechen
              </Button>
              <Button type="submit" disabled={isStarting} className="min-w-[160px]">
                {isStarting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Wird gestartet...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Pipeline starten
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
