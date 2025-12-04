import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';

const plans = [
  {
    name: 'Starter',
    price: '199',
    period: 'einmalig',
    description: 'Perfekt zum Ausprobieren',
    emails: '25 E-Mails',
    features: [
      'Firmenrecherche inklusive',
      'Website-Analyse inklusive',
      'Vollständig personalisiert',
      'CSV/Excel Export',
    ],
    cta: 'Jetzt bestellen',
    highlighted: false,
  },
  {
    name: 'Business',
    price: '499',
    period: 'einmalig',
    description: 'Unser beliebtestes Paket',
    emails: '100 E-Mails',
    features: [
      'Alles aus Starter',
      '1 Revision inklusive',
      'Priority-Bearbeitung (48h)',
      'Persönliche Beratung',
    ],
    cta: 'Jetzt bestellen',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Auf Anfrage',
    period: '',
    description: 'Individuelle Anforderungen',
    emails: '250+ E-Mails',
    features: [
      'Alles aus Business',
      'Unbegrenzte Revisionen',
      'Dedizierter Ansprechpartner',
      'Custom Templates',
    ],
    cta: 'Kontakt aufnehmen',
    highlighted: false,
  },
];

export const PricingPreview = () => {
  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8 bg-background">
      <div className="mx-auto max-w-6xl">
        {/* Section Header */}
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Transparente Preise
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Einzelaufträge ohne Abo – zahlen Sie nur, was Sie brauchen
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid gap-8 md:grid-cols-3 items-stretch">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative flex flex-col ${
                plan.highlighted
                  ? 'border-primary shadow-lg scale-105'
                  : 'border-border/50'
              }`}
            >
              {plan.highlighted && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                  Beliebt
                </Badge>
              )}
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                <CardDescription className="mb-4">{plan.description}</CardDescription>
                <div className="flex items-baseline justify-center gap-2">
                  {plan.price === 'Auf Anfrage' ? (
                    <span className="text-3xl font-bold">{plan.price}</span>
                  ) : (
                    <>
                      <span className="text-4xl font-bold">{plan.price}€</span>
                      {plan.period && <span className="text-muted-foreground">/ {plan.period}</span>}
                    </>
                  )}
                </div>
                <div className="mt-2 text-primary font-semibold">{plan.emails}</div>
              </CardHeader>
              <CardContent className="flex flex-col flex-grow">
                <ul className="space-y-3 mb-8 flex-grow">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" aria-hidden="true" />
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  asChild
                  variant={plan.highlighted ? 'default' : 'outline'}
                  size="lg"
                  className="w-full"
                >
                  <Link to={plan.name === 'Enterprise' ? '/contact' : '/contact'}>
                    {plan.cta}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Additional Info */}
        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Kein Abo notwendig. Sie bestellen, wir liefern. Bei Fragen beraten wir Sie gerne.
          </p>
          <Button variant="link" asChild>
            <Link to="/pricing">Alle Details ansehen →</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};
