import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import Papa from 'papaparse';

interface ExportCompaniesButtonProps {
  projectId: string;
}

export const ExportCompaniesButton = ({ projectId }: ExportCompaniesButtonProps) => {
  const handleExport = async () => {
    try {
      const { data: companies, error } = await supabase
        .from('companies')
        .select('company, industry, ceo_name, phone, email, website, address, district, city, state, status, created_at')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Export error:', error);
        toast.error(`Fehler beim Export: ${error.message}`);
        return;
      }

      if (!companies || companies.length === 0) {
        toast.error('Keine Firmen zum Exportieren vorhanden');
        return;
      }

      const csv = Papa.unparse(companies);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `companies_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`${companies.length} Firmen erfolgreich exportiert`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Fehler beim Exportieren der Daten');
    }
  };

  return (
    <Button variant="outline" onClick={handleExport}>
      <Download className="mr-2 h-4 w-4" />
      CSV Export
    </Button>
  );
};
