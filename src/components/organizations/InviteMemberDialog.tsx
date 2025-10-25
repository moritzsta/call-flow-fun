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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { UserPlus, Loader2 } from 'lucide-react';
import { useOrganizationMembers, type InviteMemberInput } from '@/hooks/useOrganizationMembers';

const inviteSchema = z.object({
  email: z.string().email('Bitte geben Sie eine gültige E-Mail-Adresse ein'),
  role: z.enum(['owner', 'manager', 'read_only'], {
    required_error: 'Bitte wählen Sie eine Rolle aus',
  }),
});

type InviteInput = z.infer<typeof inviteSchema>;

interface InviteMemberDialogProps {
  organizationId: string;
}

export const InviteMemberDialog = ({ organizationId }: InviteMemberDialogProps) => {
  const [open, setOpen] = useState(false);
  const { inviteMember, isInviting } = useOrganizationMembers(organizationId);

  const form = useForm<InviteInput>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: '',
      role: 'read_only',
    },
  });

  const onSubmit = (data: InviteInput) => {
    const input: InviteMemberInput = {
      organization_id: organizationId,
      email: data.email,
      role: data.role,
    };

    inviteMember(input, {
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
          <UserPlus className="mr-2 h-4 w-4" />
          Mitglied einladen
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mitglied einladen</DialogTitle>
          <DialogDescription>
            Laden Sie ein Mitglied zu Ihrer Organisation ein. Der Benutzer muss bereits registriert sein.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-Mail-Adresse *</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="user@beispiel.de"
                      {...field}
                      disabled={isInviting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rolle *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isInviting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Rolle auswählen" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="read_only">Read-Only (Nur Lesen)</SelectItem>
                      <SelectItem value="manager">Manager (Bearbeiten)</SelectItem>
                      <SelectItem value="owner">Owner (Volle Kontrolle)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isInviting}
              >
                Abbrechen
              </Button>
              <Button type="submit" disabled={isInviting}>
                {isInviting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Einladen...
                  </>
                ) : (
                  'Einladen'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
