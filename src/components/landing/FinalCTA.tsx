import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export const FinalCTA = () => {
  return (
    <section className="relative px-4 py-20 sm:px-6 lg:px-8 overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/80 to-accent" />
      
      {/* Grid Pattern Overlay */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `linear-gradient(to right, white 1px, transparent 1px),
                           linear-gradient(to bottom, white 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      />

      {/* Content */}
      <div className="relative z-10 max-w-3xl mx-auto text-center">
        <h2 className="text-4xl font-bold mb-4 text-white">
          Bereit für Ihre personalisierten Sales-E-Mails?
        </h2>
        <p className="text-xl mb-8 text-white/90">
          Sagen Sie uns Branche und Stadt – wir liefern die E-Mails.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            size="lg" 
            variant="secondary"
            className="bg-white text-primary hover:bg-white/90"
            asChild
          >
            <Link to="/contact">
              Angebot anfordern
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            className="border-white text-white hover:bg-white/10 hover:text-white"
            asChild
          >
            <Link to="/contact">Fragen? Kontakt aufnehmen</Link>
          </Button>
        </div>

        {/* Trust Elements */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center text-sm text-white/80">
          <span className="flex items-center justify-center gap-1">
            <span className="text-white">✓</span> Kein Abo notwendig
          </span>
          <span className="flex items-center justify-center gap-1">
            <span className="text-white">✓</span> 72h Lieferzeit
          </span>
          <span className="flex items-center justify-center gap-1">
            <span className="text-white">✓</span> DSGVO-konform
          </span>
        </div>
      </div>
    </section>
  );
};
