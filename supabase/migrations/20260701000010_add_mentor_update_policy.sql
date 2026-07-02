-- SQL Migration to allow mentors to update their own profile and availability records
CREATE POLICY "Mentors can update their own mentor profile" 
ON public.mentors 
FOR UPDATE 
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
