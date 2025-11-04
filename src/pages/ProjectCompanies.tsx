import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Building2, RefreshCw, Search } from 'lucide-react';
import { useCompanies, CompanyFilters as Filters, CompanySortConfig, Company } from '@/hooks/useCompanies';
import { CompanyFilters } from '@/components/companies/CompanyFilters';
import { CompaniesTable } from '@/components/companies/CompaniesTable';
import { ImportCompaniesButton } from '@/components/companies/ImportCompaniesButton';
import { ExportCompaniesButton } from '@/components/companies/ExportCompaniesButton';
import { useIsMobile } from '@/hooks/use-mobile';
import { CompanyStats } from '@/components/companies/CompanyStats';
import { BulkActions } from '@/components/companies/BulkActions';
import { ViewControls, ViewMode, Density, VisibleColumns } from '@/components/companies/ViewControls';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import Papa from 'papaparse';

export default function ProjectCompanies() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const [filters, setFilters] = useState<Filters>({});
  const [sortConfig, setSortConfig] = useState<CompanySortConfig>({
    field: 'created_at',
    ascending: false,
  });
  const [selectedCompanies, setSelectedCompanies] = useState<Company[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [density, setDensity] = useState<Density>('comfortable');
  const [visibleColumns, setVisibleColumns] = useState<VisibleColumns>({
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
  });

  const {
    companies,
    totalCount,
    isLoading,
    refetch,
    deleteCompany,
    updateCompanyStatus,
  } = useCompanies(id, filters, sortConfig, { page: 0, pageSize: 10000 });

  // Bulk Actions Handlers
  const handleBulkStatusChange = async (status: Company['status']) => {
    try {
      await Promise.all(
        selectedCompanies.map((company) =>
          supabase
            .from('companies')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('id', company.id)
        )
      );
      toast.success(`Status von ${selectedCompanies.length} Firmen aktualisiert`);
      setSelectedCompanies([]);
      refetch();
    } catch (error) {
      toast.error('Fehler beim Aktualisieren der Firmen');
    }
  };

  const handleBulkDelete = async () => {
    try {
      await Promise.all(
        selectedCompanies.map((company) =>
          supabase.from('companies').delete().eq('id', company.id)
        )
      );
      toast.success(`${selectedCompanies.length} Firmen gelöscht`);
      setSelectedCompanies([]);
      refetch();
    } catch (error) {
      toast.error('Fehler beim Löschen der Firmen');
    }
  };

  const handleBulkExport = () => {
    const csv = Papa.unparse(
      selectedCompanies.map((c) => ({
        Firma: c.company,
        Branche: c.industry || '',
        CEO: c.ceo_name || '',
        Email: c.email || '',
        Telefon: c.phone || '',
        Website: c.website || '',
        Stadt: c.city || '',
        Bundesland: c.state || '',
        Status: c.status,
      }))
    );
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `firmen-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Export erfolgreich');
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container max-w-7xl py-8">
          <Skeleton className="h-10 w-32 mb-6" />
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container max-w-7xl py-8">
        <Button
          variant="ghost"
          onClick={() => navigate(`/projects/${id}`)}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zurück zum Projekt
        </Button>

        <div className="mb-8">
          <div className={`flex items-start ${isMobile ? 'flex-col gap-4' : 'justify-between'}`}>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className={`font-bold ${isMobile ? 'text-2xl' : 'text-3xl'}`}>Firmen</h1>
                  <p className="text-muted-foreground text-sm">
                    {totalCount} {totalCount === 1 ? 'Firma' : 'Firmen'} gesamt
                  </p>
                </div>
              </div>
            </div>
            <Button variant="outline" onClick={() => refetch()} className={isMobile ? 'w-full' : ''}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Aktualisieren
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <CompanyStats companies={companies} isLoading={isLoading} />

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>Firmen-Liste</CardTitle>
                <CardDescription>
                  Filtern, sortieren und verwalten Sie die Firmen dieses Projekts
                </CardDescription>
              </div>
              <ViewControls
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                density={density}
                onDensityChange={setDensity}
                visibleColumns={visibleColumns}
                onVisibleColumnsChange={setVisibleColumns}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Filters */}
            <CompanyFilters filters={filters} onFiltersChange={setFilters} />

            {/* Bulk Actions */}
            <BulkActions
              selectedCompanies={selectedCompanies}
              onClearSelection={() => setSelectedCompanies([])}
              onStatusChange={handleBulkStatusChange}
              onDelete={handleBulkDelete}
              onExport={handleBulkExport}
            />

            {/* Import/Export Buttons */}
            <div className="flex gap-2 justify-end">
              <ImportCompaniesButton projectId={id!} />
              <ExportCompaniesButton projectId={id!} />
            </div>

            {/* Table/Cards View */}
            {companies.length === 0 && !isLoading ? (
              <div className="text-center py-16 border rounded-lg bg-muted/20">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Keine Firmen gefunden</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  {Object.keys(filters).length > 0
                    ? 'Versuchen Sie, die Filter anzupassen'
                    : 'Starten Sie Finder Felix, um Firmen zu finden'}
                </p>
                {Object.keys(filters).length === 0 && (
                  <Button onClick={() => navigate(`/projects/${id}/finder-felix`)}>
                    <Search className="mr-2 h-4 w-4" />
                    Finder Felix starten
                  </Button>
                )}
              </div>
            ) : (
              <>
                <CompaniesTable
                  companies={companies}
                  onDelete={deleteCompany}
                  onStatusChange={updateCompanyStatus}
                  sortConfig={sortConfig}
                  onSortChange={setSortConfig}
                  selectedCompanies={selectedCompanies}
                  onSelectionChange={setSelectedCompanies}
                  viewMode={viewMode}
                  density={density}
                  visibleColumns={visibleColumns}
                />

                {/* Total count info */}
                <div className="text-sm text-muted-foreground text-center pt-4 border-t">
                  {companies.length} von {totalCount} Firmen angezeigt
                  {companies.length !== totalCount && ' (gefiltert)'}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
