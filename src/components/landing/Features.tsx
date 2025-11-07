import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Brain, Mail, Sparkles } from 'lucide-react';

const features = [
  {
    icon: Search,
    title: 'Finder Felix',
    description: 'Webscraping der Gelben Seiten',
    details: 'Felix durchsucht automatisch die Gelben Seiten nach Firmen in bestimmten Branchen, Städten oder Bundesländern. Alle relevanten Kontaktdaten werden direkt in Ihr Projekt importiert.',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  {
    icon: Brain,
    title: 'Analyse Anna',
    description: 'KI-basierte Website-Analyse',
    details: 'Anna analysiert die Websites der gefundenen Firmen mit Firecrawl und GPT-4. Sie erkennt Geschäftsmodelle, Zielgruppen, Pain Points und erstellt detaillierte Analysen für personalisierte Ansprache.',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
  {
    icon: Mail,
    title: 'Pitch Paul',
    description: 'Personalisierte E-Mail-Generierung',
    details: 'Paul erstellt auf Basis der Analysen vollständig personalisierte Sales-E-Mails. Jede E-Mail ist individuell auf die Firma zugeschnitten und kann mit einem Klick versendet werden.',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
  },
  {
    icon: Sparkles,
    title: 'Branding Britta',
    description: 'E-Mail-Optimierung durch KI',
    details: 'Britta verbessert Ihre E-Mails mit KI-gestütztem Copywriting. Sie optimiert Betreffzeilen, Ansprache und Call-to-Actions für maximale Öffnungs- und Klickraten.',
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
  },
];

export const Features = () => {
  return (
    <section id="features" className="px-4 py-20 sm:px-6 lg:px-8 bg-muted/30">
      <div className="mx-auto max-w-6xl">
        {/* Section Header */}
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Ihre KI-Assistenten für Sales
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Vier spezialisierte KI-Workflows arbeiten Hand in Hand, um Ihre Kaltakquise zu automatisieren
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title} className="border-border/50 hover:border-primary/20 transition-colors">
                <CardHeader>
                  <div className={`inline-flex h-12 w-12 items-center justify-center rounded-lg ${feature.bgColor} mb-4`}>
                    <Icon className={`h-6 w-6 ${feature.color}`} />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.details}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* How it works */}
        <div className="mt-16 text-center">
          <h3 className="text-2xl font-bold mb-8">So funktioniert's</h3>
          <div className="grid gap-6 md:grid-cols-4 max-w-5xl mx-auto">
            <div className="space-y-2">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold mb-3">
                1
              </div>
              <h4 className="font-semibold">Projekt erstellen</h4>
              <p className="text-sm text-muted-foreground">
                Legen Sie ein neues Projekt für Ihre Kampagne an
              </p>
            </div>
            <div className="space-y-2">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold mb-3">
                2
              </div>
              <h4 className="font-semibold">Felix starten</h4>
              <p className="text-sm text-muted-foreground">
                Definieren Sie Branche und Region für die Firmensuche
              </p>
            </div>
            <div className="space-y-2">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold mb-3">
                3
              </div>
              <h4 className="font-semibold">Anna analysieren</h4>
              <p className="text-sm text-muted-foreground">
                Lassen Sie Websites automatisch analysieren
              </p>
            </div>
            <div className="space-y-2">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold mb-3">
                4
              </div>
              <h4 className="font-semibold">Paul versenden</h4>
              <p className="text-sm text-muted-foreground">
                Personalisierte E-Mails generieren und versenden
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
