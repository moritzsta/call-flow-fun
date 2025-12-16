import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
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

export default function CompanyDetail() {
  const { companyId } = useParams<{ companyId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { company, isLoading, updateCompanyStatus, updateCompany, isUpdating } = useCompany(companyId);
  const { triggerWorkflow, isTriggering } = useWorkflowTrigger();
  const [activeTab, setActiveTab] = useState('overview');

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
