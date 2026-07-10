
-- ============ REELS ============
CREATE TABLE public.reels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  video_url text NOT NULL,
  poster_url text,
  caption text,
  place_id uuid REFERENCES public.places(id) ON DELETE SET NULL,
  audio_label text,
  tagged_user_ids uuid[] NOT NULL DEFAULT '{}',
  duration_s integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX reels_created_at_idx ON public.reels (created_at DESC);
CREATE INDEX reels_author_idx ON public.reels (author_id);

GRANT SELECT ON public.reels TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.reels TO authenticated;
GRANT ALL ON public.reels TO service_role;

ALTER TABLE public.reels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reels are public" ON public.reels FOR SELECT USING (true);
CREATE POLICY "Author can insert reel" ON public.reels FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Author can update reel" ON public.reels FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Author can delete reel" ON public.reels FOR DELETE USING (auth.uid() = author_id);

-- ============ REEL LIKES ============
CREATE TABLE public.reel_likes (
  reel_id uuid NOT NULL REFERENCES public.reels(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (reel_id, user_id)
);
CREATE INDEX reel_likes_reel_idx ON public.reel_likes (reel_id);

GRANT SELECT ON public.reel_likes TO anon, authenticated;
GRANT INSERT, DELETE ON public.reel_likes TO authenticated;
GRANT ALL ON public.reel_likes TO service_role;

ALTER TABLE public.reel_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Likes are public" ON public.reel_likes FOR SELECT USING (true);
CREATE POLICY "User can like" ON public.reel_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "User can unlike" ON public.reel_likes FOR DELETE USING (auth.uid() = user_id);

-- ============ REEL COMMENTS ============
CREATE TABLE public.reel_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reel_id uuid NOT NULL REFERENCES public.reels(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX reel_comments_reel_idx ON public.reel_comments (reel_id, created_at DESC);

GRANT SELECT ON public.reel_comments TO anon, authenticated;
GRANT INSERT, DELETE ON public.reel_comments TO authenticated;
GRANT ALL ON public.reel_comments TO service_role;

ALTER TABLE public.reel_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments are public" ON public.reel_comments FOR SELECT USING (true);
CREATE POLICY "Auth can comment" ON public.reel_comments FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Author can delete comment" ON public.reel_comments FOR DELETE USING (auth.uid() = author_id);

-- ============ STORAGE POLICIES (reels-media) ============
CREATE POLICY "Reels media public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'reels-media');

CREATE POLICY "Reels media auth upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'reels-media' AND auth.role() = 'authenticated');

CREATE POLICY "Reels media owner update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'reels-media' AND owner = auth.uid());

CREATE POLICY "Reels media owner delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'reels-media' AND owner = auth.uid());
