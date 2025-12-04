import { Clock, Target, Zap, Shield } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const benefits = [
  {
    icon: Clock,
    title: 'Kein Aufwand',
    description: 'Sie geben nur Branche und Stadt an – wir machen den Rest',
    metric: '0',
  },
  {
    icon: Zap,
    title: '72h Lieferzeit',
    description: 'Schnelle Bearbeitung garantiert – Standard innerhalb von 3 Tagen',
    metric: '72h',
  },
  {
    icon: Target,
    title: '100% personalisiert',
    description: 'Jede E-Mail ist individuell auf die Firma zugeschnitten',
    metric: '100%',
  },
  {
    icon: Shield,
    title: 'DSGVO-konform',
    description: 'Alle Daten werden sicher in Deutschland gespeichert',
    metric: 'DE',
  },
];

export const Benefits = () => {
  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8 bg-background">
      <div className="mx-auto max-w-6xl">
        {/* Section Header */}
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Ihre Vorteile
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Warum Kunden unseren E-Mail-Service lieben
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
