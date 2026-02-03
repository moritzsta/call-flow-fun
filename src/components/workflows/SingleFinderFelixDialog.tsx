import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AdaptiveDialog } from '@/components/ui/adaptive-dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCitySearch } from '@/hooks/useCitySearch';
import { Loader2, X, Info } from 'lucide-react';
import { FelixWorkflowConfig } from '@/types/workflow';

// German states
const GERMAN_STATES = [
  'Baden-Württemberg',
  'Bayern',
  'Berlin',
  'Brandenburg',
  'Bremen',
  'Hamburg',
  'Hessen',
  'Mecklenburg-Vorpommern',
  'Niedersachsen',
  'Nordrhein-Westfalen',
  'Rheinland-Pfalz',
  'Saarland',
  'Sachsen',
  'Sachsen-Anhalt',
  'Schleswig-Holstein',
  'Thüringen',
];

interface SingleFinderFelixDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStart: (config: FelixWorkflowConfig) => void;
  isStarting: boolean;
}

export const SingleFinderFelixDialog = ({
  open,
  onOpenChange,
  onStart,
  isStarting,
}: SingleFinderFelixDialogProps) => {
  const [searchMode, setSearchMode] = useState<'state' | 'cities'>('state');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCities, setSelectedCities] = useState<Array<{ city: string; state: string }>>([]);
  const [selectedState, setSelectedState] = useState('');
  const [category, setCategory] = useState('');
  const [maxCompanies, setMaxCompanies] = useState<string>('');
  const [errors, setErrors] = useState<{ state?: string; cities?: string; category?: string }>({});

  // Debounce Effect (500ms)
  useEffect(() => {
    setIsSearching(true);
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setIsSearching(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: citiesData = [], isLoading: citiesLoading } = useCitySearch(
    debouncedSearchTerm,
    searchTerm.length >= 2 && searchMode === 'cities'
  );

  const validate = (): boolean => {
    const newErrors: { state?: string; cities?: string; category?: string } = {};
    
    if (searchMode === 'state' && !selectedState) {
      newErrors.state = 'Bundesland erforderlich';
    }
    
    if (searchMode === 'cities' && selectedCities.length === 0) {
      newErrors.cities = 'Mindestens eine Stadt erforderlich';
    }
    
    if (!category.trim()) {
      newErrors.category = 'Kategorie ist erforderlich';
    } else if (category.length > 200) {
      newErrors.category = 'Maximal 200 Zeichen';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    const maxCompaniesNum = maxCompanies ? parseInt(maxCompanies, 10) : undefined;
    
    if (searchMode === 'state') {
      onStart({
        searchMode: 'state',
        state: selectedState,
        category: category.trim(),
        maxCompanies: maxCompaniesNum,
      });
    } else {
      onStart({
        searchMode: 'cities',
        cities: selectedCities,
        category: category.trim(),
        maxCompanies: maxCompaniesNum,
      });
    }
    
    // Reset form
    resetForm();
  };

  const resetForm = () => {
    setSearchTerm('');
    setSelectedCities([]);
    setSelectedState('');
    setCategory('');
    setMaxCompanies('');
    setSearchMode('state');
    setErrors({});
  };

  const handleCitySelect = (city: string, state: string) => {
    // Check if city already selected
    const exists = selectedCities.some(c => c.city === city && c.state === state);
    if (!exists) {
      setSelectedCities([...selectedCities, { city, state }]);
    }
    setSearchTerm('');
  };

  const handleRemoveCity = (index: number) => {
    setSelectedCities(selectedCities.filter((_, i) => i !== index));
  };

  const handleModeChange = (mode: 'state' | 'cities') => {
    setSearchMode(mode);
    setErrors({});
    // Reset mode-specific fields
    if (mode === 'state') {
      setSelectedCities([]);
    } else {
      setSelectedState('');
    }
  };

  const handleClose = () => {
    if (!isStarting) {
      resetForm();
      onOpenChange(false);
    }
  };

  return (
    <AdaptiveDialog
      open={open}
      onOpenChange={handleClose}
      title="Finder Felix starten"
      description="Suchen Sie Firmen nach Bundesland oder mehreren Städten"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Search Mode Toggle */}
        <div className="space-y-3">
          <Label>Suchmodus</Label>
          <RadioGroup
            value={searchMode}
            onValueChange={(value) => handleModeChange(value as 'state' | 'cities')}
            className="flex gap-6"
            disabled={isStarting}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="state" id="mode-state" />
              <Label htmlFor="mode-state" className="cursor-pointer font-normal">
                Bundesland-Suche
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="cities" id="mode-cities" />
              <Label htmlFor="mode-cities" className="cursor-pointer font-normal">
                Multi-Stadt-Suche
              </Label>
            </div>
          </RadioGroup>
        </div>

        <div className="border-t pt-4" />

        {/* State Search Mode */}
        {searchMode === 'state' && (
          <div className="space-y-2">
            <Label htmlFor="state">Bundesland *</Label>
            <Select
              value={selectedState}
              onValueChange={setSelectedState}
              disabled={isStarting}
            >
              <SelectTrigger id="state">
                <SelectValue placeholder="Bundesland auswählen" />
              </SelectTrigger>
              <SelectContent>
                {GERMAN_STATES.map((state) => (
                  <SelectItem key={state} value={state}>
                    {state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.state && (
              <p className="text-sm text-destructive">{errors.state}</p>
            )}
          </div>
        )}

        {/* Multi-City Search Mode */}
        {searchMode === 'cities' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="city-search">Städte hinzufügen *</Label>
              
              {/* Search Input */}
              <div className="relative">
                <Input
                  id="city-search"
                  type="text"
                  placeholder="Stadt eingeben (mind. 2 Zeichen)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  disabled={isStarting}
                  className="w-full"
                  autoComplete="off"
                />
                
                {/* Loading Indicator */}
                {isSearching && (
                  <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
              
              {/* Results Dropdown */}
              {searchTerm.length >= 2 && (
                <div className="max-h-60 overflow-y-auto border rounded-md bg-popover shadow-md z-50">
                  {citiesLoading ? (
                    <div className="p-4 text-center text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                      Suche läuft...
                    </div>
                  ) : citiesData.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      Keine Städte gefunden
                    </div>
                  ) : (
                    <div className="divide-y">
                      {citiesData.map((city) => {
                        const isSelected = selectedCities.some(
                          c => c.city === city.city && c.state === city.state
                        );
                        return (
                          <button
                            key={city.id}
                            type="button"
                            className={`w-full p-3 text-left transition-colors ${
                              isSelected 
                                ? 'bg-muted cursor-not-allowed opacity-50' 
                                : 'hover:bg-accent'
                            }`}
                            onClick={() => !isSelected && handleCitySelect(city.city, city.state)}
                            disabled={isSelected}
                          >
                            <div className="font-medium">{city.city}</div>
                            <div className="text-sm text-muted-foreground">{city.state}</div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Selected Cities */}
            {selectedCities.length > 0 && (
              <div className="space-y-2">
                <Label>Ausgewählte Städte ({selectedCities.length}):</Label>
                <div className="flex flex-wrap gap-2">
                  {selectedCities.map((cityData, index) => (
                    <Badge 
                      key={`${cityData.city}-${cityData.state}-${index}`} 
                      variant="secondary"
                      className="flex items-center gap-1 py-1 px-2"
                    >
                      {cityData.city}, {cityData.state.substring(0, 2).toUpperCase()}
                      <button
                        type="button"
                        onClick={() => handleRemoveCity(index)}
                        disabled={isStarting}
                        className="hover:text-destructive ml-1"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Info about scheduling */}
            {selectedCities.length > 1 && (
              <div className="flex items-start gap-2 p-3 bg-muted rounded-lg text-sm">
                <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <span>
                  <strong>{selectedCities.length} Workflows</strong> werden im 5-Minuten-Intervall 
                  nacheinander gestartet, um die API nicht zu überlasten.
                </span>
              </div>
            )}

            {errors.cities && (
              <p className="text-sm text-destructive">{errors.cities}</p>
            )}
          </div>
        )}

        {/* Category */}
        <div className="space-y-2">
          <Label htmlFor="category">Kategorie / Branche *</Label>
          <Input
            id="category"
            placeholder="z.B. Handwerksbetriebe, Restaurants, IT-Dienstleister"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={isStarting}
          />
          {errors.category && (
            <p className="text-sm text-destructive">{errors.category}</p>
          )}
        </div>

        {/* Max Companies (Optional) */}
        <div className="space-y-2">
          <Label htmlFor="maxCompanies">
            Maximale Anzahl Firmen {searchMode === 'cities' && selectedCities.length > 1 ? 'pro Stadt ' : ''}
            (optional)
          </Label>
          <Input
            id="maxCompanies"
            type="number"
            min="1"
            placeholder="z.B. 50"
            value={maxCompanies}
            onChange={(e) => setMaxCompanies(e.target.value)}
            disabled={isStarting}
          />
          <p className="text-xs text-muted-foreground">
            Leer lassen für unbegrenzte Suche
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
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
            ) : searchMode === 'cities' && selectedCities.length > 1 ? (
              `${selectedCities.length} Suchen starten`
            ) : (
              'Felix starten'
            )}
          </Button>
        </div>
      </form>
    </AdaptiveDialog>
  );
};
