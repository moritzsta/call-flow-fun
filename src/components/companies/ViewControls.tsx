import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Table, LayoutGrid, Settings2 } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

export type ViewMode = 'table' | 'cards';
export type Density = 'compact' | 'comfortable' | 'spacious';

export interface VisibleColumns {
  company: boolean;
  industry: boolean;
  ceo: boolean;
  city: boolean;
  state: boolean;
  email: boolean;
  phone: boolean;
  website: boolean;
  address: boolean;
  district: boolean;
  dataTags: boolean;
  status: boolean;
  created: boolean;
}

interface ViewControlsProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  density: Density;
  onDensityChange: (density: Density) => void;
  visibleColumns: VisibleColumns;
  onVisibleColumnsChange: (columns: VisibleColumns) => void;
}

export const ViewControls = ({
  viewMode,
  onViewModeChange,
  density,
  onDensityChange,
  visibleColumns,
  onVisibleColumnsChange,
}: ViewControlsProps) => {
  const toggleColumn = (column: keyof VisibleColumns) => {
    onVisibleColumnsChange({
      ...visibleColumns,
      [column]: !visibleColumns[column],
    });
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* View Mode Toggle */}
      <ToggleGroup
        type="single"
        value={viewMode}
        onValueChange={(value) => {
          if (value) onViewModeChange(value as ViewMode);
        }}
      >
        <ToggleGroupItem value="table" aria-label="Tabellenansicht">
          <Table className="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value="cards" aria-label="Kartenansicht">
          <LayoutGrid className="h-4 w-4" />
        </ToggleGroupItem>
      </ToggleGroup>

      {/* Density Toggle */}
      <ToggleGroup
        type="single"
        value={density}
        onValueChange={(value) => {
          if (value) onDensityChange(value as Density);
        }}
      >
        <ToggleGroupItem value="compact" aria-label="Kompakt">
          <span className="text-xs font-medium">Kompakt</span>
        </ToggleGroupItem>
        <ToggleGroupItem value="comfortable" aria-label="Komfortabel">
          <span className="text-xs font-medium">Standard</span>
        </ToggleGroupItem>
        <ToggleGroupItem value="spacious" aria-label="Geräumig">
          <span className="text-xs font-medium">Geräumig</span>
        </ToggleGroupItem>
      </ToggleGroup>

      {/* Column Visibility */}
      {viewMode === 'table' && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Settings2 className="h-4 w-4 mr-2" />
              Spalten
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Sichtbare Spalten</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={visibleColumns.company}
              onCheckedChange={() => toggleColumn('company')}
              disabled
            >
              Firma (immer sichtbar)
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibleColumns.industry}
              onCheckedChange={() => toggleColumn('industry')}
            >
              Branche
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibleColumns.ceo}
              onCheckedChange={() => toggleColumn('ceo')}
            >
              CEO
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibleColumns.city}
              onCheckedChange={() => toggleColumn('city')}
            >
              Stadt
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibleColumns.state}
              onCheckedChange={() => toggleColumn('state')}
            >
              Bundesland
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibleColumns.email}
              onCheckedChange={() => toggleColumn('email')}
            >
              E-Mail
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibleColumns.phone}
              onCheckedChange={() => toggleColumn('phone')}
            >
              Telefon
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibleColumns.website}
              onCheckedChange={() => toggleColumn('website')}
            >
              Website
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibleColumns.address}
              onCheckedChange={() => toggleColumn('address')}
            >
              Adresse
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibleColumns.district}
              onCheckedChange={() => toggleColumn('district')}
            >
              Bezirk
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibleColumns.dataTags}
              onCheckedChange={() => toggleColumn('dataTags')}
            >
              Daten-Tags
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibleColumns.status}
              onCheckedChange={() => toggleColumn('status')}
            >
              Status
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibleColumns.created}
              onCheckedChange={() => toggleColumn('created')}
            >
              Erstellt
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
};
