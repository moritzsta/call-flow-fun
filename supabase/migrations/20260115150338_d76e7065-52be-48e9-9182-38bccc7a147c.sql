-- Create analyse_instructions table
CREATE TABLE public.analyse_instructions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  instruction TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.analyse_instructions ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read (global templates like email_templates)
CREATE POLICY "Public read access for analyse_instructions" 
ON public.analyse_instructions 
FOR SELECT 
USING (true);

-- Policy: Authenticated users can insert
CREATE POLICY "Authenticated users can create analyse_instructions" 
ON public.analyse_instructions 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Policy: Authenticated users can update
CREATE POLICY "Authenticated users can update analyse_instructions" 
ON public.analyse_instructions 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

-- Policy: Authenticated users can delete
CREATE POLICY "Authenticated users can delete analyse_instructions" 
ON public.analyse_instructions 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Create trigger for automatic timestamp updates (reuse existing function)
CREATE TRIGGER update_analyse_instructions_updated_at
BEFORE UPDATE ON public.analyse_instructions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert a default instruction
INSERT INTO public.analyse_instructions (name, instruction) VALUES 
('Standard-Analyse', 'Analysiere die Firmenwebseite und identifiziere relevante Informationen für die Kontaktaufnahme.');