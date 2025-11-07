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
import { Loader2, X } from 'lucide-react';

const automationSchema = z.object({
  city: z.string().min(1, 'Bitte wählen Sie eine Stadt'),
  state: z.string().min(1, 'Bundesland erforderlich'),
  category: z.string().min(1, 'Kategorie ist erforderlich').max(200),
  vorhaben: z.string().min(10, 'Bitte beschreiben Sie Ihr Vorhaben (mind. 10 Zeichen)').max(1000),
  maxCompanies: z.number().positive('Bitte geben Sie eine positive Zahl ein').optional().or(z.literal(undefined)),
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
    },
  });

  const selectedCity = watch('city');
  const selectedState = watch('state');

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
    onStart(data);
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
