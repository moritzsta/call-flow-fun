import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Edit, Save, Send } from 'lucide-react';
import { ProjectEmail } from '@/hooks/useEmails';

const emailFormSchema = z.object({
  subject: z
    .string()
    .min(1, 'Betreff darf nicht leer sein')
    .max(200, 'Betreff darf maximal 200 Zeichen lang sein'),
  body: z
    .string()
    .min(10, 'E-Mail-Text muss mindestens 10 Zeichen lang sein')
    .max(10000, 'E-Mail-Text darf maximal 10.000 Zeichen lang sein'),
});

type EmailFormValues = z.infer<typeof emailFormSchema>;

interface EmailEditorProps {
  email: ProjectEmail;
  onSave: (subject: string, body: string, status?: ProjectEmail['status']) => void;
  onSend: (userId: string) => void;
  isUpdating: boolean;
  userId: string;
}

export const EmailEditor = ({ email, onSave, onSend, isUpdating, userId }: EmailEditorProps) => {
  const form = useForm<EmailFormValues>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: {
      subject: email.subject,
      body: email.body,
    },
  });

  const handleSaveDraft = (values: EmailFormValues) => {
    onSave(values.subject, values.body, 'draft');
  };

  const handleSaveReady = (values: EmailFormValues) => {
    onSave(values.subject, values.body, 'ready_to_send');
  };

  const handleSendNow = (values: EmailFormValues) => {
    onSave(values.subject, values.body, 'ready_to_send');
    // Wait a moment for the save to complete, then trigger send
    setTimeout(() => {
      onSend(userId);
    }, 500);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Edit className="h-5 w-5" />
          E-Mail bearbeiten
        </CardTitle>
        <CardDescription>
          Bearbeiten Sie Betreff und Inhalt der E-Mail
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form className="space-y-6">
            {/* Recipient (read-only) */}
            <FormItem>
              <FormLabel>Empfänger</FormLabel>
              <FormControl>
                <Input value={email.recipient_email} disabled />
              </FormControl>
              <FormDescription>
                Der Empfänger kann nicht geändert werden
              </FormDescription>
            </FormItem>

            {/* Subject */}
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Betreff</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Betreff der E-Mail"
                      {...field}
                      disabled={isUpdating || email.status === 'sent'}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Body */}
            <FormField
              control={form.control}
              name="body"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-Mail-Text (HTML)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="E-Mail-Inhalt (HTML erlaubt)"
                      className="min-h-[300px] font-mono text-sm"
                      {...field}
                      disabled={isUpdating || email.status === 'sent'}
                    />
                  </FormControl>
                  <FormDescription>
                    Sie können HTML-Tags verwenden, z.B. &lt;p&gt;, &lt;strong&gt;, &lt;a&gt;
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Action Buttons */}
            {email.status !== 'sent' && (
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={form.handleSubmit(handleSaveDraft)}
                  disabled={isUpdating}
                >
                  <Save className="mr-2 h-4 w-4" />
                  Als Entwurf speichern
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={form.handleSubmit(handleSaveReady)}
                  disabled={isUpdating}
                >
                  <Save className="mr-2 h-4 w-4" />
                  Bereit zum Versenden
                </Button>
                <Button
                  type="button"
                  onClick={form.handleSubmit(handleSendNow)}
                  disabled={isUpdating}
                >
                  <Send className="mr-2 h-4 w-4" />
                  Jetzt versenden
                </Button>
              </div>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
