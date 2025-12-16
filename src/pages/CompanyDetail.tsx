import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Sparkles, Mail, Eye, Edit } from 'lucide-react';
import { useCompany } from '@/hooks/useCompany';
import { CompanyInfo } from '@/components/companies/CompanyInfo';
import { CompanyEditor } from '@/components/companies/CompanyEditor';
import { AnalysisDisplay } from '@/components/companies/AnalysisDisplay';
import { useWorkflowTrigger } from '@/hooks/useWorkflowTrigger';
import { useAuth } from '@/contexts/AuthContext';
import { Company } from '@/hooks/useCompanies';
import { notifyError } from '@/lib/notifications';
import { supabase } from '@/integrations/supabase/client';

export default function CompanyDetail() {
  const { companyId } = useParams<{ companyId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { company, isLoading, updateCompanyStatus, updateCompany, isUpdating } = useCompany(companyId);
  const { triggerWorkflow, isTriggering } = useWorkflowTrigger();
  const [activeTab, setActiveTab] = useState('overview');

  // E-Mails für diese Firma abrufen
  const { data: companyEmails } = useQuery({
    queryKey: ['company-emails', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_emails')
        .select('id, subject, status, created_at')
        .eq('company_id', companyId!)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const handleStatusChange = (newStatus: Company['status']) => {
    if (company) {
      updateCompanyStatus(newStatus);
    }
  };

  const handleAnalyze = () => {
    if (!company || !user) {
      notifyError('Fehler: Firma oder User nicht gefunden');
      return;
    }

    triggerWorkflow({
      workflowName: 'analyse_anna',
      projectId: company.project_id,
      userId: user.id,
      triggerData: {
        company_ids: [company.id],
        instructions: 'Detaillierte Analyse für diese Firma',
      },
    });
  };

  const handleGenerateEmail = () => {
    if (!company || !user) {
      notifyError('Fehler: Firma oder User nicht gefunden');
      return;
    }

    triggerWorkflow({
      workflowName: 'pitch_paul',
      projectId: company.project_id,
      userId: user.id,
      triggerData: {
        company_ids: [company.id],
        instructions: 'Personalisierte E-Mail für diese Firma generieren',
      },
    });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container max-w-7xl py-8">
          <Skeleton className="h-10 w-32 mb-6" />
          <div className="space-y-4">
            <Skeleton className="h-96 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!company) {
    return (
      <Layout>
        <div className="container max-w-7xl py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Firma nicht gefunden</h1>
            <Button onClick={() => navigate(-1)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Zurück
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container max-w-7xl py-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zurück
        </Button>

        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{company.company}</h1>
              {company.industry && (
                <p className="text-muted-foreground">{company.industry}</p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Status:</span>
                <Select
                  value={company.status}
                  onValueChange={(value) =>
                    handleStatusChange(value as Company['status'])
                  }
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="found">Gefunden</SelectItem>
                    <SelectItem value="analyzed">Analysiert</SelectItem>
                    <SelectItem value="contacted">Kontaktiert</SelectItem>
                    <SelectItem value="rejected">Abgelehnt</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleAnalyze}
              disabled={isTriggering}
              variant="outline"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Firma analysieren (Anna)
            </Button>
            <Button
              onClick={handleGenerateEmail}
              disabled={isTriggering}
              variant="outline"
            >
              <Mail className="mr-2 h-4 w-4" />
              E-Mail generieren (Paul)
            </Button>
          </div>

          {/* E-Mail Status Indikator */}
          {companyEmails && companyEmails.length > 0 ? (
            <Card className="mt-6 border-green-500/30 bg-green-500/5">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                      <Mail className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-green-700 dark:text-green-400">
                        E-Mail vorhanden
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {companyEmails.length === 1 
                          ? `"${companyEmails[0].subject}"` 
                          : `${companyEmails.length} E-Mails erstellt`}
                      </p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => navigate(`/emails/${companyEmails[0].id}`)}
                    variant="outline"
                    className="border-green-500/30 hover:bg-green-500/10"
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    {companyEmails.length === 1 ? 'E-Mail anzeigen' : 'Neueste E-Mail'}
                  </Button>
                </div>
                {companyEmails.length > 1 && (
                  <p className="text-xs text-muted-foreground mt-2 ml-13">
                    + {companyEmails.length - 1} weitere E-Mail(s)
                  </p>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="mt-6 border-dashed">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">
                      Noch keine E-Mail erstellt
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Nutze "E-Mail generieren (Paul)" um eine E-Mail zu erstellen
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList>
            <TabsTrigger value="overview">
              <Eye className="h-4 w-4 mr-2" />
              Übersicht
            </TabsTrigger>
            <TabsTrigger value="edit">
              <Edit className="h-4 w-4 mr-2" />
              Bearbeiten
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid gap-6">
              <CompanyInfo company={company} />
              <AnalysisDisplay analysis={company.analysis} />
            </div>
          </TabsContent>

          <TabsContent value="edit" className="mt-6">
            <CompanyEditor
              company={company}
              onSave={(data) => {
                updateCompany(data);
                setActiveTab('overview');
              }}
              onCancel={() => setActiveTab('overview')}
              isUpdating={isUpdating}
            />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
