import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FolderOpen, ArrowRight, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

interface Project {
  id: string;
  title: string;
  description: string | null;
  organization_id: string;
  organization_name?: string;
  archived: boolean;
  created_at: string;
}

interface RecentProjectsProps {
  projects: Project[];
  isLoading: boolean;
}

export const RecentProjects = ({ projects, isLoading }: RecentProjectsProps) => {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  const activeProjects = projects.filter((p) => !p.archived).slice(0, 4);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Aktuelle Projekte</h2>
        <Button variant="outline" onClick={() => navigate('/projects')}>
          Alle Projekte
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      {activeProjects.length === 0 ? (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Noch keine Projekte</h3>
            <p className="text-muted-foreground mb-4">
              Erstellen Sie Ihr erstes Projekt in einer Organisation
            </p>
            <Button onClick={() => navigate('/projects')}>Zu Projekten</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeProjects.map((project) => (
            <Card
              key={project.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate(`/projects/${project.id}`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="line-clamp-1 mb-2">{project.title}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {project.description || 'Keine Beschreibung'}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/projects/${project.id}`);
                    }}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Building2 className="h-4 w-4" />
                    <span>{project.organization_name || 'Organisation'}</span>
                  </div>
                  {!project.archived && (
                    <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-400">
                      Aktiv
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
