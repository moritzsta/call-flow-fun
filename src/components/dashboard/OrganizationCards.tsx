import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Users, ArrowRight, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

interface Organization {
  id: string;
  name: string;
  description: string | null;
  member_count?: number;
}

interface OrganizationCardsProps {
  organizations: Organization[];
  isLoading: boolean;
  onCreateNew: () => void;
}

export const OrganizationCards = ({
  organizations,
  isLoading,
  onCreateNew,
}: OrganizationCardsProps) => {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Meine Organisationen</h2>
        <Button onClick={onCreateNew}>
          <Plus className="mr-2 h-4 w-4" />
          Neue Organisation
        </Button>
      </div>

      {organizations.length === 0 ? (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Noch keine Organisationen</h3>
            <p className="text-muted-foreground mb-4">
              Erstellen Sie Ihre erste Organisation, um loszulegen
            </p>
            <Button onClick={onCreateNew}>
              <Plus className="mr-2 h-4 w-4" />
              Organisation erstellen
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {organizations.map((org) => (
            <Card
              key={org.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate(`/organizations/${org.id}`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/organizations/${org.id}`);
                    }}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
                <CardTitle className="line-clamp-1">{org.name}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {org.description || 'Keine Beschreibung'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{org.member_count || 0} Mitglieder</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
