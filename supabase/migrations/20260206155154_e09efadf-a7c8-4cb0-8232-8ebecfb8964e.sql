-- Tabelle für Verkäufer-Profile erstellen
CREATE TABLE public.seller_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_name text NOT NULL,
  name text NOT NULL,
  company text NOT NULL,
  address text,
  phone text,
  website text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS aktivieren
ALTER TABLE public.seller_profiles ENABLE ROW LEVEL SECURITY;

-- Policies für authentifizierte Benutzer (gleich wie email_instructions)
CREATE POLICY "Authenticated users can read seller_profiles"
  ON public.seller_profiles FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert seller_profiles"
  ON public.seller_profiles FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update seller_profiles"
  ON public.seller_profiles FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete seller_profiles"
  ON public.seller_profiles FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Trigger für automatische updated_at Aktualisierung
CREATE TRIGGER update_seller_profiles_updated_at
  BEFORE UPDATE ON public.seller_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();