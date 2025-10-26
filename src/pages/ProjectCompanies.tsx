import { useParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ProjectCompanies() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="container max-w-7xl py-8">
        <Button
          variant="ghost"
          onClick={() => navigate(`/projects/${id}`)}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zurück zum Projekt
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Firmen</h1>
          <p className="text-muted-foreground">
            Verwalten Sie die Firmen für dieses Projekt
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Firmen-Liste</CardTitle>
            <CardDescription>
              Diese Seite wird später mit der Firmen-Verwaltung implementiert
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground py-8">
              Coming soon... (Task 028)
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
