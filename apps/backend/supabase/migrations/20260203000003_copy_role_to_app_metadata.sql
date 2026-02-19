-- Copy the 'role' field from user_metadata to app_metadata on signup.
-- app_metadata is NOT writable by the client, so this prevents role escalation.
-- The backend auth repository reads from app_metadata first.

CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER AS $$
BEGIN
  NEW.raw_app_meta_data := COALESCE(NEW.raw_app_meta_data, '{}'::jsonb)
    || jsonb_build_object('role', COALESCE(NEW.raw_user_meta_data ->> 'role', 'patient'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run BEFORE INSERT so the role is set atomically during signup
CREATE TRIGGER on_auth_user_created_copy_role
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_role();
