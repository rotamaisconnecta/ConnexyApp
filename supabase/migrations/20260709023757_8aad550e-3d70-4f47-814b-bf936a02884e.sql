
CREATE POLICY "Bio media public read" ON storage.objects FOR SELECT
  USING (bucket_id = 'bio-media');
CREATE POLICY "Bio media auth upload" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'bio-media' AND auth.uid() IS NOT NULL AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Bio media owner update" ON storage.objects FOR UPDATE
  USING (bucket_id = 'bio-media' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Bio media owner delete" ON storage.objects FOR DELETE
  USING (bucket_id = 'bio-media' AND (storage.foldername(name))[1] = auth.uid()::text);
