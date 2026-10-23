
-- ============================================================
-- Ensure `bio-media` and `reels-media` buckets exist remotely.
--
-- Background:
--   * `bio-media` and `reels-media` are declared in supabase/config.toml,
--     but config.toml only seeds the LOCAL stack. It never materializes
--     buckets on a linked/remote project.
--   * Their storage.objects policies already exist via earlier migrations
--     (20260709..., 20260710..., 20260810..., 20260825...), so this
--     migration creates NO policies and alters NO permission.
--   * Only the `avatars` bucket had an explicit INSERT (20260816120000);
--     this mirrors that pattern for the two remaining active buckets.
--
-- Idempotent: safe to re-run (ON CONFLICT).
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'bio-media',
  'bio-media',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'reels-media',
  'reels-media',
  true,
  52428800,
  ARRAY['video/mp4', 'video/quicktime', 'video/webm', 'image/jpeg']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;
