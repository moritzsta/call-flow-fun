import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { WorkflowStatusBadge } from '@/components/workflows/WorkflowStatusBadge';
import { Activity, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface WorkflowState {
  id: string;
  project_id: string;
  workflow_name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  started_at: string;
  completed_at: string | null;
  project_title?: string;
}

interface ActiveWorkflowsProps {
  workflows: WorkflowState[];
  isLoading: boolean;
}

const workflowNameMap: Record<string, string> = {
  finder_felix: 'Finder Felix',
  analyse_anna: 'Analyse Anna',
  pitch_paul: 'Pitch Paul',
  email_sender: 'E-Mail Versand',
};

export const ActiveWorkflows = ({ workflows, isLoading }: ActiveWorkflowsProps) => {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const recentWorkflows = workflows.slice(0, 5);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Workflow-Status</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Letzte Workflows
          </CardTitle>
          <CardDescription>Übersicht über kürzlich ausgeführte Workflows</CardDescription>
        </CardHeader>
        <CardContent>
          {recentWorkflows.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Noch keine Workflows gestartet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Workflows erscheinen hier, sobald Sie diese in einem Projekt starten
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentWorkflows.map((workflow) => (
                <div
                  key={workflow.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/projects/${workflow.project_id}`)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-medium">
                        {workflowNameMap[workflow.workflow_name] || workflow.workflow_name}
                      </span>
                      <WorkflowStatusBadge status={workflow.status} />
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {workflow.project_title && (
                        <>
                          Projekt: {workflow.project_title}
                          {' · '}
                        </>
                      )}
                      {format(new Date(workflow.started_at), 'dd.MM.yyyy HH:mm', { locale: de })}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/projects/${workflow.project_id}`);
                    }}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
