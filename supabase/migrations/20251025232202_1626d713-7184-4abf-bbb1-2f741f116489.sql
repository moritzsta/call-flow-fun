-- Enable RLS for german_cities
ALTER TABLE public.german_cities ENABLE ROW LEVEL SECURITY;

-- Enable RLS for german_districts
ALTER TABLE public.german_districts ENABLE ROW LEVEL SECURITY;

-- Enable RLS for german_companies (legacy table - read-only for reference)
ALTER TABLE public.german_companies ENABLE ROW LEVEL SECURITY;

-- Create public read policies for german_cities (lookup table)
CREATE POLICY "Anyone can view german_cities"
ON public.german_cities
FOR SELECT
USING (true);

-- Create public read policies for german_districts (lookup table)
CREATE POLICY "Anyone can view german_districts"
ON public.german_districts
FOR SELECT
USING (true);

-- Create public read policies for german_companies (legacy lookup table)
CREATE POLICY "Anyone can view german_companies"
ON public.german_companies
FOR SELECT
USING (true);

-- Note: These are lookup/reference tables and should remain read-only for all users
-- No INSERT/UPDATE/DELETE policies are needed as these tables will be managed externally