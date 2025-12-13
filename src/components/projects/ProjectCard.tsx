import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, Archive, Trash2, ArrowRight, Building2, Mail } from 'lucide-react';
import { Project } from '@/hooks/useProjects';
import { useProjectStats } from '@/hooks/useProjectStats';
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
import { useProjects } from '@/hooks/useProjects';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical } from 'lucide-react';

interface ProjectCardProps {
  project: Project;
  canManage: boolean;
}

// Calculate dynamic color based on companies and emails
const getProgressColor = (companiesCount: number, emailsCount: number): string => {
  // Score: 0.5 per company, 2 per email, max 100
  const score = Math.min(100, (companiesCount * 0.5) + (emailsCount * 2));
  // Interpolate hue from 0 (red) to 120 (green)
  const hue = Math.round((score / 100) * 120);
  return `hsl(${hue}, 70%, 45%)`;
};

export const ProjectCard = ({ project, canManage }: ProjectCardProps) => {
  const navigate = useNavigate();
  const { archiveProject, deleteProject, isArchiving, isDeleting } = useProjects(project.organization_id);
  const { data: stats, isLoading: statsLoading } = useProjectStats(project.id);

  const handleArchive = (e: React.MouseEvent) => {
    e.stopPropagation();
    archiveProject(project.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteProject({
      id: project.id,
      organizationId: project.organization_id,
    });
  };

  const companiesCount = stats?.companiesCount ?? 0;
  const emailsCount = stats?.emailsCount ?? 0;
  const borderColor = getProgressColor(companiesCount, emailsCount);

  return (
    <Card 
      className="group relative overflow-hidden bg-card border border-border/50 transition-all duration-300 cursor-pointer
                 hover:shadow-xl hover:shadow-primary/10 
                 hover:border-primary/40
                 hover:-translate-y-1"
      style={{ borderLeftWidth: '5px', borderLeftColor: borderColor }}
      onClick={() => navigate(`/projects/${project.id}`)}
    >
      {/* Hover gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-highlight/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <CardContent className="relative p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg text-foreground truncate group-hover:text-primary transition-colors">
              {project.title}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {new Date(project.created_at).toLocaleDateString('de-DE')}
            </p>
          </div>

          {canManage && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
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
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/projects/${project.id}/settings`); }}>
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
                  <AlertDialogContent onClick={(e) => e.stopPropagation()}>
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

        {project.description && (
          <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
            {project.description}
          </p>
        )}

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
              <Building2 className="h-4 w-4" />
              <span className="text-sm font-semibold">{statsLoading ? '...' : companiesCount}</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-success/10 text-success border border-success/20">
              <Mail className="h-4 w-4" />
              <span className="text-sm font-semibold">{statsLoading ? '...' : emailsCount}</span>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-300" />
        </div>
      </CardContent>
    </Card>
  );
};
