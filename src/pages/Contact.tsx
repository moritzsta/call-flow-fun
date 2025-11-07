import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Mail, MessageSquare } from 'lucide-react';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { Footer } from '@/components/landing/Footer';
import { toast } from 'sonner';

const Contact = () => {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    toast.success('Nachricht gesendet! Wir melden uns bald bei Ihnen.');
  };

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
              Kontaktieren Sie uns
            </h1>
            <p className="text-xl text-muted-foreground">
              Haben Sie Fragen? Wir helfen Ihnen gerne weiter.
            </p>
          </div>
        </section>

        {/* Contact Form Section */}
        <section className="px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl grid gap-12 lg:grid-cols-2">
            {/* Contact Form */}
            <Card>
              <CardHeader>
                <CardTitle>Nachricht senden</CardTitle>
                <CardDescription>
                  Füllen Sie das Formular aus und wir melden uns innerhalb von 24 Stunden.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="Max Mustermann"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">E-Mail *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="max@example.com"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company">Firma</Label>
                    <Input
                      id="company"
                      name="company"
                      placeholder="Ihre Firma GmbH"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">Betreff *</Label>
                    <Select name="subject" required>
                      <SelectTrigger id="subject">
                        <SelectValue placeholder="Wählen Sie einen Betreff" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="support">Support</SelectItem>
                        <SelectItem value="sales">Vertrieb</SelectItem>
                        <SelectItem value="partnership">Partnerschaft</SelectItem>
                        <SelectItem value="other">Sonstiges</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Nachricht *</Label>
                    <Textarea
                      id="message"
                      name="message"
                      placeholder="Ihre Nachricht..."
                      rows={6}
                      required
                    />
                  </div>

                  <Button type="submit" size="lg" className="w-full">
                    Nachricht senden
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Contact Info */}
            <div className="space-y-8">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Mail className="h-5 w-5 text-primary" aria-hidden="true" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">E-Mail</CardTitle>
                      <CardDescription>Schreiben Sie uns direkt</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <a
                    href="mailto:support@coldcalling.de"
                    className="text-primary hover:underline"
                  >
                    support@coldcalling.de
                  </a>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <MessageSquare className="h-5 w-5 text-primary" aria-hidden="true" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Support</CardTitle>
                      <CardDescription>Schnelle Hilfe bei Fragen</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Unser Support-Team ist Mo-Fr von 9:00 bis 18:00 Uhr für Sie da.
                  </p>
                  <Button variant="outline" asChild>
                    <Link to="/auth">Zum Dashboard →</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-muted/50">
                <CardHeader>
                  <CardTitle className="text-lg">Enterprise Anfragen</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Für individuelle Enterprise-Lösungen mit maßgeschneiderten Features
                    kontaktieren Sie unser Sales-Team.
                  </p>
                  <Button asChild>
                    <a href="mailto:sales@coldcalling.de">
                      Sales kontaktieren
                    </a>
                  </Button>
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

export default Contact;
