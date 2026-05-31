-- Fix signup: store name/role from auth metadata in the profile trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  meta_role text := nullif(trim(new.raw_user_meta_data->>'role'), '');
  safe_role text := 'user';
BEGIN
  IF meta_role IN ('user', 'turf_official') THEN
    safe_role := meta_role;
  END IF;

  INSERT INTO public.users (id, email, name, role)
  VALUES (
    new.id,
    new.email,
    nullif(trim(new.raw_user_meta_data->>'name'), ''),
    safe_role
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, public.users.name),
    role = EXCLUDED.role;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Allow users to create their own profile row if the trigger did not run
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
CREATE POLICY "Users can insert their own profile"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);
