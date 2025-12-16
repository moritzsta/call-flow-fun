import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Edit, Save, X } from 'lucide-react';
import { Company } from '@/hooks/useCompanies';
import { CompanyUpdateData } from '@/hooks/useCompany';

const companyFormSchema = z.object({
  company: z.string().min(1, 'Firmenname ist erforderlich').max(200),
  industry: z.string().max(100).optional().or(z.literal('')),
  ceo_name: z.string().max(100).optional().or(z.literal('')),
  email: z.string().email('Ungültige E-Mail-Adresse').optional().or(z.literal('')),
  phone: z.string().max(50).optional().or(z.literal('')),
  website: z.string().url('Ungültige URL').optional().or(z.literal('')),
  address: z.string().max(200).optional().or(z.literal('')),
  city: z.string().max(100).optional().or(z.literal('')),
  state: z.string().max(100).optional().or(z.literal('')),
  district: z.string().max(100).optional().or(z.literal('')),
});

type CompanyFormValues = z.infer<typeof companyFormSchema>;

interface CompanyEditorProps {
  company: Company;
  onSave: (data: CompanyUpdateData) => void;
  onCancel: () => void;
  isUpdating: boolean;
}

export const CompanyEditor = ({ company, onSave, onCancel, isUpdating }: CompanyEditorProps) => {
  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      company: company.company || '',
      industry: company.industry || '',
      ceo_name: company.ceo_name || '',
      email: company.email || '',
      phone: company.phone || '',
      website: company.website || '',
      address: company.address || '',
      city: company.city || '',
      state: company.state || '',
      district: company.district || '',
    },
  });

  const handleSubmit = (values: CompanyFormValues) => {
    // Convert empty strings to undefined for optional fields
    const cleanedData: CompanyUpdateData = {
      company: values.company,
      industry: values.industry || undefined,
      ceo_name: values.ceo_name || undefined,
      email: values.email || undefined,
      phone: values.phone || undefined,
      website: values.website || undefined,
      address: values.address || undefined,
      city: values.city || undefined,
      state: values.state || undefined,
      district: values.district || undefined,
    };
    onSave(cleanedData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Edit className="h-5 w-5" />
          Firma bearbeiten
        </CardTitle>
        <CardDescription>
          Bearbeiten Sie die Firmendaten
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Firmenname *</FormLabel>
                    <FormControl>
                      <Input placeholder="Firmenname" {...field} disabled={isUpdating} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="industry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Branche</FormLabel>
                    <FormControl>
                      <Input placeholder="z.B. IT, Gastronomie" {...field} disabled={isUpdating} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Contact Person */}
            <FormField
              control={form.control}
              name="ceo_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Geschäftsführer / Ansprechpartner</FormLabel>
                  <FormControl>
                    <Input placeholder="Name des Ansprechpartners" {...field} disabled={isUpdating} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Contact Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-Mail</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="info@firma.de" {...field} disabled={isUpdating} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefon</FormLabel>
                    <FormControl>
                      <Input placeholder="+49 123 456789" {...field} disabled={isUpdating} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website</FormLabel>
                    <FormControl>
                      <Input placeholder="https://www.firma.de" {...field} disabled={isUpdating} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Address */}
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Adresse</FormLabel>
                  <FormControl>
                    <Input placeholder="Straße und Hausnummer" {...field} disabled={isUpdating} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stadt</FormLabel>
                    <FormControl>
                      <Input placeholder="Stadt" {...field} disabled={isUpdating} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="district"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bezirk</FormLabel>
                    <FormControl>
                      <Input placeholder="Bezirk" {...field} disabled={isUpdating} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bundesland</FormLabel>
                    <FormControl>
                      <Input placeholder="Bundesland" {...field} disabled={isUpdating} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={isUpdating}>
                <Save className="mr-2 h-4 w-4" />
                Speichern
              </Button>
              <Button type="button" variant="outline" onClick={onCancel} disabled={isUpdating}>
                <X className="mr-2 h-4 w-4" />
                Abbrechen
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
