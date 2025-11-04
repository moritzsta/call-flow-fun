import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Download, Trash2, X, ChevronDown } from 'lucide-react';
import { Company } from '@/hooks/useCompanies';
import { useState } from 'react';
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

interface BulkActionsProps {
  selectedCompanies: Company[];
  onClearSelection: () => void;
  onStatusChange: (status: Company['status']) => void;
  onDelete: () => void;
  onExport: () => void;
}

export const BulkActions = ({
  selectedCompanies,
  onClearSelection,
  onStatusChange,
  onDelete,
  onExport,
}: BulkActionsProps) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  if (selectedCompanies.length === 0) return null;

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    onDelete();
    setDeleteDialogOpen(false);
  };

  return (
    <>
      <div className="sticky top-0 z-10 bg-primary/10 border border-primary/20 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="text-sm font-medium">
              {selectedCompanies.length} {selectedCompanies.length === 1 ? 'Firma' : 'Firmen'}{' '}
              ausgewählt
            </Badge>
            <Button variant="ghost" size="sm" onClick={onClearSelection}>
              <X className="h-4 w-4 mr-1" />
              Auswahl aufheben
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {/* Status ändern */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Status ändern
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onStatusChange('found')}>
                  Status: Gefunden
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onStatusChange('analyzed')}>
                  Status: Analysiert
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onStatusChange('contacted')}>
                  Status: Kontaktiert
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onStatusChange('rejected')}>
                  Status: Abgelehnt
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Export */}
            <Button variant="outline" size="sm" onClick={onExport}>
              <Download className="h-4 w-4 mr-2" />
              Exportieren
            </Button>

            {/* Delete */}
            <Button variant="destructive" size="sm" onClick={handleDeleteClick}>
              <Trash2 className="h-4 w-4 mr-2" />
              Löschen
            </Button>
          </div>
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Firmen löschen</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie {selectedCompanies.length}{' '}
              {selectedCompanies.length === 1 ? 'Firma' : 'Firmen'} wirklich löschen? Diese Aktion
              kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
