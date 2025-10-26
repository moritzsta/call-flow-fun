import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

const profileSchema = z.object({
  full_name: z.string().trim().min(2, 'Name muss mindestens 2 Zeichen lang sein').max(100),
  preferred_language: z.enum(['de', 'en']),
  theme: z.enum(['light', 'dark', 'system']),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function Profile() {
  const { user, profile, refreshProfile } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: profile?.full_name || '',
      preferred_language: (profile?.preferred_language as 'de' | 'en') || 'de',
      theme: (profile?.theme as 'light' | 'dark' | 'system') || 'light',
    },
  });

  useEffect(() => {
    if (profile) {
      setValue('full_name', profile.full_name || '');
      setValue('preferred_language', (profile.preferred_language as 'de' | 'en') || 'de');
      setValue('theme', (profile.theme as 'light' | 'dark' | 'system') || 'light');
    }
  }, [profile, setValue]);

  const onSubmit = async (data: ProfileFormData) => {
    if (!user) return;

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: data.full_name,
          preferred_language: data.preferred_language,
          theme: data.theme,
        })
        .eq('id', user.id);

      if (error) throw error;

      await refreshProfile();
      toast.success('Profil erfolgreich aktualisiert!');
    } catch (error: any) {
      toast.error(`Fehler beim Aktualisieren: ${error.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  if (!profile) {
    return (
      <Layout>
        <div className="container max-w-4xl py-8 space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-64 w-full" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container max-w-4xl py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Profil-Einstellungen</h1>
          <p className="text-muted-foreground">
            Verwalten Sie Ihre persönlichen Informationen und Präferenzen
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Persönliche Informationen</CardTitle>
            <CardDescription>
              Aktualisieren Sie Ihren Namen und Ihre Einstellungen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Email (Read-only) */}
              <div className="space-y-2">
                <Label htmlFor="email">E-Mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  disabled
                  className="bg-muted"
                />
                <p className="text-sm text-muted-foreground">
                  Die E-Mail-Adresse kann nicht geändert werden.
                </p>
              </div>

              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="full_name">Name*</Label>
                <Input
                  id="full_name"
                  {...register('full_name')}
                  placeholder="Ihr Name"
                />
                {errors.full_name && (
                  <p className="text-sm text-destructive">{errors.full_name.message}</p>
                )}
              </div>

              {/* Preferred Language */}
              <div className="space-y-2">
                <Label htmlFor="preferred_language">Bevorzugte Sprache</Label>
                <Select
                  value={watch('preferred_language')}
                  onValueChange={(value) => setValue('preferred_language', value as 'de' | 'en')}
                >
                  <SelectTrigger id="preferred_language">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="de">Deutsch</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Theme */}
              <div className="space-y-2">
                <Label htmlFor="theme">Design</Label>
                <Select
                  value={watch('theme')}
                  onValueChange={(value) => setValue('theme', value as 'light' | 'dark' | 'system')}
                >
                  <SelectTrigger id="theme">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Hell</SelectItem>
                    <SelectItem value="dark">Dunkel</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Wählen Sie Ihr bevorzugtes Design-Theme.
                </p>
              </div>

              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? 'Speichere...' : 'Änderungen speichern'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
