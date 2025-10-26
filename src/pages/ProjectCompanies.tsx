import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Building2, RefreshCw } from 'lucide-react';
import { useCompanies, CompanyFilters as Filters, CompanySortConfig } from '@/hooks/useCompanies';
import { CompanyFilters } from '@/components/companies/CompanyFilters';
import { CompaniesTable } from '@/components/companies/CompaniesTable';
import { ImportCompaniesButton } from '@/components/companies/ImportCompaniesButton';
import { ExportCompaniesButton } from '@/components/companies/ExportCompaniesButton';
import { useIsMobile } from '@/hooks/use-mobile';

export default function ProjectCompanies() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const [filters, setFilters] = useState<Filters>({});
  const [sortConfig, setSortConfig] = useState<CompanySortConfig>({
    field: 'created_at',
    ascending: false,
  });

  const {
    companies,
    isLoading,
    refetch,
    deleteCompany,
    updateCompanyStatus,
  } = useCompanies(id, filters, sortConfig);

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
                    {companies.length} {companies.length === 1 ? 'Firma' : 'Firmen'} gefunden
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

        <Card>
          <CardHeader>
            <CardTitle>Firmen-Liste</CardTitle>
            <CardDescription>
              Filtern, sortieren und verwalten Sie die Firmen dieses Projekts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <CompanyFilters filters={filters} onFiltersChange={setFilters} />
              <div className="flex gap-2">
                <ImportCompaniesButton projectId={id!} />
                <ExportCompaniesButton projectId={id!} />
              </div>
            </div>
            <CompaniesTable
              companies={companies}
              onDelete={deleteCompany}
              onStatusChange={updateCompanyStatus}
              sortConfig={sortConfig}
              onSortChange={setSortConfig}
            />
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
