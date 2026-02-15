import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import Papa from 'papaparse';

interface ExportEmailsButtonProps {
  projectId: string;
}

export const ExportEmailsButton = ({ projectId }: ExportEmailsButtonProps) => {
  const handleExport = async () => {
    try {
      const { data: emails, error } = await supabase
        .from('project_emails')
        .select('recipient_email, subject, body, body_improved, status, sent_at, created_at')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Export error:', error);
        toast.error(`Fehler beim Export: ${error.message}`);
        return;
      }

      if (!emails || emails.length === 0) {
        toast.error('Keine E-Mails zum Exportieren vorhanden');
        return;
      }

      // Format data for export - Excel compatible
      const exportData = emails.map(email => ({
        email_address: email.recipient_email,
        subject: email.subject,
        body: email.body,
        body_improved: email.body_improved || '',
        status: email.status,
        sent_at: email.sent_at || '',
        created_at: email.created_at
      }));

      const csv = Papa.unparse(exportData);
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `emails_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`${emails.length} E-Mails erfolgreich exportiert`);
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
