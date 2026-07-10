import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, Loader2, Upload, MapPin, Music, Users, Send, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { StatusBar } from "@/components/phone-frame";
import { toast } from "sonner";

type Place = { id: string; name: string };

export const Route = createFileRoute("/_app/gerenciar/novo-reel")({
  head: () => ({ meta: [{ title: "Novo reel — Connecta" }] }),
  component: NovoReel,
});

function NovoReel() {
  const { user, loading: authLoading } = useAuth();
  const nav = useNavigate();
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [posterBlob, setPosterBlob] = useState<Blob | null>(null);
  const [durationS, setDurationS] = useState<number>(0);
  const [caption, setCaption] = useState("");
  const [audioLabel, setAudioLabel] = useState("");
  const [placeId, setPlaceId] = useState("");
  const [tagged, setTagged] = useState("");
  const [places, setPlaces] = useState<Place[]>([]);
  const [posting, setPosting] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!authLoading && !user) nav({ to: "/auth" });
  }, [authLoading, user, nav]);

  useEffect(() => {
    supabase.from("places").select("id, name").order("name").then(({ data }) => setPlaces((data as Place[]) ?? []));
  }, []);

  function onPickVideo(file: File) {
    if (file.size > 60 * 1024 * 1024) { toast.error("Vídeo maior que 60 MB"); return; }
    setVideoFile(file);
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
  }

  async function grabPoster() {
    const v = videoRef.current;
    if (!v) return;
    const canvas = document.createElement("canvas");
    canvas.width = v.videoWidth || 720;
    canvas.height = v.videoHeight || 1280;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => { if (blob) setPosterBlob(blob); }, "image/jpeg", 0.82);
    setDurationS(Math.round(v.duration || 0));
  }

  async function publish() {
    if (!user) return;
    if (!videoFile) { toast.error("Escolha um vídeo"); return; }
    if (durationS > 90) { toast.error("Vídeo deve ter até 90s"); return; }
    setPosting(true);
    try {
      const ext = videoFile.name.split(".").pop() ?? "mp4";
      const vidPath = `${user.id}/${Date.now()}.${ext}`;
      const { error: vErr } = await supabase.storage.from("reels-media").upload(vidPath, videoFile, { contentType: videoFile.type });
      if (vErr) throw vErr;

      let posterPath: string | null = null;
      if (posterBlob) {
        const pPath = `${user.id}/${Date.now()}-poster.jpg`;
        const { error: pErr } = await supabase.storage.from("reels-media").upload(pPath, posterBlob, { contentType: "image/jpeg" });
        if (!pErr) posterPath = pPath;
      }

      const taggedIds = tagged.split(",").map((s) => s.trim()).filter(Boolean);

      // Store storage paths (bucket is private → feed resolves signed URLs on read)
      const { error: iErr } = await supabase.from("reels").insert({
        author_id: user.id,
        video_url: vidPath,
        poster_url: posterPath,
        caption: caption.trim() || null,
        audio_label: audioLabel.trim() || null,
        place_id: placeId || null,
        tagged_user_ids: taggedIds,
        duration_s: durationS || null,
      });
      if (iErr) throw iErr;
      toast.success("Reel publicado!");
      nav({ to: "/reels" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao publicar");
    } finally {
      setPosting(false);
    }
  }

  if (authLoading || !user) {
    return <div className="flex-1 grid place-items-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="flex-1 flex flex-col pb-8">
      <StatusBar />
      <header className="px-4 pt-1 pb-3 flex items-center gap-2">
        <Link to="/reels" className="h-9 w-9 grid place-items-center rounded-full bg-secondary"><ChevronLeft className="h-4 w-4" /></Link>
        <div className="flex-1">
          <h1 className="font-display font-bold text-lg">Novo reel</h1>
          <p className="text-[11px] text-muted-foreground">Um momento real de um lugar do Connecta</p>
        </div>
      </header>

      <div className="px-4 space-y-3">
        {!videoUrl ? (
          <label className="block rounded-3xl border-2 border-dashed border-primary/40 bg-accent/40 p-8 text-center cursor-pointer hover:bg-accent/60 transition">
            <div className="mx-auto h-14 w-14 grid place-items-center rounded-2xl bg-gradient-brand text-white shadow-elegant">
              <Upload className="h-6 w-6" />
            </div>
            <p className="mt-3 font-semibold text-sm">Escolher vídeo</p>
            <p className="text-[11px] text-muted-foreground mt-1">MP4 ou WebM · até 90s · vertical funciona melhor</p>
            <input type="file" accept="video/mp4,video/webm" hidden onChange={(e) => e.target.files?.[0] && onPickVideo(e.target.files[0])} />
          </label>
        ) : (
          <div className="relative rounded-3xl overflow-hidden bg-black aspect-[9/16] max-h-[46vh]">
            <video
              ref={videoRef}
              src={videoUrl}
              muted
              playsInline
              controls
              onLoadedMetadata={() => { if (videoRef.current) { videoRef.current.currentTime = 0.1; } }}
              onSeeked={grabPoster}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <button
              onClick={() => { setVideoUrl(null); setVideoFile(null); setPosterBlob(null); setDurationS(0); }}
              className="absolute top-2 right-2 h-8 w-8 grid place-items-center rounded-full bg-black/60 text-white z-10"
            ><X className="h-4 w-4" /></button>
            {durationS > 0 && (
              <div className="absolute bottom-2 left-2 rounded-full bg-black/60 text-white text-[10px] px-2 py-1 z-10">{durationS}s</div>
            )}
          </div>
        )}

        <div className="rounded-3xl bg-surface border border-border p-4 space-y-3 shadow-soft">
          <textarea
            value={caption} onChange={(e) => setCaption(e.target.value)}
            maxLength={240}
            placeholder="Legenda: conte o que rolou nesse momento…"
            className="w-full min-h-[70px] rounded-2xl bg-secondary p-3 text-sm outline-none focus:ring-2 focus:ring-primary/40 resize-none"
          />
          <Field icon={<MapPin className="h-4 w-4" />} label="Lugar do momento">
            <select value={placeId} onChange={(e) => setPlaceId(e.target.value)}
              className="w-full h-10 rounded-xl bg-secondary px-3 text-sm outline-none">
              <option value="">Selecionar (opcional)</option>
              {places.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
          <Field icon={<Music className="h-4 w-4" />} label="Trilha">
            <input value={audioLabel} onChange={(e) => setAudioLabel(e.target.value)}
              placeholder="Ex.: The Nights – Avicii"
              className="w-full h-10 rounded-xl bg-secondary px-3 text-sm outline-none" />
          </Field>
          <Field icon={<Users className="h-4 w-4" />} label="Quem estava com você">
            <input value={tagged} onChange={(e) => setTagged(e.target.value)}
              placeholder="IDs separados por vírgula (opcional)"
              className="w-full h-10 rounded-xl bg-secondary px-3 text-sm outline-none" />
          </Field>
        </div>

        <button
          onClick={publish} disabled={posting || !videoFile}
          className="w-full h-12 rounded-2xl bg-gradient-brand text-white font-semibold shadow-elegant flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Publicar reel
        </button>
      </div>
    </div>
  );
}

function Field({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
        <span className="text-primary">{icon}</span> {label}
      </div>
      {children}
    </div>
  );
}
