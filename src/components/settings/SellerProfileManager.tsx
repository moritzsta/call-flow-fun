import { useState } from 'react';
import { useSellerProfiles, SellerProfile } from '@/hooks/useSellerProfiles';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Save, Trash2, UserCircle } from 'lucide-react';

export function SellerProfileManager() {
  const { profiles, isLoading, createProfile, updateProfile, deleteProfile } = useSellerProfiles();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  
  // Form fields
  const [profileName, setProfileName] = useState('');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');

  const selectedProfile = profiles.find((p) => p.id === selectedId);

  const handleSelect = (id: string) => {
    const profile = profiles.find((p) => p.id === id);
    if (profile) {
      setSelectedId(id);
      setProfileName(profile.profile_name);
      setName(profile.name);
      setCompany(profile.company);
      setAddress(profile.address || '');
      setPhone(profile.phone || '');
      setWebsite(profile.website || '');
      setIsCreating(false);
    }
  };

  const handleNew = () => {
    setSelectedId(null);
    setProfileName('');
    setName('');
    setCompany('');
    setAddress('');
    setPhone('');
    setWebsite('');
    setIsCreating(true);
  };

  const resetForm = () => {
    setSelectedId(null);
    setProfileName('');
    setName('');
    setCompany('');
    setAddress('');
    setPhone('');
    setWebsite('');
    setIsCreating(false);
  };

  const handleSave = async () => {
    if (!profileName.trim() || !name.trim() || !company.trim()) return;

    const profileData = {
      profile_name: profileName.trim(),
      name: name.trim(),
      company: company.trim(),
      address: address.trim() || null,
      phone: phone.trim() || null,
      website: website.trim() || null,
    };

    if (isCreating) {
      await createProfile.mutateAsync(profileData as any);
      resetForm();
    } else if (selectedId) {
      await updateProfile.mutateAsync({ id: selectedId, ...profileData });
    }
  };

  const handleDelete = async () => {
    if (selectedId) {
      await deleteProfile.mutateAsync(selectedId);
      resetForm();
    }
  };

  const isFormValid = profileName.trim() && name.trim() && company.trim();
  const isSaving = createProfile.isPending || updateProfile.isPending;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCircle className="h-5 w-5" />
          Verkäufer-Profile verwalten
        </CardTitle>
        <CardDescription>
          Speichern Sie Ihre Kontaktdaten als Profile, um sie in Workflows schnell auszuwählen.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Profile Selection */}
        <div className="flex gap-4 items-end">
          <div className="flex-1 space-y-2">
            <Label htmlFor="profile-select">Profil auswählen</Label>
            <Select
              value={selectedId || ''}
              onValueChange={handleSelect}
            >
              <SelectTrigger id="profile-select">
                <SelectValue placeholder="Profil auswählen..." />
              </SelectTrigger>
              <SelectContent>
                {profiles.map((profile) => (
                  <SelectItem key={profile.id} value={profile.id}>
                    {profile.profile_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" onClick={handleNew}>
            <Plus className="h-4 w-4 mr-2" />
            Neues Profil
          </Button>
        </div>

        {/* Edit Form */}
        {(selectedId || isCreating) && (
          <div className="space-y-4 pt-4 border-t">
            <div className="space-y-2">
              <Label htmlFor="profile-name">Profilname *</Label>
              <Input
                id="profile-name"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                placeholder="z.B. Hauptprofil, Vertrieb Team A"
              />
              <p className="text-xs text-muted-foreground">
                Ein Name zur Identifikation dieses Profils in Dropdown-Menüs.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="seller-name">Name *</Label>
                <Input
                  id="seller-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Max Mustermann"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="seller-company">Firma *</Label>
                <Input
                  id="seller-company"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="MusterFirma GmbH"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="seller-address">Adresse</Label>
              <Input
                id="seller-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Musterstraße 123, 12345 Musterstadt"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="seller-phone">Telefon</Label>
                <Input
                  id="seller-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+49 123 456789"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="seller-website">Website</Label>
                <Input
                  id="seller-website"
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://example.com"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              {selectedId && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Löschen
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Profil löschen?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Diese Aktion kann nicht rückgängig gemacht werden. Das Verkäufer-Profil "{profileName}" wird dauerhaft gelöscht.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete}>
                        Löschen
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              <Button 
                onClick={handleSave}
                disabled={!isFormValid || isSaving}
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Speichere...' : 'Speichern'}
              </Button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!selectedId && !isCreating && profiles.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <UserCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Keine Verkäufer-Profile vorhanden.</p>
            <p className="text-sm">Erstellen Sie Ihr erstes Profil mit dem Button oben.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
