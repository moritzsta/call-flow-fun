import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { CreateOrganizationDialog } from '@/components/organizations/CreateOrganizationDialog';
import { OrganizationCard } from '@/components/organizations/OrganizationCard';
import { useOrganizations } from '@/hooks/useOrganizations';
import { Skeleton } from '@/components/ui/skeleton';
import { Building2 } from 'lucide-react';

export default function Organizations() {
  const { organizations, isLoading } = useOrganizations();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />

        <div className="flex flex-col flex-1 overflow-hidden">
          <Header />

          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Page Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-foreground">
                    Organisationen
                  </h1>
                  <p className="text-muted-foreground mt-1">
                    Verwalten Sie Ihre Organisationen und Teams
                  </p>
                </div>
                <CreateOrganizationDialog />
              </div>

              {/* Organizations Grid */}
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-64 w-full" />
                  ))}
                </div>
              ) : organizations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Building2 className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <h2 className="text-xl font-semibold text-foreground mb-2">
                    Noch keine Organisationen
                  </h2>
                  <p className="text-muted-foreground mb-6 max-w-md">
                    Erstellen Sie Ihre erste Organisation, um mit dem Cold Calling
                    zu beginnen.
                  </p>
                  <CreateOrganizationDialog />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {organizations.map((org) => (
                    <OrganizationCard key={org.id} organization={org} />
                  ))}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
