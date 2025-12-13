import { useState, useEffect } from 'react';
import { useEmailTemplates, EmailTemplate } from '@/hooks/useEmailTemplates';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { RichTextEditor } from './RichTextEditor';
import { Plus, Trash2, Save, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const AVAILABLE_VARIABLES = [
  { key: '{{company_name}}', label: 'Firmenname' },
  { key: '{{ceo_name}}', label: 'Geschäftsführer' },
  { key: '{{industry}}', label: 'Branche' },
  { key: '{{email}}', label: 'E-Mail' },
  { key: '{{seller_name}}', label: 'Ihr Name' },
  { key: '{{seller_company}}', label: 'Ihre Firma' },
  { key: '{{seller_website}}', label: 'Ihre Website' },
];

export function EmailTemplateManager() {
  const { templates, isLoading, createTemplate, updateTemplate, deleteTemplate, isCreating, isUpdating, isDeleting } = useEmailTemplates();
  
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [enumName, setEnumName] = useState('');
  const [subjectTemplate, setSubjectTemplate] = useState('');
  const [bodyTemplate, setBodyTemplate] = useState('');

  // Load selected template into form
  useEffect(() => {
    if (selectedTemplateId && !isCreatingNew) {
      const template = templates.find(t => t.id === selectedTemplateId);
      if (template) {
        setTitle(template.title);
        setEnumName(template.enum_name);
        setSubjectTemplate(template.subject_template);
        setBodyTemplate(template.body_template);
      }
    }
  }, [selectedTemplateId, templates, isCreatingNew]);

  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    setIsCreatingNew(false);
  };

  const handleNewTemplate = () => {
    setSelectedTemplateId(null);
    setIsCreatingNew(true);
    setTitle('');
    setEnumName('');
    setSubjectTemplate('');
    setBodyTemplate('');
  };

  const handleSave = () => {
    if (isCreatingNew) {
      createTemplate({
        title,
        enum_name: enumName || 'custom',
        subject_template: subjectTemplate,
        body_template: bodyTemplate,
      });
      setIsCreatingNew(false);
    } else if (selectedTemplateId) {
      updateTemplate({
        id: selectedTemplateId,
        title,
        enum_name: enumName,
        subject_template: subjectTemplate,
        body_template: bodyTemplate,
      });
    }
  };

  const handleDelete = () => {
    if (selectedTemplateId) {
      deleteTemplate(selectedTemplateId);
      setSelectedTemplateId(null);
      setDeleteDialogOpen(false);
    }
  };

  const isFormValid = title.trim() && subjectTemplate.trim() && bodyTemplate.trim();
  const isSaving = isCreating || isUpdating;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Template Selection */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Label htmlFor="template-select" className="sr-only">Template auswählen</Label>
          <Select
            value={isCreatingNew ? '' : (selectedTemplateId || '')}
            onValueChange={handleSelectTemplate}
          >
            <SelectTrigger id="template-select">
              <SelectValue placeholder="Template auswählen..." />
            </SelectTrigger>
            <SelectContent>
              {templates.map((template) => (
                <SelectItem key={template.id} value={template.id}>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span>{template.title}</span>
                    <Badge variant="outline" className="ml-2 text-xs">
                      {template.enum_name}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleNewTemplate} variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Neues Template
        </Button>
      </div>

      {/* Template Editor */}
      {(selectedTemplateId || isCreatingNew) && (
        <Card>
          <CardHeader>
            <CardTitle>
              {isCreatingNew ? 'Neues Template erstellen' : 'Template bearbeiten'}
            </CardTitle>
            <CardDescription>
              Bearbeiten Sie Titel, Betreff und Inhalt des Templates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Template-Name *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="z.B. Verkaufs-Pitch"
              />
            </div>

            {/* Enum Name */}
            <div className="space-y-2">
              <Label htmlFor="enum_name">Interner Schlüssel</Label>
              <Input
                id="enum_name"
                value={enumName}
                onChange={(e) => setEnumName(e.target.value)}
                placeholder="z.B. sales"
              />
              <p className="text-sm text-muted-foreground">
                Wird für die automatische Auswahl in Workflows verwendet
              </p>
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <Label htmlFor="subject">Betreff-Vorlage *</Label>
              <Input
                id="subject"
                value={subjectTemplate}
                onChange={(e) => setSubjectTemplate(e.target.value)}
                placeholder="z.B. Angebot für {{company_name}}"
              />
            </div>

            {/* Body */}
            <div className="space-y-2">
              <Label>E-Mail-Text *</Label>
              <RichTextEditor
                content={bodyTemplate}
                onChange={setBodyTemplate}
                placeholder="Schreiben Sie hier Ihren E-Mail-Text..."
              />
            </div>

            {/* Available Variables */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Verfügbare Variablen:</Label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_VARIABLES.map((variable) => (
                  <Badge 
                    key={variable.key} 
                    variant="secondary" 
                    className="cursor-pointer hover:bg-accent"
                    onClick={() => {
                      navigator.clipboard.writeText(variable.key);
                    }}
                    title={`${variable.label} - Klicken zum Kopieren`}
                  >
                    {variable.key}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4 pt-4 border-t">
              <Button 
                onClick={handleSave} 
                disabled={!isFormValid || isSaving}
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Speichert...' : 'Speichern'}
              </Button>
              
              {!isCreatingNew && selectedTemplateId && (
                <Button 
                  variant="destructive" 
                  onClick={() => setDeleteDialogOpen(true)}
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Löschen
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!selectedTemplateId && !isCreatingNew && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Kein Template ausgewählt</h3>
            <p className="text-muted-foreground mb-4">
              Wählen Sie ein bestehendes Template aus oder erstellen Sie ein neues
            </p>
            <Button onClick={handleNewTemplate}>
              <Plus className="h-4 w-4 mr-2" />
              Neues Template erstellen
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Template löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Sind Sie sicher, dass Sie dieses Template löschen möchten? 
              Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
