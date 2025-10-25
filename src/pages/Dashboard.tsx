import { useAuth } from '@/contexts/AuthContext';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';

export default function Dashboard() {
  const { profile } = useAuth();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        {/* Sidebar Navigation */}
        <AppSidebar />

        {/* Main Content Area */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Header */}
          <Header />

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-7xl mx-auto space-y-6">
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 rounded-lg p-8 border border-border">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Willkommen{profile?.full_name ? `, ${profile.full_name}` : ''}!
              </h1>
              <p className="text-muted-foreground">
                Verwalten Sie Ihre Cold Calling Projekte und Workflows von hier aus.
              </p>
            </div>

            {/* Quick Stats Placeholder */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Organisationen</p>
                    <p className="text-2xl font-bold text-foreground mt-1">-</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-2xl">🏢</span>
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Projekte</p>
                    <p className="text-2xl font-bold text-foreground mt-1">-</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center">
                    <span className="text-2xl">📁</span>
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Workflows</p>
                    <p className="text-2xl font-bold text-foreground mt-1">-</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-secondary/50 flex items-center justify-center">
                    <span className="text-2xl">⚡</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Placeholder Content */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Letzte Aktivitäten
              </h2>
              <p className="text-muted-foreground text-center py-8">
                Noch keine Aktivitäten vorhanden. Erstellen Sie Ihre erste Organisation, um zu beginnen.
              </p>
            </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
