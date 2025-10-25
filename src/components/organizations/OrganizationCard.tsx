import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, Settings, Trash2 } from 'lucide-react';
import { Organization } from '@/hooks/useOrganizations';
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
import { useOrganizations } from '@/hooks/useOrganizations';
import { useAuth } from '@/contexts/AuthContext';

interface OrganizationCardProps {
  organization: Organization;
}

export const OrganizationCard = ({ organization }: OrganizationCardProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { deleteOrganization, isDeleting } = useOrganizations();

  const isOwner = user?.id === organization.owner_id;

  const handleDelete = () => {
    deleteOrganization(organization.id);
  };

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{organization.name}</CardTitle>
              {isOwner && <Badge variant="secondary" className="mt-1">Owner</Badge>}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {organization.description && (
          <CardDescription className="line-clamp-2">
            {organization.description}
          </CardDescription>
        )}

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>-</span>
          </div>
          <div className="text-xs">
            Erstellt: {new Date(organization.created_at).toLocaleDateString('de-DE')}
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => navigate(`/organizations/${organization.id}`)}
          >
            <Settings className="mr-2 h-4 w-4" />
            Verwalten
          </Button>

          {isOwner && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Organisation löschen?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Diese Aktion kann nicht rückgängig gemacht werden. Alle Projekte,
                    Firmen und E-Mails dieser Organisation werden ebenfalls gelöscht.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Löschen
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
