import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Index = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-6">
        <h1 className="mb-4 text-4xl font-bold">Cold Calling App</h1>
        <p className="text-xl text-muted-foreground">
          Automatisieren Sie Ihre Kaltakquise mit KI-gestützten Workflows
        </p>
        <div className="flex gap-4 justify-center mt-8">
          <Link to="/auth">
            <Button size="lg">Anmelden / Registrieren</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Index;
