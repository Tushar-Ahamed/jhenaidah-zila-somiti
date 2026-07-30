/*
# Fix Profiles and Members RLS Policies

This migration allows public/authenticated read access to all profiles and members,
and allows insertion of member records during registration.
*/

-- 1. PROFILES TABLE: Allow public read of all user profiles so member directory and upazila lists can show all registered users
DROP POLICY IF EXISTS "public_read_profiles" ON profiles;
CREATE POLICY "public_read_profiles" ON profiles FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "allow_insert_profiles" ON profiles;
CREATE POLICY "allow_insert_profiles" ON profiles FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "allow_update_profiles" ON profiles;
CREATE POLICY "allow_update_profiles" ON profiles FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

-- 2. MEMBERS TABLE: Allow public read and write access for all members
DROP POLICY IF EXISTS "public_read_all_members" ON members;
DROP POLICY IF EXISTS "public_read_approved_members" ON members;
CREATE POLICY "public_read_all_members" ON members FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "allow_insert_members" ON members;
DROP POLICY IF EXISTS "insert_own_member" ON members;
CREATE POLICY "allow_insert_members" ON members FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "allow_update_members" ON members;
CREATE POLICY "allow_update_members" ON members FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
