import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Archive, Trash2 } from 'lucide-react';

interface DangerZoneProps {
  projectId: string;
  projectTitle: string;
  organizationId: string;
  onArchive: () => void;
  onDelete: (params: { id: string; organizationId: string }) => void;
  isArchiving?: boolean;
  isDeleting?: boolean;
}

export const DangerZone = ({
  projectId,
  projectTitle,
  organizationId,
  onArchive,
  onDelete,
  isArchiving = false,
  isDeleting = false,
}: DangerZoneProps) => {
  const navigate = useNavigate();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleArchive = () => {
    onArchive();
    navigate('/projects');
  };

  const handleDelete = () => {
    onDelete({ id: projectId, organizationId });
    setShowDeleteDialog(false);
    navigate('/projects');
  };

  return (
    <Card className="border-destructive">
      <CardHeader>
        <CardTitle className="text-destructive">Gefahrenbereich</CardTitle>
        <CardDescription>
          Irreversible Aktionen für dieses Projekt
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Archive Project */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-1">
            <h4 className="font-medium">Projekt archivieren</h4>
            <p className="text-sm text-muted-foreground">
              Das Projekt wird archiviert und ist nicht mehr in der Liste sichtbar.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleArchive}
            disabled={isArchiving}
            className="ml-4"
          >
            <Archive className="mr-2 h-4 w-4" />
            {isArchiving ? 'Archiviere...' : 'Archivieren'}
          </Button>
        </div>

        {/* Delete Project */}
        <div className="flex items-center justify-between p-4 border border-destructive rounded-lg">
          <div className="space-y-1">
            <h4 className="font-medium text-destructive">Projekt löschen</h4>
            <p className="text-sm text-muted-foreground">
              Das Projekt wird permanent gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.
            </p>
          </div>
          <Button
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
            disabled={isDeleting}
            className="ml-4"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {isDeleting ? 'Lösche...' : 'Löschen'}
          </Button>
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Projekt wirklich löschen?</AlertDialogTitle>
              <AlertDialogDescription>
                Diese Aktion kann nicht rückgängig gemacht werden. Das Projekt
                <span className="font-semibold"> "{projectTitle}" </span>
                und alle zugehörigen Daten (Firmen, E-Mails, Workflows) werden permanent gelöscht.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Abbrechen</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Ja, löschen
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};
