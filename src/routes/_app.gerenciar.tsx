import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { StatusBar } from "@/components/phone-frame";
import { toast } from "sonner";
import {
  ChevronLeft,
  Loader2,
  Plus,
  Trash2,
  Image as ImageIcon,
  Video,
  MapPin,
  Save,
  LogOut,
  User as UserIcon,
  FileText,
  ExternalLink,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Profile = {
  id: string;
  handle: string | null;
  name: string | null;
  age: number | null;
  photo_url: string | null;
  bio: string | null;
  headline: string | null;
  mood_emoji: string | null;
  mood_text: string | null;
  interests: string[];
  vibe_tags: string[];
  looks_for: string[];
};

type Place = { id: string; name: string; slug: string | null };

type BioPost = {
  id: string;
  text: string;
  media_url: string | null;
  media_kind: "image" | "video" | null;
  place_id: string | null;
  created_at: string;
};

export const Route = createFileRoute("/_app/gerenciar")({
  head: () => ({ meta: [{ title: "Gerenciar sua bio — Connecta" }] }),
  component: Gerenciar,
});

function Gerenciar() {
  const { user, loading: authLoading } = useAuth();
  const nav = useNavigate();
  const [tab, setTab] = useState<"perfil" | "posts">("perfil");

  useEffect(() => {
    if (!authLoading && !user) nav({ to: "/auth" });
  }, [authLoading, user, nav]);

  if (authLoading || !user) {
    return (
      <div className="flex-1 grid place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col pb-24">
      <StatusBar />
      <header className="px-4 pt-1 pb-3 flex items-center gap-2">
        <Link to="/perfil" className="h-9 w-9 grid place-items-center rounded-full bg-secondary">
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <h1 className="font-display font-bold text-lg">Gerenciar sua bio</h1>
          <p className="text-[11px] text-muted-foreground">
            Isto é o que as pessoas verão sobre você
          </p>
        </div>
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            toast.success("Você saiu");
            nav({ to: "/auth" });
          }}
          className="h-9 w-9 grid place-items-center rounded-full bg-secondary text-muted-foreground"
          aria-label="Sair"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </header>

      <div className="mx-4 grid grid-cols-2 rounded-2xl bg-secondary p-1">
        {(["perfil", "posts"] as const).map((k) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`h-10 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 transition-all ${tab === k ? "bg-surface text-primary shadow-soft" : "text-muted-foreground"}`}
          >
            {k === "perfil" ? <UserIcon className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
            {k === "perfil" ? "Perfil" : "Meus posts"}
          </button>
        ))}
      </div>

      {tab === "perfil" ? <PerfilTab userId={user.id} /> : <PostsTab userId={user.id} />}
    </div>
  );
}

function PerfilTab({ userId }: { userId: string }) {
  const [p, setP] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);
  const [interestsText, setInterestsText] = useState("");
  const [vibeText, setVibeText] = useState("");
  const [looksText, setLooksText] = useState("");

  useEffect(() => {
    supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle()
      .then(({ data }) => {
        const prof = (data as Profile | null) ?? {
          id: userId,
          handle: null,
          name: null,
          age: null,
          photo_url: null,
          bio: null,
          headline: null,
          mood_emoji: null,
          mood_text: null,
          interests: [],
          vibe_tags: [],
          looks_for: [],
        };
        setP(prof);
        setInterestsText((prof.interests ?? []).join(", "));
        setVibeText((prof.vibe_tags ?? []).join(", "));
        setLooksText((prof.looks_for ?? []).join(", "));
      });
  }, [userId]);

  if (!p)
    return (
      <div className="p-6 grid place-items-center">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );

  async function uploadPhoto(file: File) {
    const path = `${userId}/avatar-${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("bio-media").upload(path, file, { upsert: true });
    if (error) {
      toast.error("Falha no upload");
      return;
    }
    const { data } = supabase.storage.from("bio-media").getPublicUrl(path);
    setP((prev) => prev && { ...prev, photo_url: data.publicUrl });
  }

  async function save() {
    if (!p) return;
    setSaving(true);
    const payload = {
      ...p,
      interests: parseCsv(interestsText),
      vibe_tags: parseCsv(vibeText),
      looks_for: parseCsv(looksText),
    };
    const { error } = await supabase.from("profiles").upsert(payload);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Bio atualizada!");
  }

  return (
    <div className="px-4 mt-4 space-y-4">
      <div className="rounded-3xl bg-surface border border-border p-4 shadow-soft">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={p.photo_url ?? `https://api.dicebear.com/9.x/initials/svg?seed=${p.name ?? "?"}`}
              alt=""
              className="h-16 w-16 rounded-2xl object-cover ring-2 ring-primary/20"
            />
            <label className="absolute -bottom-1 -right-1 h-6 w-6 grid place-items-center rounded-full bg-gradient-brand text-white cursor-pointer">
              <ImageIcon className="h-3 w-3" />
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => e.target.files?.[0] && uploadPhoto(e.target.files[0])}
              />
            </label>
          </div>
          <div className="flex-1 space-y-1.5">
            <Field label="Nome" v={p.name ?? ""} onChange={(v) => setP({ ...p, name: v })} />
            <Field label="@handle" v={p.handle ?? ""} onChange={(v) => setP({ ...p, handle: v })} />
          </div>
        </div>
      </div>

      <Section title="Sobre você">
        <Field
          label="Frase de capa"
          placeholder="Ex.: Vinil, café e caminhadas sem destino"
          v={p.headline ?? ""}
          onChange={(v) => setP({ ...p, headline: v })}
        />
        <TextArea
          label="Bio"
          v={p.bio ?? ""}
          onChange={(v) => setP({ ...p, bio: v })}
          placeholder="Conte um pouco de você…"
        />
        <div className="grid grid-cols-2 gap-2">
          <Field
            label="Humor (emoji)"
            placeholder="☕"
            v={p.mood_emoji ?? ""}
            onChange={(v) => setP({ ...p, mood_emoji: v })}
          />
          <Field
            label="Humor (texto)"
            placeholder="modo café"
            v={p.mood_text ?? ""}
            onChange={(v) => setP({ ...p, mood_text: v })}
          />
        </div>
        <Field
          label="Idade"
          type="number"
          v={p.age?.toString() ?? ""}
          onChange={(v) => setP({ ...p, age: v ? Number(v) : null })}
        />
      </Section>

      <Section title="Tags (separadas por vírgula)">
        <Field
          label="Interesses"
          v={interestsText}
          onChange={setInterestsText}
          placeholder="Café, Música, Arte…"
        />
        <Field label="Vibe" v={vibeText} onChange={setVibeText} placeholder="cinéfilo, corujão…" />
        <Field
          label="Aqui buscando"
          v={looksText}
          onChange={setLooksText}
          placeholder="amizade, network…"
        />
      </Section>

      <button
        onClick={save}
        disabled={saving}
        className="w-full h-12 rounded-2xl bg-gradient-brand text-white font-semibold shadow-elegant flex items-center justify-center gap-2 disabled:opacity-70"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Salvar bio
      </button>
      <Link
        to="/perfil/$id"
        params={{ id: userId }}
        className="block text-center text-sm text-primary font-semibold inline-flex items-center justify-center gap-1 w-full"
      >
        Ver minha bio pública <ExternalLink className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

function PostsTab({ userId }: { userId: string }) {
  const [posts, setPosts] = useState<BioPost[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newText, setNewText] = useState("");
  const [newMedia, setNewMedia] = useState<{ url: string; kind: "image" | "video" } | null>(null);
  const [newPlaceId, setNewPlaceId] = useState<string>("");
  const [uploading, setUploading] = useState(false);

  const reload = async () => {
    setLoading(true);
    const [{ data: posts }, { data: pls }] = await Promise.all([
      supabase
        .from("bio_posts")
        .select("*")
        .eq("author_id", userId)
        .order("created_at", { ascending: false }),
      supabase.from("places").select("id, name, slug"),
    ]);
    setPosts((posts as BioPost[]) ?? []);
    setPlaces((pls as Place[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    reload();
  }, [userId]);

  async function upload(file: File) {
    setUploading(true);
    const path = `${userId}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("bio-media").upload(path, file);
    setUploading(false);
    if (error) {
      toast.error("Falha no upload");
      return;
    }
    const { data } = supabase.storage.from("bio-media").getPublicUrl(path);
    const kind: "image" | "video" = file.type.startsWith("video") ? "video" : "image";
    setNewMedia({ url: data.publicUrl, kind });
  }

  async function create() {
    if (!newText.trim()) {
      toast.error("Escreva algo primeiro");
      return;
    }
    const { error } = await supabase.from("bio_posts").insert({
      author_id: userId,
      text: newText.trim(),
      media_url: newMedia?.url ?? null,
      media_kind: newMedia?.kind ?? null,
      place_id: newPlaceId || null,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Post publicado!");
    setNewText("");
    setNewMedia(null);
    setNewPlaceId("");
    setCreating(false);
    reload();
  }

  async function remove(id: string) {
    const { error } = await supabase.from("bio_posts").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Post apagado");
    setPosts((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div className="px-4 mt-4 space-y-3">
      <button
        onClick={() => setCreating((s) => !s)}
        className="w-full h-12 rounded-2xl bg-gradient-brand text-white font-semibold shadow-elegant flex items-center justify-center gap-2"
      >
        <Plus className="h-4 w-4" /> {creating ? "Fechar" : "Novo post"}
      </button>

      <AnimatePresence>
        {creating && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-3xl bg-surface border border-border p-4 space-y-3 shadow-soft"
          >
            <textarea
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder="O que você quer compartilhar?"
              className="w-full min-h-[80px] rounded-2xl bg-secondary p-3 text-sm outline-none focus:ring-2 focus:ring-primary/40 resize-none"
            />
            {newMedia && (
              <div className="relative rounded-2xl overflow-hidden">
                {newMedia.kind === "image" ? (
                  <img src={newMedia.url} alt="" className="w-full max-h-52 object-cover" />
                ) : (
                  <video src={newMedia.url} controls className="w-full max-h-52" />
                )}
                <button
                  onClick={() => setNewMedia(null)}
                  className="absolute top-2 right-2 h-7 w-7 grid place-items-center rounded-full bg-foreground/60 text-white"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
            <div className="flex items-center gap-2">
              <label className="flex-1 h-10 rounded-xl bg-accent text-primary font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer">
                <ImageIcon className="h-4 w-4" /> Foto
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
                />
              </label>
              <label className="flex-1 h-10 rounded-xl bg-accent text-primary font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer">
                <Video className="h-4 w-4" /> Vídeo
                <input
                  type="file"
                  accept="video/*"
                  hidden
                  onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
                />
              </label>
            </div>
            <select
              value={newPlaceId}
              onChange={(e) => setNewPlaceId(e.target.value)}
              className="w-full h-10 rounded-xl bg-secondary px-3 text-xs outline-none"
            >
              <option value="">📍 Vincular a um local (opcional)</option>
              {places.map((pl) => (
                <option key={pl.id} value={pl.id}>
                  {pl.name}
                </option>
              ))}
            </select>
            <button
              onClick={create}
              disabled={uploading}
              className="w-full h-11 rounded-2xl bg-gradient-brand text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}{" "}
              Publicar
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="grid place-items-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-10 rounded-3xl border border-dashed border-border">
          <p className="text-sm text-muted-foreground">Você ainda não tem posts.</p>
          <p className="text-xs text-muted-foreground mt-1">
            Publique algo — vai aparecer na sua bio pública.
          </p>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {posts.map((post) => {
            const pl = places.find((x) => x.id === post.place_id);
            return (
              <li
                key={post.id}
                className="rounded-2xl border border-border bg-surface overflow-hidden shadow-soft"
              >
                {post.media_url && post.media_kind === "image" && (
                  <img src={post.media_url} alt="" className="w-full h-40 object-cover" />
                )}
                {post.media_url && post.media_kind === "video" && (
                  <video src={post.media_url} controls className="w-full h-40 object-cover" />
                )}
                <div className="p-3">
                  <p className="text-sm">{post.text}</p>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                    <div>
                      {pl && (
                        <span className="text-primary font-semibold inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {pl.name}
                        </span>
                      )}
                      <span className="ml-2">
                        {new Date(post.created_at).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                    <button
                      onClick={() => remove(post.id)}
                      className="text-destructive inline-flex items-center gap-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Apagar
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function parseCsv(s: string) {
  return s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl bg-surface border border-border p-4 space-y-2.5 shadow-soft">
      <h3 className="font-display font-bold text-sm">{title}</h3>
      {children}
    </div>
  );
}
function Field({
  label,
  v,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  v: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <input
        value={v}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        type={type}
        className="mt-1 w-full h-10 rounded-xl bg-secondary px-3 text-sm outline-none focus:ring-2 focus:ring-primary/40"
      />
    </label>
  );
}
function TextArea({
  label,
  v,
  onChange,
  placeholder,
}: {
  label: string;
  v: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <textarea
        value={v}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full min-h-[70px] rounded-xl bg-secondary p-3 text-sm outline-none focus:ring-2 focus:ring-primary/40 resize-none"
      />
    </label>
  );
}
