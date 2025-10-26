import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';
import { CompanyFilters as Filters } from '@/hooks/useCompanies';

interface CompanyFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
}

export const CompanyFilters = ({ filters, onFiltersChange }: CompanyFiltersProps) => {
  const handleReset = () => {
    onFiltersChange({});
  };

  const hasActiveFilters =
    filters.status || filters.industry || filters.city || filters.state || filters.search;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Firma, E-Mail, Telefon..."
            value={filters.search || ''}
            onChange={(e) =>
              onFiltersChange({ ...filters, search: e.target.value || undefined })
            }
            className="pl-10"
          />
        </div>

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
