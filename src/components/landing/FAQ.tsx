import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqs = [
  {
    question: 'Wie funktioniert die KI-Automatisierung?',
    answer:
      'Unsere KI-Workflows analysieren automatisch Firmen-Websites, extrahieren relevante Informationen und generieren personalisierte E-Mails basierend auf den Erkenntnissen. Finder Felix sucht Firmen, Analyse Anna analysiert deren Websites, Pitch Paul erstellt personalisierte E-Mails und Branding Britta optimiert Ihre Nachrichten.',
  },
  {
    question: 'Ist Cold Calling DSGVO-konform?',
    answer:
      'Ja, alle Daten werden in Deutschland gespeichert und verarbeitet. Wir halten uns strikt an die DSGVO-Vorgaben und alle europäischen Datenschutzrichtlinien. Ihre Daten und die Ihrer Kontakte sind bei uns sicher.',
  },
  {
    question: 'Kann ich eigene E-Mail-Templates verwenden?',
    answer:
      'Absolut! Sie können eigene Templates erstellen oder unsere KI-generierten Templates als Ausgangspunkt nutzen. Die Templates sind vollständig anpassbar und können mit Platzhaltern für personalisierte Informationen versehen werden.',
  },
  {
    question: 'Wie lange dauert die Einrichtung?',
    answer:
      'Die Einrichtung dauert ca. 10 Minuten. Danach können Sie sofort Ihren ersten Workflow starten. Wir bieten zudem eine ausführliche Dokumentation und Support, um Ihnen den Einstieg zu erleichtern.',
  },
  {
    question: 'Gibt es eine kostenlose Testversion?',
    answer:
      'Ja, Sie können Cold Calling 14 Tage kostenlos testen. Keine Kreditkarte erforderlich. Sie erhalten vollen Zugriff auf alle Features und können die Plattform in Ruhe ausprobieren.',
  },
  {
    question: 'Welche E-Mail-Provider werden unterstützt?',
    answer:
      'Cold Calling funktioniert mit allen gängigen E-Mail-Providern. Sie benötigen lediglich SMTP-Zugangsdaten, um E-Mails über Ihren eigenen Server zu versenden.',
  },
  {
    question: 'Kann ich mehrere Projekte parallel betreiben?',
    answer:
      'Ja, Sie können beliebig viele Projekte erstellen und parallel betreiben. Jedes Projekt kann unterschiedliche Branchen, Regionen und E-Mail-Templates verwenden.',
  },
  {
    question: 'Wie schnell sind die KI-Workflows?',
    answer:
      'Die Geschwindigkeit hängt von der Anzahl der zu analysierenden Firmen ab. Im Durchschnitt analysiert Analyse Anna etwa 10-20 Websites pro Minute. Pitch Paul generiert E-Mails in Echtzeit.',
  },
];

export const FAQ = () => {
  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8 bg-muted/30">
      <div className="mx-auto max-w-4xl">
        {/* Section Header */}
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Häufig gestellte Fragen
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Alles, was Sie über Cold Calling wissen müssen
          </p>
        </div>

        {/* FAQ Accordion */}
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-left">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};
