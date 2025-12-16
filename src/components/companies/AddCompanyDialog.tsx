import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Plus } from 'lucide-react';

const companySchema = z.object({
  company: z.string().min(1, 'Firmenname ist erforderlich').max(255),
  industry: z.string().max(255).optional(),
  ceo_name: z.string().max(255).optional(),
  email: z.string().email('Ungültige E-Mail').max(255).optional().or(z.literal('')),
  phone: z.string().max(50).optional(),
  website: z.string().url('Ungültige URL').max(500).optional().or(z.literal('')),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  district: z.string().max(100).optional(),
  status: z.enum(['found', 'analyzed', 'contacted', 'qualified', 'rejected']).default('found'),
});

type CompanyFormData = z.infer<typeof companySchema>;

interface AddCompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CompanyFormData) => Promise<void>;
  isLoading?: boolean;
}

const statusOptions = [
  { value: 'found', label: 'Gefunden' },
  { value: 'analyzed', label: 'Analysiert' },
  { value: 'contacted', label: 'Kontaktiert' },
  { value: 'qualified', label: 'Qualifiziert' },
  { value: 'rejected', label: 'Abgelehnt' },
];

export function AddCompanyDialog({ open, onOpenChange, onSubmit, isLoading }: AddCompanyDialogProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      status: 'found',
    },
  });

  const status = watch('status');

  const handleFormSubmit = async (data: CompanyFormData) => {
    // Clean empty strings to null
    const cleanedData = {
      ...data,
      email: data.email || undefined,
      website: data.website || undefined,
    };
    await onSubmit(cleanedData);
    reset();
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Firma hinzufügen
          </DialogTitle>
          <DialogDescription>
            Fügen Sie manuell eine neue Firma zu diesem Projekt hinzu.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* Required Field */}
          <div className="space-y-2">
            <Label htmlFor="company">
              Firmenname <span className="text-destructive">*</span>
            </Label>
            <Input
              id="company"
              {...register('company')}
              placeholder="Musterfirma GmbH"
            />
            {errors.company && (
              <p className="text-sm text-destructive">{errors.company.message}</p>
            )}
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="industry">Branche</Label>
              <Input
                id="industry"
                {...register('industry')}
                placeholder="z.B. IT-Dienstleistungen"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ceo_name">Geschäftsführer</Label>
              <Input
                id="ceo_name"
                {...register('ceo_name')}
                placeholder="Max Mustermann"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-Mail</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="kontakt@firma.de"
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefon</Label>
              <Input
                id="phone"
                {...register('phone')}
                placeholder="+49 123 456789"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                {...register('website')}
                placeholder="https://www.firma.de"
              />
              {errors.website && (
                <p className="text-sm text-destructive">{errors.website.message}</p>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">Adresse</Label>
              <Input
                id="address"
                {...register('address')}
                placeholder="Musterstraße 1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">Stadt</Label>
              <Input
                id="city"
                {...register('city')}
                placeholder="Berlin"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="district">Bezirk</Label>
              <Input
                id="district"
                {...register('district')}
                placeholder="Mitte"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">Bundesland</Label>
              <Input
                id="state"
                {...register('state')}
                placeholder="Berlin"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={status}
                onValueChange={(value) => setValue('status', value as CompanyFormData['status'])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status wählen" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Firma hinzufügen
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
