
DROP POLICY IF EXISTS "avatars read" ON storage.objects;
DROP POLICY IF EXISTS "avatars write" ON storage.objects;
DROP POLICY IF EXISTS "logos read" ON storage.objects;
DROP POLICY IF EXISTS "logos write" ON storage.objects;

CREATE POLICY "avatars read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'avatars');
CREATE POLICY "avatars write" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'avatars' AND owner = auth.uid())
  WITH CHECK (bucket_id = 'avatars' AND owner = auth.uid());

CREATE POLICY "logos read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'logos');
CREATE POLICY "logos write" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'logos' AND owner = auth.uid())
  WITH CHECK (bucket_id = 'logos' AND owner = auth.uid());
