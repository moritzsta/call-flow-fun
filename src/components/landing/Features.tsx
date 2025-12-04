import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardList, Search, PenTool, FileSpreadsheet } from 'lucide-react';

const steps = [
  {
    icon: ClipboardList,
    title: 'Auftrag erteilen',
    description: 'Branche, Stadt, Anzahl E-Mails',
    details: 'Sie nennen uns einfach Ihre Zielbranche (z.B. Restaurants, Handwerker, Hotels) und die Stadt oder Region. Dazu Ihr Angebot in wenigen Sätzen.',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  {
    icon: Search,
    title: 'Wir recherchieren',
    description: 'Firmen in Ihrer Zielregion finden',
    details: 'Unser Team findet alle relevanten Firmen in Ihrer Zielbranche und Region. Kontaktdaten, Websites und Ansprechpartner werden sorgfältig erfasst.',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
  {
    icon: PenTool,
    title: 'Wir schreiben',
    description: 'Personalisierte E-Mail für jede Firma',
    details: 'Unsere KI analysiert jede Firma und erstellt eine individuell zugeschnittene Sales-E-Mail. Kein Copy-Paste – jede E-Mail ist ein Unikat.',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
  },
  {
    icon: FileSpreadsheet,
    title: 'Sie erhalten',
    description: 'Fertige E-Mails als CSV/Excel',
    details: 'Sie bekommen alle E-Mails übersichtlich als CSV oder Excel-Datei. Versandbereit mit Empfänger, Betreff und personalisiertem Text.',
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
            So funktioniert's
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            In 4 einfachen Schritten zu Ihren personalisierten Sales-E-Mails
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <Card key={step.title} className="border-border/50 hover:border-primary/20 transition-colors relative">
                {/* Step Number */}
                <div className="absolute -top-3 -left-3 h-8 w-8 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center text-sm">
                  {index + 1}
                </div>
                <CardHeader>
                  <div className={`inline-flex h-12 w-12 items-center justify-center rounded-lg ${step.bgColor} mb-4`}>
                    <Icon className={`h-6 w-6 ${step.color}`} />
                  </div>
                  <CardTitle className="text-xl">{step.title}</CardTitle>
                  <CardDescription>{step.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.details}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Example Use Cases */}
        <div className="mt-16 text-center">
          <h3 className="text-2xl font-bold mb-8">Beispiele aus der Praxis</h3>
          <div className="grid gap-6 md:grid-cols-3 max-w-4xl mx-auto">
            <div className="p-6 rounded-lg bg-card border border-border/50">
              <div className="text-primary font-semibold mb-2">Webdesigner</div>
              <p className="text-sm text-muted-foreground">
                sucht <strong>Restaurants</strong> in <strong>Hamburg</strong>
              </p>
            </div>
            <div className="p-6 rounded-lg bg-card border border-border/50">
              <div className="text-primary font-semibold mb-2">Steuerberater</div>
              <p className="text-sm text-muted-foreground">
                sucht <strong>Handwerksbetriebe</strong> in <strong>München</strong>
              </p>
            </div>
            <div className="p-6 rounded-lg bg-card border border-border/50">
              <div className="text-primary font-semibold mb-2">Reinigungsservice</div>
              <p className="text-sm text-muted-foreground">
                sucht <strong>Hotels</strong> in <strong>Berlin</strong>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
