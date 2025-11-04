import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Company, CompanySortConfig } from '@/hooks/useCompanies';
import { MoreHorizontal, ArrowUpDown, Trash2, Eye, MapPin, Building } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { ResponsiveTable, MobileCard } from '@/components/ui/responsive-table';
import { CompanyDataTags } from './CompanyDataTags';
import { Checkbox } from '@/components/ui/checkbox';
import { ViewMode, Density, VisibleColumns } from './ViewControls';
import { cn } from '@/lib/utils';

interface CompaniesTableProps {
  companies: Company[];
  onDelete: (companyId: string) => void;
  onStatusChange: (companyId: string, status: Company['status']) => void;
  sortConfig: CompanySortConfig;
  onSortChange: (config: CompanySortConfig) => void;
  selectedCompanies?: Company[];
  onSelectionChange?: (companies: Company[]) => void;
  viewMode?: ViewMode;
  density?: Density;
  visibleColumns?: VisibleColumns;
}

export const CompaniesTable = ({
  companies,
  onDelete,
  onStatusChange,
  sortConfig,
  onSortChange,
  selectedCompanies = [],
  onSelectionChange = () => {},
  viewMode = 'table',
  density = 'comfortable',
  visibleColumns = {
    company: true,
    industry: true,
    ceo: false,
    city: true,
    state: true,
    email: false,
    phone: false,
    website: false,
    address: false,
    district: false,
    dataTags: true,
    status: true,
    created: true,
  },
}: CompaniesTableProps) => {
  const navigate = useNavigate();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const isMobile = useIsMobile();

  const isSelected = (company: Company) =>
    selectedCompanies.some((c) => c.id === company.id);

  const toggleSelection = (company: Company) => {
    if (isSelected(company)) {
      onSelectionChange(selectedCompanies.filter((c) => c.id !== company.id));
    } else {
      onSelectionChange([...selectedCompanies, company]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedCompanies.length === companies.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(companies);
    }
  };

  const densityClasses = {
    compact: 'py-2',
    comfortable: 'py-3',
    spacious: 'py-4',
  };

  const handleSort = (field: CompanySortConfig['field']) => {
    onSortChange({
      field,
      ascending: sortConfig.field === field ? !sortConfig.ascending : true,
    });
  };

  const handleDeleteClick = (company: Company) => {
    setSelectedCompany(company);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedCompany) {
      onDelete(selectedCompany.id);
    }
    setDeleteDialogOpen(false);
    setSelectedCompany(null);
  };

  const getStatusBadge = (status: Company['status']) => {
    const config = {
      found: { label: 'Gefunden', className: 'bg-blue-500/10 text-blue-700 dark:text-blue-400' },
      analyzed: { label: 'Analysiert', className: 'bg-purple-500/10 text-purple-700 dark:text-purple-400' },
      contacted: { label: 'Kontaktiert', className: 'bg-green-500/10 text-green-700 dark:text-green-400' },
      rejected: { label: 'Abgelehnt', className: 'bg-red-500/10 text-red-700 dark:text-red-400' },
    };

    return (
      <Badge variant="secondary" className={config[status].className}>
        {config[status].label}
      </Badge>
    );
  };

  if (companies.length === 0) {
    return null;
  }

  // Cards View
  if (viewMode === 'cards') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {companies.map((company) => (
          <MobileCard key={company.id} onClick={() => navigate(`/companies/${company.id}`)}>
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <Checkbox
                  checked={isSelected(company)}
                  onCheckedChange={() => toggleSelection(company)}
                  onClick={(e) => e.stopPropagation()}
                />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/companies/${company.id}`); }}>
                      <Eye className="mr-2 h-4 w-4" />
                      Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDeleteClick(company); }} className="text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Löschen
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div>
                <h3 className="font-semibold text-lg">{company.company}</h3>
                {company.industry && <p className="text-sm text-muted-foreground">{company.industry}</p>}
                <CompanyDataTags company={company} className="mt-2" />
              </div>
              <div className="flex items-center justify-between">
                {getStatusBadge(company.status)}
              </div>
            </div>
          </MobileCard>
        ))}
      </div>
    );
  }

  const mobileView = (
    <div className="space-y-3">
      {companies.map((company) => (
        <MobileCard key={company.id} onClick={() => navigate(`/companies/${company.id}`)}>
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{company.company}</h3>
                {company.industry && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                    <Building className="h-3 w-3" />
                    {company.industry}
                  </p>
                )}
                <div className="mt-2">
                  <CompanyDataTags company={company} />
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" aria-label="Aktionen für Firma anzeigen">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/companies/${company.id}`);
                  }}>
                    <Eye className="mr-2 h-4 w-4" />
                    Details anzeigen
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    onStatusChange(company.id, 'analyzed');
                  }}>
                    Status: Analysiert
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    onStatusChange(company.id, 'contacted');
                  }}>
                    Status: Kontaktiert
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    onStatusChange(company.id, 'rejected');
                  }}>
                    Status: Abgelehnt
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(company);
                    }}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Löschen
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex flex-wrap gap-2 text-sm">
              {(company.city || company.state) && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {[company.city, company.state].filter(Boolean).join(', ')}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              {getStatusBadge(company.status)}
              <span className="text-xs text-muted-foreground">
                {new Date(company.created_at).toLocaleDateString('de-DE')}
              </span>
            </div>
          </div>
        </MobileCard>
      ))}
    </div>
  );

  return (
    <>
      <ResponsiveTable mobileView={mobileView}>
        <div className="rounded-md border">
          <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={selectedCompanies.length === companies.length}
                  onCheckedChange={toggleSelectAll}
                  aria-label="Alle auswählen"
                />
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('company')}
                  className="-ml-3"
                  aria-label="Nach Firma sortieren"
                >
                  Firma
                  <ArrowUpDown className="ml-2 h-4 w-4" aria-hidden="true" />
                </Button>
              </TableHead>
              {visibleColumns.industry && (
                <TableHead>
                  <Button variant="ghost" size="sm" onClick={() => handleSort('industry')} className="-ml-3">
                    Branche
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
              )}
              {visibleColumns.ceo && <TableHead>CEO</TableHead>}
              {visibleColumns.city && (
                <TableHead>
                  <Button variant="ghost" size="sm" onClick={() => handleSort('city')} className="-ml-3">
                    Stadt
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
              )}
              {visibleColumns.state && <TableHead>Bundesland</TableHead>}
              {visibleColumns.email && <TableHead>E-Mail</TableHead>}
              {visibleColumns.phone && <TableHead>Telefon</TableHead>}
              {visibleColumns.website && <TableHead>Website</TableHead>}
              {visibleColumns.address && <TableHead>Adresse</TableHead>}
              {visibleColumns.district && <TableHead>Bezirk</TableHead>}
              {visibleColumns.dataTags && <TableHead>Daten</TableHead>}
              {visibleColumns.status && (
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('status')}
                    className="-ml-3"
                    aria-label="Nach Status sortieren"
                  >
                    Status
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
              )}
              {visibleColumns.created && (
                <TableHead>
                  <Button variant="ghost" size="sm" onClick={() => handleSort('created_at')} className="-ml-3">
                    Erstellt
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
              )}
              <TableHead className="w-[50px]"><span className="sr-only">Aktionen</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {companies.map((company) => (
              <TableRow key={company.id} className={cn(densityClasses[density])}>
                <TableCell>
                  <Checkbox
                    checked={isSelected(company)}
                    onCheckedChange={() => toggleSelection(company)}
                    aria-label={`${company.company} auswählen`}
                  />
                </TableCell>
                <TableCell className="font-medium">{company.company}</TableCell>
                {visibleColumns.industry && <TableCell>{company.industry || '-'}</TableCell>}
                {visibleColumns.ceo && <TableCell>{company.ceo_name || '-'}</TableCell>}
                {visibleColumns.city && <TableCell>{company.city || '-'}</TableCell>}
                {visibleColumns.state && <TableCell>{company.state || '-'}</TableCell>}
                {visibleColumns.email && <TableCell className="text-sm">{company.email || '-'}</TableCell>}
                {visibleColumns.phone && <TableCell className="text-sm">{company.phone || '-'}</TableCell>}
                {visibleColumns.website && <TableCell className="text-sm truncate max-w-[200px]">{company.website || '-'}</TableCell>}
                {visibleColumns.address && <TableCell className="text-sm">{company.address || '-'}</TableCell>}
                {visibleColumns.district && <TableCell>{company.district || '-'}</TableCell>}
                {visibleColumns.dataTags && (
                  <TableCell>
                    <CompanyDataTags company={company} />
                  </TableCell>
                )}
                {visibleColumns.status && <TableCell>{getStatusBadge(company.status)}</TableCell>}
                {visibleColumns.created && (
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(company.created_at).toLocaleDateString('de-DE')}
                  </TableCell>
                )}
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label="Aktionen für Firma anzeigen">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => navigate(`/companies/${company.id}`)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Details anzeigen
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onStatusChange(company.id, 'analyzed')}>
                        Status: Analysiert
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onStatusChange(company.id, 'contacted')}>
                        Status: Kontaktiert
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onStatusChange(company.id, 'rejected')}>
                        Status: Abgelehnt
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteClick(company)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Löschen
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </div>
      </ResponsiveTable>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Firma löschen</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie die Firma "{selectedCompany?.company}" wirklich löschen? Diese Aktion kann
              nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
