-- CRITICAL DELETION PERMISSIONS FIX
-- This script completely resets and opens up the 'archives' table.

-- 1. Enable Row Level Security (RLS) on the table
ALTER TABLE public.archives ENABLE ROW LEVEL SECURITY;

-- 2. Drop ANY conflicting policies that might block deletion (for all users/roles)
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.archives;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.archives;
DROP POLICY IF EXISTS "Enable insert access for all users" ON public.archives;
DROP POLICY IF EXISTS "Enable update access for all users" ON public.archives;
DROP POLICY IF EXISTS "Enable delete access for all users" ON public.archives;
DROP POLICY IF EXISTS "Enable all access for anon and authenticated" ON public.archives;

-- 3. Create a single, fully permissive policy for ALL operations (SELECT, INSERT, UPDATE, DELETE)
-- This applies to both anonymous (public) and authenticated users.
CREATE POLICY "Enable all access for anon and authenticated" ON public.archives
    FOR ALL
    TO anon, authenticated, service_role
    USING (true)
    WITH CHECK (true);

-- 4. Explicitly GRANT permissions to these roles
GRANT ALL ON TABLE public.archives TO anon;
GRANT ALL ON TABLE public.archives TO authenticated;
GRANT ALL ON TABLE public.archives TO service_role;

-- 5. Verify Sequence Ownership (often an issue)
GRANT USAGE, SELECT ON SEQUENCE archives_id_seq TO anon, authenticated, service_role;
