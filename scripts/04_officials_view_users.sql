-- Allow officials to view user profiles when managing reservations
DROP POLICY IF EXISTS "Officials can view user profiles" ON users;

CREATE POLICY "Officials can view user profiles"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.role IN ('admin', 'turf_official')
    )
  );
