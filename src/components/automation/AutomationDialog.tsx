import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AdaptiveDialog } from '@/components/ui/adaptive-dialog';
import { useCities } from '@/hooks/useCities';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const automationSchema = z.object({
  city: z.string().min(1, 'Bitte wählen Sie eine Stadt'),
  state: z.string().min(1, 'Bundesland erforderlich'),
  category: z.string().min(1, 'Kategorie ist erforderlich').max(200),
  vorhaben: z.string().min(10, 'Bitte beschreiben Sie Ihr Vorhaben (mind. 10 Zeichen)').max(1000),
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
  const [cityOpen, setCityOpen] = useState(false);
  const { data: cities = [], isLoading: citiesLoading } = useCities();

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
    },
  });

  const selectedCity = watch('city');
  const selectedState = watch('state');

  const onSubmit = (data: AutomationFormData) => {
    onStart(data);
    reset();
  };

  const handleCitySelect = (city: string, state: string) => {
    setValue('city', city, { shouldValidate: true });
    setValue('state', state, { shouldValidate: true });
    setCityOpen(false);
  };

  return (
    <AdaptiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Prozess Automatisieren"
      description="Starten Sie die automatische Pipeline: Finder Felix → Analyse Anna → Pitch Paul"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* City Selection */}
        <div className="space-y-2">
          <Label htmlFor="city">Stadt & Bundesland *</Label>
          <Popover open={cityOpen} onOpenChange={setCityOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={cityOpen}
                className="w-full justify-between"
                disabled={citiesLoading || isStarting}
              >
                {selectedCity && selectedState
                  ? `${selectedCity}, ${selectedState}`
                  : 'Stadt auswählen...'}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <Command>
                <CommandInput placeholder="Stadt suchen..." />
                <CommandList>
                  <CommandEmpty>Keine Stadt gefunden.</CommandEmpty>
                  <CommandGroup>
                    {cities.map((city) => (
                      <CommandItem
                        key={city.id}
                        value={`${city.city} ${city.state}`}
                        onSelect={() => handleCitySelect(city.city, city.state)}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            selectedCity === city.city ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        {city.city}, {city.state}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
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
