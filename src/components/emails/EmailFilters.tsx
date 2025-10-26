import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';
import { EmailFilters as Filters } from '@/hooks/useEmails';

interface EmailFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
}

export const EmailFilters = ({ filters, onFiltersChange }: EmailFiltersProps) => {
  const handleReset = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = filters.status || filters.company_name || filters.search;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Betreff, Empfänger..."
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
            <SelectItem value="draft">Entwurf</SelectItem>
            <SelectItem value="ready_to_send">Bereit</SelectItem>
            <SelectItem value="sent">Versendet</SelectItem>
            <SelectItem value="failed">Fehlgeschlagen</SelectItem>
          </SelectContent>
        </Select>

        {/* Company Filter */}
        <Input
          placeholder="Firma"
          value={filters.company_name || ''}
          onChange={(e) =>
            onFiltersChange({ ...filters, company_name: e.target.value || undefined })
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
