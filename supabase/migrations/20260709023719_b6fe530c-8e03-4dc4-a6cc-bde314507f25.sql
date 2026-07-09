
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  handle TEXT UNIQUE,
  name TEXT,
  age INT,
  photo_url TEXT,
  bio TEXT,
  headline TEXT,
  mood_emoji TEXT,
  mood_text TEXT,
  now_playing_kind TEXT CHECK (now_playing_kind IN ('music','reading','watching')),
  now_playing_title TEXT,
  now_playing_subtitle TEXT,
  interests TEXT[] NOT NULL DEFAULT '{}',
  vibe_tags TEXT[] NOT NULL DEFAULT '{}',
  looks_for TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are public" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE TABLE public.places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  cover_url TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.places TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.places TO authenticated;
GRANT ALL ON public.places TO service_role;
ALTER TABLE public.places ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Places are public" ON public.places FOR SELECT USING (true);
CREATE POLICY "Owner can insert place" ON public.places FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owner can update place" ON public.places FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Owner can delete place" ON public.places FOR DELETE USING (auth.uid() = owner_id);

INSERT INTO public.places (slug, name, description, category, cover_url, lat, lng) VALUES
  ('cafe-central', 'Café Central', 'Cafeteria com grãos especiais, torra artesanal e boa trilha sonora.', 'Cafés', 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800', -23.5610, -46.6560),
  ('sunset-parque', 'Sunset no Parque', 'Pôr do sol com DJ set e food trucks no Parque Ibirapuera.', 'Eventos', 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800', -23.5874, -46.6576),
  ('burger-house', 'Burger House', 'Smash burgers, batata rústica e chopes gelados.', 'Restaurantes', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800', -23.5620, -46.6550),
  ('vinil-store', 'Vinil & Cia', 'Discos raros, toca-discos e acessórios.', 'Lojas', 'https://images.unsplash.com/photo-1483412033650-1015ddeb83d1?w=800', -23.5640, -46.6580);

CREATE TABLE public.bio_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  media_url TEXT,
  media_kind TEXT CHECK (media_kind IN ('image','video')),
  place_id UUID REFERENCES public.places(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.bio_posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bio_posts TO authenticated;
GRANT ALL ON public.bio_posts TO service_role;
ALTER TABLE public.bio_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Bio posts are public" ON public.bio_posts FOR SELECT USING (true);
CREATE POLICY "Author can insert bio post" ON public.bio_posts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Author can update bio post" ON public.bio_posts FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Author can delete bio post" ON public.bio_posts FOR DELETE USING (auth.uid() = author_id);

CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, name, photo_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
