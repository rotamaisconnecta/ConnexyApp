-- 1. Restrict media reads to signed-in users
DROP POLICY IF EXISTS "Bio media public read" ON storage.objects;
CREATE POLICY "Bio media authenticated read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'bio-media');

DROP POLICY IF EXISTS "Reels media public read" ON storage.objects;
CREATE POLICY "Reels media authenticated read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'reels-media');

-- 2. Folder-based ownership for reels media mutations
DROP POLICY IF EXISTS "Reels media owner delete" ON storage.objects;
CREATE POLICY "Reels media owner delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'reels-media' AND (storage.foldername(name))[1] = (auth.uid())::text);

DROP POLICY IF EXISTS "Reels media owner update" ON storage.objects;
CREATE POLICY "Reels media owner update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'reels-media' AND (storage.foldername(name))[1] = (auth.uid())::text)
  WITH CHECK (bucket_id = 'reels-media' AND (storage.foldername(name))[1] = (auth.uid())::text);

-- 3. Profiles: no anonymous access, signed-in reads only
REVOKE SELECT ON public.profiles FROM anon;
DROP POLICY IF EXISTS "Profiles are public" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;
CREATE POLICY "Authenticated users can view profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (true);