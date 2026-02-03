-- Create email_instructions table (analog to analyse_instructions)
CREATE TABLE public.email_instructions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  instruction TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger for updated_at
CREATE TRIGGER update_email_instructions_updated_at
  BEFORE UPDATE ON public.email_instructions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.email_instructions ENABLE ROW LEVEL SECURITY;

-- RLS Policies (global for all authenticated users, same as analyse_instructions)
CREATE POLICY "Authenticated users can read email_instructions"
  ON public.email_instructions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert email_instructions"
  ON public.email_instructions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update email_instructions"
  ON public.email_instructions FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete email_instructions"
  ON public.email_instructions FOR DELETE
  TO authenticated
  USING (true);