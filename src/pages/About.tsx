import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Target, Lightbulb, Users } from 'lucide-react';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { Footer } from '@/components/landing/Footer';

const values = [
  {
    icon: Target,
    title: 'Effizienz',
    description: 'Wir automatisieren repetitive Aufgaben, damit Sie sich auf das Wesentliche konzentrieren können.',
  },
  {
    icon: Lightbulb,
    title: 'Innovation',
    description: 'Wir nutzen modernste KI-Technologie, um Ihnen einen Wettbewerbsvorteil zu verschaffen.',
  },
  {
    icon: Users,
    title: 'Partnerschaft',
    description: 'Ihr Erfolg ist unser Erfolg. Wir unterstützen Sie auf jedem Schritt Ihrer Reise.',
  },
];

const About = () => {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <LandingHeader />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="px-4 py-20 sm:px-6 lg:px-8 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
          <div className="mx-auto max-w-4xl">
            <Button variant="ghost" asChild className="mb-8">
              <Link to="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Zurück zur Startseite
              </Link>
            </Button>

            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-6">
              Über Cold Calling
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Wir revolutionieren die Kaltakquise durch den intelligenten Einsatz von KI-Technologie.
              Unsere Mission ist es, Vertriebsteams zu befähigen, mehr in weniger Zeit zu erreichen.
            </p>
          </div>
        </section>

        {/* Mission Section */}
        <section className="px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-12 lg:grid-cols-2 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-6">Unsere Mission</h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    Kaltakquise ist zeitaufwendig, repetitiv und oft frustrierend. Wir haben Cold Calling 
                    entwickelt, um diesen Prozess zu revolutionieren.
                  </p>
                  <p>
                    Mit unseren vier KI-Workflows – Finder Felix, Analyse Anna, Pitch Paul und Branding Britta – 
                    automatisieren wir den gesamten Akquise-Prozess von der Recherche bis zum perfekten E-Mail-Text.
                  </p>
                  <p>
                    Unser Ziel ist es, dass Vertriebsteams sich auf das konzentrieren können, was wirklich 
                    zählt: Beziehungen aufbauen und Deals abschließen.
                  </p>
                </div>
              </div>
              <div className="relative">
                <div className="aspect-square rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <div className="text-6xl font-bold text-primary">4</div>
                    <div className="text-xl font-semibold">KI-Workflows</div>
                    <div className="text-muted-foreground">Arbeiten für Sie</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="px-4 py-20 sm:px-6 lg:px-8 bg-muted/30">
          <div className="mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Unsere Werte</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Diese Prinzipien leiten uns bei allem, was wir tun
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              {values.map((value) => {
                const Icon = value.icon;
                return (
                  <Card key={value.title} className="border-border/50">
                    <CardHeader>
                      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                        <Icon className="h-6 w-6 text-primary" aria-hidden="true" />
                      </div>
                      <CardTitle>{value.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription>{value.description}</CardDescription>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold mb-6">
              Bereit, Cold Calling auszuprobieren?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Starten Sie noch heute und erleben Sie, wie KI Ihre Kaltakquise transformiert.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link to="/auth">Kostenlos starten</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/contact">Kontakt aufnehmen</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default About;
