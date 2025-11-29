import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Plus, Pencil, Trash2, FileText } from 'lucide-react';
import { useEmailTemplates, EmailTemplate, EmailTemplateInsert } from '@/hooks/useEmailTemplates';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const templateSchema = z.object({
  title: z.string().min(1, 'Titel ist erforderlich').max(100),
  subject_template: z.string().min(1, 'Betreff ist erforderlich').max(200),
  body_template: z.string().min(1, 'E-Mail-Text ist erforderlich'),
});

type TemplateFormData = z.infer<typeof templateSchema>;

export default function EmailTemplates() {
  const navigate = useNavigate();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [deletingTemplate, setDeletingTemplate] = useState<EmailTemplate | null>(null);

  const { templates, isLoading, createTemplate, updateTemplate, deleteTemplate } = useEmailTemplates();

  const form = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      title: '',
      subject_template: '',
      body_template: '',
    },
  });

  const handleCreate = (data: TemplateFormData) => {
    createTemplate({
      title: data.title,
      subject_template: data.subject_template,
      body_template: data.body_template,
    } as EmailTemplateInsert, {
      onSuccess: () => {
        setIsCreateDialogOpen(false);
        form.reset();
      },
    });
  };

  const handleEdit = (template: EmailTemplate) => {
    setEditingTemplate(template);
    form.reset({
      title: template.title,
      subject_template: template.subject_template,
      body_template: template.body_template,
    });
  };

  const handleUpdate = (data: TemplateFormData) => {
    if (!editingTemplate) return;

    updateTemplate(
      {
        id: editingTemplate.id,
        ...data,
      },
      {
        onSuccess: () => {
          setEditingTemplate(null);
          form.reset();
        },
      }
    );
  };

  const handleDelete = () => {
    if (!deletingTemplate) return;

    deleteTemplate(deletingTemplate.id, {
      onSuccess: () => {
        setDeletingTemplate(null);
      },
    });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container max-w-5xl py-8">
          <Skeleton className="h-10 w-32 mb-6" />
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container max-w-5xl py-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zurück
        </Button>

        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">E-Mail-Templates</h1>
            <p className="text-muted-foreground">
              Erstellen und verwalten Sie wiederverwendbare E-Mail-Vorlagen
            </p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Template erstellen
          </Button>
        </div>

        {templates.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                Noch keine Templates vorhanden.
                <br />
                Erstellen Sie Ihr erstes Template!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {templates.map((template) => (
              <Card key={template.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{template.title}</CardTitle>
                      <CardDescription className="mt-2">
                        Betreff: {template.subject_template}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(template)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeletingTemplate(template)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {template.body_template.substring(0, 200)}...
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog
          open={isCreateDialogOpen || !!editingTemplate}
          onOpenChange={(open) => {
            if (!open) {
              setIsCreateDialogOpen(false);
              setEditingTemplate(null);
              form.reset();
            }
          }}
        >
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? 'Template bearbeiten' : 'Neues Template erstellen'}
              </DialogTitle>
              <DialogDescription>
                Verwenden Sie Variablen wie {'{{company_name}}'}, {'{{ceo_name}}'}, {'{{industry}}'} für personalisierte E-Mails
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={form.handleSubmit(editingTemplate ? handleUpdate : handleCreate)}
              className="space-y-4"
            >
              <div>
                <Label htmlFor="title">Template-Name</Label>
                <Input id="title" {...form.register('title')} />
                {form.formState.errors.title && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.title.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="subject_template">Betreff-Vorlage</Label>
                <Input id="subject_template" {...form.register('subject_template')} />
                {form.formState.errors.subject_template && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.subject_template.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="body_template">E-Mail-Text-Vorlage</Label>
                <Textarea
                  id="body_template"
                  {...form.register('body_template')}
                  rows={12}
                />
                {form.formState.errors.body_template && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.body_template.message}
                  </p>
                )}
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreateDialogOpen(false);
                    setEditingTemplate(null);
                    form.reset();
                  }}
                >
                  Abbrechen
                </Button>
                <Button type="submit">
                  {editingTemplate ? 'Aktualisieren' : 'Erstellen'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deletingTemplate} onOpenChange={(open) => !open && setDeletingTemplate(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Template löschen?</AlertDialogTitle>
              <AlertDialogDescription>
                Möchten Sie das Template "{deletingTemplate?.title}" wirklich löschen? Diese Aktion
                kann nicht rückgängig gemacht werden.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Abbrechen</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Löschen</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
}
