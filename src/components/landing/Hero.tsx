import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sparkles, ArrowRight } from 'lucide-react';

export const Hero = () => {
  return (
    <section className="relative flex min-h-[90vh] items-center justify-center px-4 py-20 sm:px-6 lg:px-8">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5" />
      
      {/* Content */}
      <div className="relative z-10 mx-auto max-w-4xl text-center space-y-8">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-medium text-primary">
          <Sparkles className="h-4 w-4" />
          <span>KI-gestützte Kaltakquise</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          Automatisieren Sie Ihre{' '}
          <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Kaltakquise
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground sm:text-xl">
          Mit Cold Calling nutzen Sie drei KI-Workflows, um automatisch Firmen zu finden, 
          deren Websites zu analysieren und personalisierte Sales-E-Mails zu generieren.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Link to="/auth">
            <Button size="lg" className="w-full sm:w-auto group">
              Kostenlos starten
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
          <a href="#features">
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              Mehr erfahren
            </Button>
          </a>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-8 pt-12 border-t border-border/50">
          <div>
            <div className="text-3xl font-bold text-primary">3</div>
            <div className="text-sm text-muted-foreground">KI-Workflows</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary">100%</div>
            <div className="text-sm text-muted-foreground">Automatisiert</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary">24/7</div>
            <div className="text-sm text-muted-foreground">Verfügbar</div>
          </div>
        </div>
      </div>
    </section>
  );
};
