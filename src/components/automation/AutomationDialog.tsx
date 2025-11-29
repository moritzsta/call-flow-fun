import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AdaptiveDialog } from '@/components/ui/adaptive-dialog';
import { useCitySearch } from '@/hooks/useCitySearch';
import { useEmailTemplates } from '@/hooks/useEmailTemplates';
import { PaulWorkflowConfig } from '@/types/workflow';
import { Loader2, X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const automationSchema = z.object({
  city: z.string().min(1, 'Bitte wählen Sie eine Stadt'),
  state: z.string().min(1, 'Bundesland erforderlich'),
  category: z.string().min(1, 'Kategorie ist erforderlich').max(200),
  vorhaben: z.string().min(10, 'Bitte beschreiben Sie Ihr Vorhaben (mind. 10 Zeichen)').max(1000),
  maxCompanies: z.number().positive('Bitte geben Sie eine positive Zahl ein').optional().or(z.literal(undefined)),
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
    
    // Build extended config
    const extendedData = {
      ...data,
      templateEnumName: selectedTemplate?.enum_name,
      templateContent: selectedTemplate?.body_template,
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

  return (
    <AdaptiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Prozess Automatisieren"
      description="Starten Sie die automatische Pipeline: Finder Felix → Analyse Anna → Pitch Paul → Branding Britta"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* City Search */}
        <div className="space-y-2">
          <Label htmlFor="city-search">Stadt & Bundesland *</Label>
          
          {/* Search Input */}
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
            
            {/* Loading Indicator */}
            {isSearching && (
              <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>
          
          {/* Selected City Display */}
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
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
          
          {/* Results Dropdown */}
          {searchTerm.length >= 2 && !selectedCity && (
            <div className="max-h-60 overflow-y-auto border rounded-md bg-popover shadow-md z-50">
              {citiesLoading ? (
                <div className="p-4 text-center text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                  Suche läuft...
                </div>
              ) : cities.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  Keine Städte gefunden
                </div>
              ) : (
                <div className="divide-y">
                  {cities.map((city) => (
                    <button
                      key={city.id}
                      type="button"
                      className="w-full p-3 text-left hover:bg-accent transition-colors"
                      onClick={() => handleCitySelect(city.city, city.state)}
                    >
                      <div className="font-medium">{city.city}</div>
                      <div className="text-sm text-muted-foreground">{city.state}</div>
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

        {/* Category */}
        <div className="space-y-2">
          <Label htmlFor="category">Kategorie / Branche *</Label>
          <Input
            id="category"
            placeholder="z.B. Handwerksbetriebe, Restaurants, IT-Dienstleister"
            {...register('category')}
            disabled={isStarting}
          />
          {errors.category && (
            <p className="text-sm text-destructive">{errors.category.message}</p>
          )}
        </div>

        {/* Vorhaben */}
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

        {/* Max Companies (Optional) */}
        <div className="space-y-2">
          <Label htmlFor="maxCompanies">Maximale Anzahl Firmen (optional)</Label>
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
            <p className="text-sm text-destructive">{String(errors.maxCompanies.message)}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Leer lassen für unbegrenzte Suche
          </p>
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

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isStarting}
          >
            Abbrechen
          </Button>
          <Button type="submit" disabled={isStarting}>
            {isStarting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Wird gestartet...
              </>
            ) : (
              'Pipeline starten'
            )}
          </Button>
        </div>
      </form>
    </AdaptiveDialog>
  );
};
