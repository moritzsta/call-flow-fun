import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import Papa from 'papaparse';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface ImportCompaniesButtonProps {
  projectId: string;
}

interface CSVRow {
  company?: string;
  industry?: string;
  ceo_name?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  district?: string;
  city?: string;
  state?: string;
  [key: string]: string | undefined;
}

export const ImportCompaniesButton = ({ projectId }: ImportCompaniesButtonProps) => {
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);

    Papa.parse<CSVRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const validRows = results.data.filter((row) => row.company && row.company.trim() !== '');

          if (validRows.length === 0) {
            toast.error('Keine gültigen Firmen im CSV gefunden (Spalte "company" erforderlich)');
            setIsImporting(false);
            return;
          }

          const companies = validRows.map((row) => ({
            project_id: projectId,
            company: row.company!.trim(),
            industry: row.industry?.trim() || null,
            ceo_name: row.ceo_name?.trim() || null,
            phone: row.phone?.trim() || null,
            email: row.email?.trim() || null,
            website: row.website?.trim() || null,
            address: row.address?.trim() || null,
            district: row.district?.trim() || null,
            city: row.city?.trim() || null,
            state: row.state?.trim() || null,
            status: 'found' as const,
          }));

          const { error } = await supabase.from('companies').insert(companies);

          if (error) {
            console.error('Import error:', error);
            toast.error(`Fehler beim Import: ${error.message}`);
          } else {
            toast.success(`${companies.length} Firmen erfolgreich importiert`);
            queryClient.invalidateQueries({ queryKey: ['companies', projectId] });
          }
        } catch (error) {
          console.error('Parse error:', error);
          toast.error('Fehler beim Verarbeiten der CSV-Datei');
        } finally {
          setIsImporting(false);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }
      },
      error: (error) => {
        console.error('CSV parse error:', error);
        toast.error(`CSV-Fehler: ${error.message}`);
        setIsImporting(false);
      },
    });
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileUpload}
        className="hidden"
        disabled={isImporting}
      />
      <Button
        variant="outline"
        onClick={() => fileInputRef.current?.click()}
        disabled={isImporting}
      >
        <Upload className="mr-2 h-4 w-4" />
        {isImporting ? 'Importiere...' : 'CSV Import'}
      </Button>
    </>
  );
};
