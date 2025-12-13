import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { MoreVertical, Settings, Archive, Trash2, ExternalLink } from 'lucide-react';
import { Project, useProjects } from '@/hooks/useProjects';
import { useProjectStats } from '@/hooks/useProjectStats';

interface ProjectRowProps {
  project: Project;
  canManage: boolean;
}

const ProjectRow = ({ project, canManage }: ProjectRowProps) => {
  const navigate = useNavigate();
  const { archiveProject, deleteProject, isArchiving, isDeleting } = useProjects(project.organization_id);
  const { data: stats, isLoading: statsLoading } = useProjectStats(project.id);

  const handleArchive = () => {
    archiveProject(project.id);
  };

  const handleDelete = () => {
    deleteProject({
      id: project.id,
      organizationId: project.organization_id,
    });
  };

  return (
    <TableRow 
      className="cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={() => navigate(`/projects/${project.id}`)}
    >
      <TableCell className="font-medium max-w-[200px] truncate">
        {project.title}
      </TableCell>
      <TableCell>
        <Badge variant="secondary" className="font-mono">
          {statsLoading ? '...' : stats?.companiesCount ?? 0}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge variant="secondary" className="font-mono">
          {statsLoading ? '...' : stats?.emailsCount ?? 0}
        </Badge>
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">
        {new Date(project.created_at).toLocaleDateString('de-DE')}
      </TableCell>
      <TableCell onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => navigate(`/projects/${project.id}`)}
          >
            <ExternalLink className="h-4 w-4" />
          </Button>

          {canManage && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  disabled={isArchiving || isDeleting}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate(`/projects/${project.id}/settings`)}>
                  <Settings className="mr-2 h-4 w-4" />
                  Einstellungen
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleArchive} disabled={isArchiving}>
                  <Archive className="mr-2 h-4 w-4" />
                  Archivieren
                </DropdownMenuItem>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem
                      onSelect={(e) => e.preventDefault()}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Löschen
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Projekt löschen?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Diese Aktion kann nicht rückgängig gemacht werden. Alle Firmen und
                        E-Mails dieses Projekts werden ebenfalls gelöscht.
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
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
};

interface ProjectsTableProps {
  projects: Project[];
  canManage: boolean;
}

export const ProjectsTable = ({ projects, canManage }: ProjectsTableProps) => {
  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Projekt</TableHead>
            <TableHead className="w-24">Firmen</TableHead>
            <TableHead className="w-24">E-Mails</TableHead>
            <TableHead className="w-32">Erstellt</TableHead>
            <TableHead className="w-24">Aktionen</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => (
            <ProjectRow key={project.id} project={project} canManage={canManage} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
