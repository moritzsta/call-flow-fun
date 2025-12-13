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
import { MoreVertical, Settings, Archive, Trash2, ExternalLink, Building2, Mail, Calendar, FolderOpen } from 'lucide-react';
import { Project, useProjects } from '@/hooks/useProjects';
import { useProjectStats } from '@/hooks/useProjectStats';

interface ProjectRowProps {
  project: Project;
  canManage: boolean;
  index: number;
}

// Calculate dynamic color based on companies and emails
const getProgressColor = (companiesCount: number, emailsCount: number): string => {
  const score = Math.min(100, (companiesCount * 0.5) + (emailsCount * 2));
  const hue = Math.round((score / 100) * 120);
  return `hsl(${hue}, 70%, 45%)`;
};

const ProjectRow = ({ project, canManage, index }: ProjectRowProps) => {
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

  const companiesCount = stats?.companiesCount ?? 0;
  const emailsCount = stats?.emailsCount ?? 0;
  const borderColor = getProgressColor(companiesCount, emailsCount);

  return (
    <TableRow 
      className={`group cursor-pointer transition-all duration-200 relative
                  hover:bg-muted/50 hover:shadow-md
                  ${index % 2 === 0 ? 'bg-card' : 'bg-muted/20'}`}
      onClick={() => navigate(`/projects/${project.id}`)}
    >
      {/* Dynamic color indicator */}
      <TableCell className="w-1 p-0 relative">
        <div 
          className="absolute left-0 top-2 bottom-2 w-1.5 rounded-r-full transition-all duration-300 group-hover:w-2"
          style={{ backgroundColor: borderColor }}
        />
      </TableCell>
      
      <TableCell className="font-medium pl-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-primary/20 to-highlight/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <FolderOpen className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-foreground group-hover:text-primary transition-colors truncate max-w-[200px]">
              {project.title}
            </p>
            {project.description && (
              <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                {project.description}
              </p>
            )}
          </div>
        </div>
      </TableCell>
      
      <TableCell>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
          <Building2 className="h-4 w-4" />
          <span className="text-sm font-semibold">{statsLoading ? '...' : companiesCount}</span>
        </div>
      </TableCell>
      
      <TableCell>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-success/10 text-success border border-success/20">
          <Mail className="h-4 w-4" />
          <span className="text-sm font-semibold">{statsLoading ? '...' : emailsCount}</span>
        </div>
      </TableCell>
      
      <TableCell>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span className="text-sm">{new Date(project.created_at).toLocaleDateString('de-DE')}</span>
        </div>
      </TableCell>
      
      <TableCell onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary/10 hover:text-primary"
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
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
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
    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-lg">
      <Table>
        <TableHeader>
          <TableRow className="bg-gradient-to-r from-muted via-muted/80 to-muted/60 border-b-2 border-border">
            <TableHead className="w-2"></TableHead>
            <TableHead className="font-bold text-foreground">
              <div className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-primary" />
                Projekt
              </div>
            </TableHead>
            <TableHead className="w-32 font-bold text-foreground">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                Firmen
              </div>
            </TableHead>
            <TableHead className="w-32 font-bold text-foreground">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-success" />
                E-Mails
              </div>
            </TableHead>
            <TableHead className="w-36 font-bold text-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                Erstellt
              </div>
            </TableHead>
            <TableHead className="w-24 font-bold text-foreground">Aktionen</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project, index) => (
            <ProjectRow key={project.id} project={project} canManage={canManage} index={index} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
