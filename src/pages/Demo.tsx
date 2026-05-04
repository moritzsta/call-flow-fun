import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { Footer } from '@/components/landing/Footer';
import {
  ArrowRight,
  Check,
  Loader2,
  Search,
  Brain,
  Mail,
  Sparkles,
  Building2,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  DEMO_PROJECT_ID,
  DEMO_USER_ID,
  DEMO_MAX_COMPANIES,
  DEMO_DUMMY_DATA,
} from '@/lib/demo';

type Step = 'intro' | 'felix' | 'anna' | 'paul' | 'done';

interface DemoCompany {
  id: string;
  company: string;
  city: string | null;
  industry: string | null;
  website: string | null;
  email: string | null;
  analysis: any;
  status: string;
}

interface DemoEmail {
  id: string;
  recipient_email: string;
  subject: string;
  body: string;
  status: string;
}

const STEPS: { id: Step; label: string; icon: any }[] = [
  { id: 'felix', label: 'Finder Felix', icon: Search },
  { id: 'anna', label: 'Analyse Anna', icon: Brain },
  { id: 'paul', label: 'Pitch Paul', icon: Mail },
];

export default function Demo() {
  const [step, setStep] = useState<Step>('intro');
  const [running, setRunning] = useState<Step | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Live data
  const [companies, setCompanies] = useState<DemoCompany[]>([]);
  const [emails, setEmails] = useState<DemoEmail[]>([]);

  // Felix form
  const [felixState, setFelixState] = useState<string>(DEMO_DUMMY_DATA.felix.state);
  const [felixCity, setFelixCity] = useState<string>(DEMO_DUMMY_DATA.felix.city);
  const [felixCategory, setFelixCategory] = useState<string>(DEMO_DUMMY_DATA.felix.category);

  // Paul form
  const [paulGoal, setPaulGoal] = useState<string>(DEMO_DUMMY_DATA.paul.userGoal);

  // ----- Live polling for companies/emails while running -----
  useEffect(() => {
    if (step === 'intro') return;

    const fetchData = async () => {
      const [companiesRes, emailsRes] = await Promise.all([
        supabase
          .from('companies')
          .select('id, company, city, industry, website, email, analysis, status')
          .eq('project_id', DEMO_PROJECT_ID)
          .order('created_at', { ascending: true })
          .limit(DEMO_MAX_COMPANIES),
        supabase
          .from('project_emails')
          .select('id, recipient_email, subject, body, status')
          .eq('project_id', DEMO_PROJECT_ID)
          .order('created_at', { ascending: true })
          .limit(DEMO_MAX_COMPANIES),
      ]);
      if (companiesRes.data) setCompanies(companiesRes.data as DemoCompany[]);
      if (emailsRes.data) setEmails(emailsRes.data as DemoEmail[]);
    };

    fetchData();
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, [step]);

  // ----- Reset demo project before run -----
  const resetDemoData = async () => {
    await supabase.from('project_emails').delete().eq('project_id', DEMO_PROJECT_ID);
    await supabase.from('companies').delete().eq('project_id', DEMO_PROJECT_ID);
    await supabase.from('n8n_workflow_states').delete().eq('project_id', DEMO_PROJECT_ID);
    setCompanies([]);
    setEmails([]);
  };

  const triggerWorkflow = async (
    workflowName: 'finder_felix' | 'analyse_anna' | 'pitch_paul',
    triggerData: Record<string, any>
  ) => {
    // Insert workflow state row (Public RLS allows this for the demo project)
    const { data: ws, error: insertError } = await supabase
      .from('n8n_workflow_states')
      .insert({
        project_id: DEMO_PROJECT_ID,
        user_id: DEMO_USER_ID,
        workflow_name: workflowName,
        status: 'pending',
        trigger_data: triggerData,
      })
      .select('id')
      .single();

    if (insertError || !ws) {
      throw new Error(insertError?.message || 'Konnte Workflow-Status nicht anlegen.');
    }

    // Trigger via public edge function
    const { data, error: fnError } = await supabase.functions.invoke('demo-trigger-workflow', {
      body: {
        workflow_name: workflowName,
        workflow_id: ws.id,
        trigger_data: triggerData,
      },
    });

    if (fnError) throw new Error(fnError.message);
    return data;
  };

  // ----- Step handlers -----
  const startDemo = async () => {
    setError(null);
    setStep('felix');
    try {
      await resetDemoData();
    } catch (e) {
      console.error('[demo] reset failed', e);
    }
  };

  const runFelix = async () => {
    setError(null);
    setRunning('felix');
    try {
      await resetDemoData();
      await triggerWorkflow('finder_felix', {
        state: felixState,
        city: felixCity,
        category: felixCategory,
        maxCompanies: DEMO_MAX_COMPANIES,
        message: `Suche ${DEMO_MAX_COMPANIES} ${felixCategory} in ${felixCity}, ${felixState}`,
      });
      toast.success('Finder Felix gestartet — Firmen werden gesucht (max. 10).');
      // Wait a bit for results to come in via polling
      setTimeout(() => setRunning(null), 2000);
    } catch (e: any) {
      setError(e.message);
      setRunning(null);
    }
  };

  const runAnna = async () => {
    setError(null);
    setRunning('anna');
    try {
      await triggerWorkflow('analyse_anna', {
        analyseInstruction: DEMO_DUMMY_DATA.anna.analyseInstruction,
        analyseInstructionName: DEMO_DUMMY_DATA.anna.analyseInstructionName,
        userGoal: DEMO_DUMMY_DATA.anna.userGoal,
        maxCompanies: DEMO_MAX_COMPANIES,
      });
      toast.success('Analyse Anna gestartet — Firmen werden analysiert.');
      setTimeout(() => setRunning(null), 2000);
    } catch (e: any) {
      setError(e.message);
      setRunning(null);
    }
  };

  const runPaul = async () => {
    setError(null);
    setRunning('paul');
    try {
      await triggerWorkflow('pitch_paul', {
        userGoal: paulGoal,
        sellerName: DEMO_DUMMY_DATA.paul.sellerName,
        sellerCompany: DEMO_DUMMY_DATA.paul.sellerCompany,
        sellerPhone: DEMO_DUMMY_DATA.paul.sellerPhone,
        sellerAddress: DEMO_DUMMY_DATA.paul.sellerAddress,
        sellerWebsite: DEMO_DUMMY_DATA.paul.sellerWebsite,
        sellerContact: DEMO_DUMMY_DATA.paul.sellerContact,
        templateEnumName: DEMO_DUMMY_DATA.paul.templateEnumName,
        maxCompanies: DEMO_MAX_COMPANIES,
      });
      toast.success('Pitch Paul gestartet — E-Mails werden generiert.');
      setTimeout(() => setRunning(null), 2000);
    } catch (e: any) {
      setError(e.message);
      setRunning(null);
    }
  };

  const currentStepIndex = STEPS.findIndex((s) => s.id === step);
  const analyzedCount = useMemo(
    () => companies.filter((c) => c.analysis && Object.keys(c.analysis || {}).length > 0).length,
    [companies]
  );

  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />

      <main className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Hero */}
        <div className="text-center space-y-4 mb-12">
          <Badge variant="secondary" className="gap-2">
            <Sparkles className="h-3 w-3" /> Live-Demo
          </Badge>
          <h1 className="text-4xl font-bold sm:text-5xl">
            Erleben Sie unsere Workflows live
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Drei KI-Agenten — Finder, Analyse, Pitch — finden, verstehen und kontaktieren Ihre
            Zielkunden vollautomatisch. Begrenzt auf {DEMO_MAX_COMPANIES} Firmen pro Demo-Lauf.
          </p>
        </div>

        {/* Stepper */}
        {step !== 'intro' && (
          <div className="flex items-center justify-center gap-2 mb-8">
            {STEPS.map((s, idx) => {
              const Icon = s.icon;
              const isActive = s.id === step;
              const isDone = idx < currentStepIndex;
              return (
                <div key={s.id} className="flex items-center">
                  <div
                    className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${
                      isActive
                        ? 'border-primary bg-primary/10 text-primary'
                        : isDone
                        ? 'border-green-500/40 bg-green-500/10 text-green-600 dark:text-green-400'
                        : 'border-border text-muted-foreground'
                    }`}
                  >
                    {isDone ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                    <span className="text-sm font-medium">{s.label}</span>
                  </div>
                  {idx < STEPS.length - 1 && (
                    <ArrowRight className="h-4 w-4 mx-2 text-muted-foreground" />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Error */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Fehler</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* INTRO */}
        {step === 'intro' && (
          <Card>
            <CardHeader>
              <CardTitle>So funktioniert die Demo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-3 gap-4">
                {STEPS.map((s) => {
                  const Icon = s.icon;
                  return (
                    <div key={s.id} className="p-4 rounded-lg border bg-muted/30 space-y-2">
                      <Icon className="h-6 w-6 text-primary" />
                      <h3 className="font-semibold">{s.label}</h3>
                      <p className="text-sm text-muted-foreground">
                        {s.id === 'felix' && 'Sucht passende Firmen in Ihrer Zielregion.'}
                        {s.id === 'anna' && 'Analysiert Webseiten und identifiziert Pain Points.'}
                        {s.id === 'paul' && 'Generiert personalisierte Verkaufs-E-Mails.'}
                      </p>
                    </div>
                  );
                })}
              </div>
              <Alert>
                <Sparkles className="h-4 w-4" />
                <AlertDescription>
                  Die Demo verwendet ein gemeinsames Demo-Projekt. Daten werden vor jedem Lauf
                  zurückgesetzt. Es werden <strong>maximal {DEMO_MAX_COMPANIES} Firmen</strong> pro
                  Lauf verarbeitet. <strong>E-Mails werden nicht versendet.</strong>
                </AlertDescription>
              </Alert>
              <Button size="lg" className="w-full" onClick={startDemo}>
                Demo starten <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* FELIX */}
        {step === 'felix' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5 text-primary" />
                Schritt 1: Finder Felix
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Felix sucht passende Firmen anhand Ihrer Vorgaben. Felder sind mit Beispieldaten
                vorbefüllt — Sie können sie anpassen.
              </p>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Bundesland</Label>
                  <Input value={felixState} onChange={(e) => setFelixState(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Stadt</Label>
                  <Input value={felixCity} onChange={(e) => setFelixCity(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Branche / Kategorie</Label>
                  <Input value={felixCategory} onChange={(e) => setFelixCategory(e.target.value)} />
                </div>
              </div>

              <CompanyList companies={companies} />

              <div className="flex gap-3">
                <Button onClick={runFelix} disabled={running === 'felix'} className="flex-1">
                  {running === 'felix' ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sucht Firmen...</>
                  ) : companies.length > 0 ? (
                    <><RotateCcw className="mr-2 h-4 w-4" /> Erneut suchen</>
                  ) : (
                    <><Search className="mr-2 h-4 w-4" /> Felix starten</>
                  )}
                </Button>
                <Button
                  variant="default"
                  disabled={companies.length === 0}
                  onClick={() => setStep('anna')}
                >
                  Weiter zu Anna <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ANNA */}
        {step === 'anna' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                Schritt 2: Analyse Anna
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Anna analysiert die {companies.length} gefundenen Firmen und identifiziert
                Verbesserungspotenziale auf deren Webseiten.
              </p>
              <div className="rounded-lg border p-4 bg-muted/30 space-y-2">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  Analyse-Anweisung
                </div>
                <p className="text-sm">{DEMO_DUMMY_DATA.anna.analyseInstruction}</p>
              </div>

              <CompanyList companies={companies} showAnalysis />

              <div className="text-sm text-muted-foreground">
                Analysiert: <strong>{analyzedCount}</strong> / {companies.length}
              </div>

              <div className="flex gap-3">
                <Button onClick={runAnna} disabled={running === 'anna' || companies.length === 0} className="flex-1">
                  {running === 'anna' ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analysiert...</>
                  ) : analyzedCount > 0 ? (
                    <><RotateCcw className="mr-2 h-4 w-4" /> Erneut analysieren</>
                  ) : (
                    <><Brain className="mr-2 h-4 w-4" /> Anna starten</>
                  )}
                </Button>
                <Button disabled={analyzedCount === 0} onClick={() => setStep('paul')}>
                  Weiter zu Paul <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* PAUL */}
        {step === 'paul' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                Schritt 3: Pitch Paul
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Paul generiert für jede analysierte Firma eine personalisierte E-Mail.
              </p>
              <div className="space-y-2">
                <Label>Ihr Vorhaben / Angebot</Label>
                <Textarea
                  value={paulGoal}
                  onChange={(e) => setPaulGoal(e.target.value)}
                  rows={4}
                />
              </div>

              <EmailList emails={emails} />

              <div className="flex gap-3">
                <Button onClick={runPaul} disabled={running === 'paul' || analyzedCount === 0} className="flex-1">
                  {running === 'paul' ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generiert E-Mails...</>
                  ) : emails.length > 0 ? (
                    <><RotateCcw className="mr-2 h-4 w-4" /> Erneut generieren</>
                  ) : (
                    <><Mail className="mr-2 h-4 w-4" /> Paul starten</>
                  )}
                </Button>
                <Button disabled={emails.length === 0} onClick={() => setStep('done')}>
                  Demo abschließen <Check className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* DONE */}
        {step === 'done' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500" />
                Demo abgeschlossen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-3 gap-4 text-center">
                <div className="p-4 rounded-lg border bg-muted/30">
                  <div className="text-3xl font-bold text-primary">{companies.length}</div>
                  <div className="text-sm text-muted-foreground">Firmen gefunden</div>
                </div>
                <div className="p-4 rounded-lg border bg-muted/30">
                  <div className="text-3xl font-bold text-primary">{analyzedCount}</div>
                  <div className="text-sm text-muted-foreground">Firmen analysiert</div>
                </div>
                <div className="p-4 rounded-lg border bg-muted/30">
                  <div className="text-3xl font-bold text-primary">{emails.length}</div>
                  <div className="text-sm text-muted-foreground">E-Mails erstellt</div>
                </div>
              </div>

              <Alert>
                <Sparkles className="h-4 w-4" />
                <AlertDescription>
                  In der Vollversion verarbeiten wir mehrere hundert Firmen pro Kampagne und
                  versenden die E-Mails automatisch.
                </AlertDescription>
              </Alert>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button asChild size="lg" className="flex-1">
                  <Link to="/contact">Angebot anfordern</Link>
                </Button>
                <Button variant="outline" size="lg" onClick={() => setStep('intro')}>
                  <RotateCcw className="mr-2 h-4 w-4" /> Demo erneut starten
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      <Footer />
    </div>
  );
}

// ----- Subcomponents -----

function CompanyList({ companies, showAnalysis = false }: { companies: DemoCompany[]; showAnalysis?: boolean }) {
  if (companies.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        Noch keine Firmen vorhanden. Klicken Sie auf "Felix starten".
      </div>
    );
  }
  return (
    <div className="space-y-2 max-h-96 overflow-y-auto">
      {companies.map((c) => (
        <div key={c.id} className="rounded-lg border p-3 bg-card">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2 min-w-0">
              <Building2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div className="min-w-0">
                <div className="font-medium truncate">{c.company}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {[c.industry, c.city].filter(Boolean).join(' · ')}
                </div>
                {c.website && (
                  <div className="text-xs text-muted-foreground truncate">{c.website}</div>
                )}
              </div>
            </div>
            {showAnalysis && c.analysis && Object.keys(c.analysis).length > 0 && (
              <Badge variant="secondary" className="shrink-0">
                <Check className="h-3 w-3 mr-1" /> analysiert
              </Badge>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function EmailList({ emails }: { emails: DemoEmail[] }) {
  if (emails.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        Noch keine E-Mails generiert.
      </div>
    );
  }
  return (
    <div className="space-y-3 max-h-[500px] overflow-y-auto">
      {emails.map((e) => (
        <div key={e.id} className="rounded-lg border p-4 bg-card space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs text-muted-foreground truncate">{e.recipient_email}</div>
            <Badge variant="outline" className="shrink-0 text-xs">{e.status}</Badge>
          </div>
          <div className="font-medium text-sm">{e.subject}</div>
          <div className="text-xs text-muted-foreground line-clamp-3 whitespace-pre-wrap">
            {e.body}
          </div>
        </div>
      ))}
    </div>
  );
}
