import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import { useProjects, type CreateProjectInput } from '@/hooks/useProjects';

const projectSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, 'Titel muss mindestens 2 Zeichen lang sein')
    .max(100, 'Titel darf maximal 100 Zeichen lang sein'),
  description: z
    .string()
    .trim()
    .max(500, 'Beschreibung darf maximal 500 Zeichen lang sein')
    .optional(),
});

type ProjectInput = z.infer<typeof projectSchema>;

interface CreateProjectDialogProps {
  organizationId: string;
}

export const CreateProjectDialog = ({ organizationId }: CreateProjectDialogProps) => {
  const [open, setOpen] = useState(false);
  const { createProject, isCreating } = useProjects(organizationId);

  const form = useForm<ProjectInput>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: '',
      description: '',
    },
  });

  const onSubmit = (data: ProjectInput) => {
    const input: CreateProjectInput = {
      organization_id: organizationId,
      title: data.title,
      description: data.description,
    };

    createProject(input, {
      onSuccess: () => {
        setOpen(false);
        form.reset();
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Projekt erstellen
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Neues Projekt erstellen</DialogTitle>
          <DialogDescription>
            Erstellen Sie ein neues Projekt für Ihre Cold Calling Kampagnen.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titel *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Q1 2025 Solar Campaign"
                      {...field}
                      disabled={isCreating}
                      maxLength={100}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Beschreibung (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Eine kurze Beschreibung des Projekts..."
                      rows={3}
                      {...field}
                      disabled={isCreating}
                      maxLength={500}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isCreating}
              >
                Abbrechen
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Erstellen...
                  </>
                ) : (
                  'Erstellen'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
