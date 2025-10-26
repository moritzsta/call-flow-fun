import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useEmailTemplates, EmailTemplate } from '@/hooks/useEmailTemplates';

interface TemplateSelectorProps {
  organizationId: string;
  onTemplateSelect: (template: EmailTemplate | null) => void;
  selectedTemplateId?: string;
}

export const TemplateSelector = ({
  organizationId,
  onTemplateSelect,
  selectedTemplateId,
}: TemplateSelectorProps) => {
  const { templates, isLoading } = useEmailTemplates(organizationId);

  const handleValueChange = (value: string) => {
    if (value === 'none') {
      onTemplateSelect(null);
      return;
    }

    const template = templates.find((t) => t.id === value);
    if (template) {
      onTemplateSelect(template);
    }
  };

  return (
    <div className="space-y-2">
      <Label>E-Mail-Template auswählen (optional)</Label>
      <Select
        value={selectedTemplateId || 'none'}
        onValueChange={handleValueChange}
        disabled={isLoading}
      >
        <SelectTrigger>
          <SelectValue placeholder="Kein Template" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Kein Template</SelectItem>
          {templates.map((template) => (
            <SelectItem key={template.id} value={template.id}>
              {template.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
