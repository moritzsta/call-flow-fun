import { Clock, Target, Zap, Shield } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const benefits = [
  {
    icon: Clock,
    title: 'Zeit sparen',
    description: 'Bis zu 80% weniger Zeitaufwand für Kaltakquise',
    metric: '80%',
  },
  {
    icon: Target,
    title: 'Höhere Conversion',
    description: 'Personalisierte E-Mails erhöhen die Antwortquote um 300%',
    metric: '3x',
  },
  {
    icon: Zap,
    title: 'Vollautomatisch',
    description: 'Einmal einrichten, dann läuft alles automatisch',
    metric: '24/7',
  },
  {
    icon: Shield,
    title: 'DSGVO-konform',
    description: 'Alle Daten werden sicher in Deutschland gespeichert',
    metric: '100%',
  },
];

export const Benefits = () => {
  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8 bg-background">
      <div className="mx-auto max-w-6xl">
        {/* Section Header */}
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Warum Cold Calling?
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Messbare Vorteile für Ihr Unternehmen
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {benefits.map((benefit) => {
            const Icon = benefit.icon;
            return (
              <Card
                key={benefit.title}
                className="border-border/50 hover:border-primary/20 transition-all hover:shadow-lg group"
              >
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <Icon className="h-8 w-8 text-primary" aria-hidden="true" />
                  </div>
                  <div className="text-4xl font-bold text-primary mb-2">{benefit.metric}</div>
                  <CardTitle className="text-xl">{benefit.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <CardDescription className="text-sm leading-relaxed">
                    {benefit.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};
