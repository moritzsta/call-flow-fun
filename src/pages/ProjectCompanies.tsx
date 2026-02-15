import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Building2, RefreshCw, Search, Trash2, Loader2, Plus, Sparkles } from 'lucide-react';
import { useCompanies, CompanyFilters as Filters, CompanySortConfig, Company, CreateCompanyData } from '@/hooks/useCompanies';
import { CompanyFilters } from '@/components/companies/CompanyFilters';
import { CompaniesTable } from '@/components/companies/CompaniesTable';
import { ImportCompaniesButton } from '@/components/companies/ImportCompaniesButton';
import { ExportCompaniesButton } from '@/components/companies/ExportCompaniesButton';
import { AddCompanyDialog } from '@/components/companies/AddCompanyDialog';
import { CleanupCompaniesDialog } from '@/components/companies/CleanupCompaniesDialog';
import { useIsMobile } from '@/hooks/use-mobile';
import { CompanyStats } from '@/components/companies/CompanyStats';
import { BulkActions } from '@/components/companies/BulkActions';
import { ViewControls, ViewMode, Density, VisibleColumns } from '@/components/companies/ViewControls';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import Papa from 'papaparse';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

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
  const [isRemovingDuplicates, setIsRemovingDuplicates] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [cleanupDialogOpen, setCleanupDialogOpen] = useState(false);

  const {
    companies,
    totalCount,
    isLoading,
    isFetching,
    refetch,
    deleteCompany,
    updateCompanyStatus,
    createCompany,
    isCreating,
  } = useCompanies(id, filters, sortConfig, { page: 0, pageSize: 10000 });

  const handleAddCompany = async (data: CreateCompanyData) => {
    await createCompany(data);
    setAddDialogOpen(false);
  };

  const handleRemoveDuplicates = async () => {
    if (!id) return;
    
    setIsRemovingDuplicates(true);
    try {
      const { data, error } = await supabase.functions.invoke('remove-duplicate-companies', {
        body: { project_id: id }
      });

      if (error) {
        throw error;
      }

      if (data.success) {
        const { deleted_count, details } = data;
        if (deleted_count > 0) {
          toast.success(
            `${deleted_count} Duplikate entfernt`, 
            { 
              description: `Telefon: ${details.by_phone}, E-Mail: ${details.by_email}, Website: ${details.by_website}` 
            }
          );
          refetch();
        } else {
          toast.info('Keine Duplikate gefunden');
        }
      } else {
        throw new Error(data.error || 'Unbekannter Fehler');
      }
    } catch (error) {
      console.error('Error removing duplicates:', error);
      toast.error('Fehler beim Entfernen der Duplikate');
    } finally {
      setIsRemovingDuplicates(false);
    }
  };

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
            <div className={`flex gap-2 ${isMobile ? 'flex-col w-full' : ''}`}>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    disabled={isRemovingDuplicates}
                    className={isMobile ? 'w-full' : ''}
                  >
                    {isRemovingDuplicates ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="mr-2 h-4 w-4" />
                    )}
                    Duplikate entfernen
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Duplikate entfernen?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Diese Aktion entfernt alle Firmen mit doppelter Telefonnummer, E-Mail-Adresse oder Website. 
                      Die jeweils älteste Firma wird behalten.
                      <br /><br />
                      <strong>Diese Aktion kann nicht rückgängig gemacht werden.</strong>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                    <AlertDialogAction onClick={handleRemoveDuplicates}>
                      Duplikate löschen
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button 
                variant="outline" 
                onClick={() => setCleanupDialogOpen(true)}
                className={isMobile ? 'w-full' : ''}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Bereinigen
              </Button>
              <Button variant="outline" onClick={() => refetch()} className={isMobile ? 'w-full' : ''}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Aktualisieren
              </Button>
            </div>
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
            <CompanyFilters filters={filters} onFiltersChange={setFilters} isSearching={isFetching} />

            {/* Bulk Actions */}
            <BulkActions
              selectedCompanies={selectedCompanies}
              onClearSelection={() => setSelectedCompanies([])}
              onStatusChange={handleBulkStatusChange}
              onDelete={handleBulkDelete}
              onExport={handleBulkExport}
            />

            {/* Add / Import / Export Buttons */}
            <div className="flex gap-2 justify-end flex-wrap">
              <Button onClick={() => setAddDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Firma hinzufügen
              </Button>
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

        {/* Add Company Dialog */}
        <AddCompanyDialog
          open={addDialogOpen}
          onOpenChange={setAddDialogOpen}
          onSubmit={handleAddCompany}
          isLoading={isCreating}
        />

        {/* Cleanup Companies Dialog */}
        <CleanupCompaniesDialog
          open={cleanupDialogOpen}
          onOpenChange={setCleanupDialogOpen}
          projectId={id!}
          onSuccess={refetch}
        />
      </div>
    </Layout>
  );
}
