import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqs = [
  {
    question: 'Was braucht ihr von mir?',
    answer:
      'Nur drei Dinge: Ihre Zielbranche (z.B. Restaurants, Handwerker, Hotels), die Stadt oder Region, und eine kurze Beschreibung Ihres Angebots. Das reicht uns, um loszulegen.',
  },
  {
    question: 'Wie schnell bekomme ich die E-Mails?',
    answer:
      'Standard-Lieferzeit ist 72 Stunden. Mit dem Business-Paket bekommen Sie Priority-Bearbeitung und erhalten Ihre E-Mails innerhalb von 48 Stunden.',
  },
  {
    question: 'In welchem Format erhalte ich die E-Mails?',
    answer:
      'Sie erhalten alle E-Mails als übersichtliche CSV- oder Excel-Datei. Jede Zeile enthält Empfänger-E-Mail, Betreff und den personalisierten E-Mail-Text – versandbereit für Ihr E-Mail-Tool.',
  },
  {
    question: 'Kann ich die E-Mails vorher prüfen?',
    answer:
      'Ja, im Business-Paket ist eine Revision inklusive. Sie können Feedback geben und wir passen die E-Mails entsprechend an.',
  },
  {
    question: 'Muss ich ein Abo abschließen?',
    answer:
      'Nein, wir arbeiten mit Einzelaufträgen. Sie bestellen ein Paket, wir liefern. Keine monatlichen Gebühren, keine Kündigungsfristen.',
  },
  {
    question: 'Wie personalisiert sind die E-Mails wirklich?',
    answer:
      'Jede E-Mail wird individuell auf die Firma zugeschnitten. Unsere KI analysiert die Website der Firma und bezieht sich konkret auf deren Angebot, Branche und Besonderheiten – kein Copy-Paste.',
  },
  {
    question: 'Ist das DSGVO-konform?',
    answer:
      'Ja, alle Daten werden in Deutschland gespeichert und verarbeitet. Wir halten uns strikt an die DSGVO-Vorgaben.',
  },
  {
    question: 'Was kostet eine einzelne E-Mail?',
    answer:
      'Im Starter-Paket (25 E-Mails für 199€) kostet eine E-Mail ca. 8€. Im Business-Paket (100 E-Mails für 499€) nur noch ca. 5€ pro E-Mail – inklusive Recherche, Analyse und Personalisierung.',
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
            Alles, was Sie über unseren E-Mail-Service wissen müssen
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
