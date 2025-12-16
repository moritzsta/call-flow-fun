import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { SearchInput } from '@/components/ui/search-input';
import { X, Globe, Mail, CheckCircle2 } from 'lucide-react';
import { CompanyFilters as Filters } from '@/hooks/useCompanies';

interface CompanyFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  isSearching?: boolean;
}

export const CompanyFilters = ({ filters, onFiltersChange, isSearching }: CompanyFiltersProps) => {
  const handleReset = () => {
    onFiltersChange({});
  };

  const hasActiveFilters =
    filters.status || 
    filters.industry || 
    filters.city || 
    filters.state || 
    filters.search ||
    filters.hasWebsite ||
    filters.hasEmail ||
    filters.isAnalyzed;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Search */}
        <SearchInput
          value={filters.search || ''}
          onChange={(value) =>
            onFiltersChange({ ...filters, search: value || undefined })
          }
          placeholder="Firma, E-Mail, Telefon..."
          debounceMs={300}
          isSearching={isSearching}
        />

        {/* Status Filter */}
        <Select
          value={filters.status || 'all'}
          onValueChange={(value) =>
            onFiltersChange({ ...filters, status: value === 'all' ? undefined : value })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Status</SelectItem>
            <SelectItem value="found">Gefunden</SelectItem>
            <SelectItem value="analyzed">Analysiert</SelectItem>
            <SelectItem value="contacted">Kontaktiert</SelectItem>
            <SelectItem value="rejected">Abgelehnt</SelectItem>
          </SelectContent>
        </Select>

        {/* Industry Filter */}
        <Input
          placeholder="Branche"
          value={filters.industry || ''}
          onChange={(e) =>
            onFiltersChange({ ...filters, industry: e.target.value || undefined })
          }
        />

        {/* City Filter */}
        <Input
          placeholder="Stadt"
          value={filters.city || ''}
          onChange={(e) =>
            onFiltersChange({ ...filters, city: e.target.value || undefined })
          }
        />

        {/* State Filter */}
        <Input
          placeholder="Bundesland"
          value={filters.state || ''}
          onChange={(e) =>
            onFiltersChange({ ...filters, state: e.target.value || undefined })
          }
        />
      </div>

      {/* Data Tags Filter */}
      <div className="flex flex-wrap gap-4 p-4 bg-muted/30 rounded-lg">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="has-website"
            checked={filters.hasWebsite || false}
            onCheckedChange={(checked) =>
              onFiltersChange({ ...filters, hasWebsite: checked as boolean || undefined })
            }
          />
          <Label 
            htmlFor="has-website" 
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-1.5 cursor-pointer"
          >
            <Globe className="h-3.5 w-3.5 text-green-600" />
            Nur mit Website
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="has-email"
            checked={filters.hasEmail || false}
            onCheckedChange={(checked) =>
              onFiltersChange({ ...filters, hasEmail: checked as boolean || undefined })
            }
          />
          <Label 
            htmlFor="has-email" 
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-1.5 cursor-pointer"
          >
            <Mail className="h-3.5 w-3.5 text-blue-600" />
            Nur mit Email
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="is-analyzed"
            checked={filters.isAnalyzed || false}
            onCheckedChange={(checked) =>
              onFiltersChange({ ...filters, isAnalyzed: checked as boolean || undefined })
            }
          />
          <Label 
            htmlFor="is-analyzed" 
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-1.5 cursor-pointer"
          >
            <CheckCircle2 className="h-3.5 w-3.5 text-purple-600" />
            Nur analysierte
          </Label>
        </div>
      </div>

      {/* Reset Button */}
      {hasActiveFilters && (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={handleReset}>
            <X className="mr-2 h-4 w-4" />
            Filter zurücksetzen
          </Button>
        </div>
      )}
    </div>
  );
};
