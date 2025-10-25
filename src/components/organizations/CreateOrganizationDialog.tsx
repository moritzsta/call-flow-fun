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
import { useOrganizations, type CreateOrganizationInput } from '@/hooks/useOrganizations';

const organizationSchema = z.object({
  name: z.string().min(2, 'Name muss mindestens 2 Zeichen lang sein'),
  description: z.string().optional(),
});

type OrganizationInput = z.infer<typeof organizationSchema>;

export const CreateOrganizationDialog = () => {
  const [open, setOpen] = useState(false);
  const { createOrganization, isCreating } = useOrganizations();

  const form = useForm<OrganizationInput>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  const onSubmit = (data: OrganizationInput) => {
    const validData: CreateOrganizationInput = {
      name: data.name,
      description: data.description,
    };
    createOrganization(validData, {
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
          Organisation erstellen
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Neue Organisation erstellen</DialogTitle>
          <DialogDescription>
            Erstellen Sie eine neue Organisation für Ihre Cold Calling Projekte.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Meine Organisation"
                      {...field}
                      disabled={isCreating}
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
                      placeholder="Eine kurze Beschreibung der Organisation..."
                      rows={3}
                      {...field}
                      disabled={isCreating}
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
