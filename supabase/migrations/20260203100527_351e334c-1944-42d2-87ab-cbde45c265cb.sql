-- Drop the overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can insert email_instructions" ON public.email_instructions;
DROP POLICY IF EXISTS "Authenticated users can update email_instructions" ON public.email_instructions;
DROP POLICY IF EXISTS "Authenticated users can delete email_instructions" ON public.email_instructions;

-- Recreate with proper auth check (matching analyse_instructions pattern)
CREATE POLICY "Authenticated users can create email_instructions"
  ON public.email_instructions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update email_instructions"
  ON public.email_instructions FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete email_instructions"
  ON public.email_instructions FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);