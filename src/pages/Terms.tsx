import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { Footer } from '@/components/landing/Footer';

const Terms = () => {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <LandingHeader />

      <main className="flex-1">
        <div className="container mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <Button variant="ghost" asChild className="mb-8">
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Zurück zur Startseite
            </Link>
          </Button>

          <h1 className="text-4xl font-bold mb-4">Allgemeine Geschäftsbedingungen (AGB)</h1>
          <p className="text-sm text-muted-foreground mb-8">
            Stand: {new Date().toLocaleDateString('de-DE')}
          </p>

          <div className="prose dark:prose-invert max-w-none">
            <h2>§ 1 Geltungsbereich</h2>
            <p>
              Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für alle Verträge über die Nutzung
              der Plattform "Cold Calling" zwischen der Cold Calling GmbH (nachfolgend "Anbieter")
              und dem Kunden.
            </p>

            <h2>§ 2 Vertragsgegenstand</h2>
            <p>
              Der Anbieter stellt dem Kunden eine webbasierte Software-Plattform zur Verfügung, die
              KI-gestützte Workflows für die Kaltakquise bereitstellt. Der Funktionsumfang richtet
              sich nach dem jeweils gebuchten Tarif.
            </p>

            <h3>2.1 Leistungen</h3>
            <ul>
              <li>Bereitstellung der Software-Plattform über das Internet</li>
              <li>Zugang zu den KI-Workflows (Finder Felix, Analyse Anna, Pitch Paul, Branding Britta)</li>
              <li>Speicherung der Kundendaten gemäß DSGVO</li>
              <li>Technischer Support gemäß gebuchtem Tarif</li>
            </ul>

            <h2>§ 3 Vertragsschluss</h2>
            <p>
              Der Vertrag kommt durch die Registrierung des Kunden auf der Plattform und die
              anschließende Bestätigung durch den Anbieter zustande. Mit der Registrierung erkennt
              der Kunde diese AGB an.
            </p>

            <h2>§ 4 Nutzungsrechte</h2>
            <p>
              Der Anbieter räumt dem Kunden ein nicht-exklusives, nicht übertragbares Nutzungsrecht
              an der Software für die Dauer des Vertrages ein. Der Kunde darf die Software nur für
              eigene geschäftliche Zwecke nutzen.
            </p>

            <h2>§ 5 Preise und Zahlung</h2>
            <p>
              Die Preise richten sich nach der jeweils aktuellen Preisliste auf der Website. Alle
              Preise verstehen sich zuzüglich der gesetzlichen Mehrwertsteuer.
            </p>

            <h3>5.1 Zahlungsbedingungen</h3>
            <ul>
              <li>Die Zahlung erfolgt monatlich im Voraus</li>
              <li>Die erste Zahlung wird nach Ablauf der kostenlosen Testphase fällig</li>
              <li>Akzeptierte Zahlungsmethoden: Kreditkarte, PayPal, SEPA-Lastschrift</li>
            </ul>

            <h2>§ 6 Kostenlose Testphase</h2>
            <p>
              Neukunden erhalten eine 14-tägige kostenlose Testphase. Während dieser Zeit kann der
              Kunde den vollen Funktionsumfang des gebuchten Tarifs nutzen. Kündigt der Kunde nicht
              vor Ablauf der Testphase, wird automatisch der gewählte Tarif aktiviert und der erste
              Rechnungsbetrag fällig.
            </p>

            <h2>§ 7 Vertragslaufzeit und Kündigung</h2>
            <p>
              Der Vertrag hat eine Mindestlaufzeit von einem Monat und verlängert sich automatisch
              um jeweils einen weiteren Monat, wenn er nicht gekündigt wird.
            </p>

            <h3>7.1 Ordentliche Kündigung</h3>
            <p>
              Beide Parteien können den Vertrag mit einer Frist von 14 Tagen zum Monatsende kündigen.
              Die Kündigung muss schriftlich oder per E-Mail erfolgen.
            </p>

            <h3>7.2 Außerordentliche Kündigung</h3>
            <p>
              Das Recht zur außerordentlichen Kündigung aus wichtigem Grund bleibt unberührt.
            </p>

            <h2>§ 8 Pflichten des Kunden</h2>
            <p>
              Der Kunde verpflichtet sich:
            </p>
            <ul>
              <li>Die Plattform nur für rechtmäßige Zwecke zu nutzen</li>
              <li>Seine Zugangsdaten geheim zu halten</li>
              <li>Die geltenden Datenschutzbestimmungen einzuhalten</li>
              <li>Keine unzulässigen Inhalte zu speichern oder zu versenden</li>
            </ul>

            <h2>§ 9 Verfügbarkeit</h2>
            <p>
              Der Anbieter strebt eine Verfügbarkeit der Plattform von 99% im Jahresmittel an.
              Ausgenommen sind Zeiten für planmäßige Wartungsarbeiten.
            </p>

            <h2>§ 10 Datenschutz</h2>
            <p>
              Der Anbieter verarbeitet personenbezogene Daten des Kunden gemäß den Bestimmungen der
              DSGVO und des BDSG. Weitere Informationen finden sich in der Datenschutzerklärung.
            </p>

            <h2>§ 11 Haftung</h2>
            <p>
              Der Anbieter haftet unbeschränkt für Schäden aus der Verletzung des Lebens, des Körpers
              oder der Gesundheit, die auf einer vorsätzlichen oder fahrlässigen Pflichtverletzung
              beruhen. Im Übrigen haftet der Anbieter nur bei Vorsatz und grober Fahrlässigkeit.
            </p>

            <h2>§ 12 Änderungen der AGB</h2>
            <p>
              Der Anbieter behält sich vor, diese AGB zu ändern. Änderungen werden dem Kunden
              mindestens einen Monat vor ihrem Inkrafttreten per E-Mail mitgeteilt. Widerspricht der
              Kunde nicht innerhalb von 14 Tagen nach Zugang der Mitteilung, gelten die geänderten
              AGB als angenommen.
            </p>

            <h2>§ 13 Schlussbestimmungen</h2>
            <p>
              Es gilt das Recht der Bundesrepublik Deutschland. Gerichtsstand für alle Streitigkeiten
              aus diesem Vertrag ist der Sitz des Anbieters, sofern der Kunde Kaufmann ist.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Terms;
