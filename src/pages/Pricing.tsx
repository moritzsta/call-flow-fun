import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, ArrowLeft, X } from 'lucide-react';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { Footer } from '@/components/landing/Footer';

const plans = [
  {
    name: 'Starter',
    price: '49',
    period: 'Monat',
    description: 'Perfekt für kleine Teams',
    features: [
      { text: 'Bis zu 100 Firmen/Monat', included: true },
      { text: 'Alle 4 KI-Workflows', included: true },
      { text: 'E-Mail-Support', included: true },
      { text: 'DSGVO-konform', included: true },
      { text: 'Custom Templates', included: false },
      { text: 'Team-Funktionen', included: false },
      { text: 'Priority Support', included: false },
      { text: 'SLA-Garantie', included: false },
    ],
    cta: 'Kostenlos testen',
    highlighted: false,
  },
  {
    name: 'Professional',
    price: '149',
    period: 'Monat',
    description: 'Für wachsende Unternehmen',
    features: [
      { text: 'Bis zu 1.000 Firmen/Monat', included: true },
      { text: 'Alle 4 KI-Workflows', included: true },
      { text: 'E-Mail-Support', included: true },
      { text: 'DSGVO-konform', included: true },
      { text: 'Custom Templates', included: true },
      { text: 'Team-Funktionen', included: true },
      { text: 'Priority Support', included: true },
      { text: 'SLA-Garantie', included: false },
    ],
    cta: 'Jetzt starten',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Individuell',
    period: '',
    description: 'Für große Organisationen',
    features: [
      { text: 'Unbegrenzte Firmen', included: true },
      { text: 'Alle 4 KI-Workflows', included: true },
      { text: 'E-Mail-Support', included: true },
      { text: 'DSGVO-konform', included: true },
      { text: 'Custom Templates', included: true },
      { text: 'Team-Funktionen', included: true },
      { text: 'Priority Support', included: true },
      { text: 'SLA-Garantie', included: true },
    ],
    cta: 'Kontakt',
    highlighted: false,
  },
];

const Pricing = () => {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <LandingHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="px-4 py-20 sm:px-6 lg:px-8 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
          <div className="mx-auto max-w-4xl text-center">
            <Button variant="ghost" asChild className="mb-8">
              <Link to="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Zurück zur Startseite
              </Link>
            </Button>

            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-6">
              Transparente Preise
            </h1>
            <p className="text-xl text-muted-foreground">
              Wählen Sie den Plan, der perfekt zu Ihrem Unternehmen passt. 
              Alle Pläne beinhalten eine 14-tägige kostenlose Testphase.
            </p>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-8 lg:grid-cols-3 items-start">
              {plans.map((plan) => (
                <Card
                  key={plan.name}
                  className={`relative flex flex-col ${
                    plan.highlighted
                      ? 'border-primary shadow-xl scale-105'
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
                      {plan.price === 'Individuell' ? (
                        <span className="text-4xl font-bold">{plan.price}</span>
                      ) : (
                        <>
                          <span className="text-4xl font-bold">{plan.price}€</span>
                          <span className="text-muted-foreground">/ {plan.period}</span>
                        </>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-col flex-grow">
                    <ul className="space-y-3 mb-8 flex-grow">
                      {plan.features.map((feature) => (
                        <li key={feature.text} className="flex items-start gap-2">
                          {feature.included ? (
                            <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" aria-hidden="true" />
                          ) : (
                            <X className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" aria-hidden="true" />
                          )}
                          <span className={`text-sm ${feature.included ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {feature.text}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      asChild
                      variant={plan.highlighted ? 'default' : 'outline'}
                      size="lg"
                      className="w-full"
                    >
                      <Link to={plan.name === 'Enterprise' ? '/contact' : '/auth'}>
                        {plan.cta}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="px-4 py-20 sm:px-6 lg:px-8 bg-muted/30">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-3xl font-bold text-center mb-12">Häufige Fragen zu Preisen</h2>
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Kann ich monatlich kündigen?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Ja, alle Pläne können monatlich gekündigt werden. Es gibt keine Mindestlaufzeit.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Was passiert nach der Testphase?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Nach den 14 Tagen beginnt automatisch Ihr gewählter Plan. Sie können jederzeit upgraden oder downgraden.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Welche Zahlungsmethoden akzeptieren Sie?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Wir akzeptieren alle gängigen Kreditkarten, PayPal und SEPA-Lastschrift.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Pricing;
