import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, MapPin, Music, X, Send, CheckCircle2, Film } from "lucide-react";
import { BackButton } from "@/components/navigation/back-button";
import { UploadMedia } from "@/components/upload";
import { MediaFile, formatFileSize } from "@/lib/upload";
import { StatusBar } from "@/components/phone-frame";
import { toast } from "sonner";
import {
  REEL_MAX_CAPTION_LENGTH,
  REEL_MAX_DURATION_SECONDS,
  REEL_MAX_FILE_SIZE,
} from "@/lib/reels/reel-limits";
import {
  isSupabaseConfigured,
  publishReel,
  validateReelVideo,
  type ReelValidationError,
} from "@/lib/reels/reel-publish";
import type { ReelContextType } from "@/lib/reels/reel-local-storage";
import { MOCK_REELS } from "@/lib/reels/reel-mocks";
import { formatDuration } from "@/lib/reels/reel-utils";

export const Route = createFileRoute("/_app/gerenciar/novo-reel")({
  head: () => ({ meta: [{ title: "Novo reel — Connexy" }] }),
  component: NovoReel,
});

type ReelPublishState =
  "idle" | "validating" | "uploading" | "saving" | "saving_local" | "success" | "error";

interface ContextOption {
  tipo: ReelContextType;
  id: string;
  titulo: string;
  emoji: string;
}

const CONTEXT_TYPES: { tipo: ReelContextType; label: string; emoji: string }[] = [
  { tipo: "local", label: "Local", emoji: "📍" },
  { tipo: "negocio", label: "Negócio", emoji: "🏢" },
  { tipo: "oferta", label: "Oferta", emoji: "🏷️" },
  { tipo: "evento", label: "Evento", emoji: "🎉" },
];

function buildContextOptions(): ContextOption[] {
  const options: ContextOption[] = [];
  const seen = new Set<string>();
  const add = (tipo: ReelContextType, id: string, titulo: string, emoji: string) => {
    const key = `${tipo}:${id}`;
    if (seen.has(key)) return;
    seen.add(key);
    options.push({ tipo, id, titulo, emoji });
  };
  for (const reel of MOCK_REELS) {
    if (reel.location) add("local", reel.location.id, reel.location.name, "📍");
    if (reel.business) {
      add("negocio", reel.business.id, reel.business.name, "🏢");
      add("oferta", reel.business.id, reel.business.name, "🏷️");
    }
    if (reel.event) add("evento", reel.event.id, reel.event.name, "🎉");
  }
  return options;
}

function validationMessage(error: ReelValidationError): string {
  switch (error) {
    case "empty":
      return "Escolha um vídeo";
    case "type":
      return "Formato não suportado — use MP4, MOV ou WebM";
    case "size":
      return `Vídeo deve ter até ${formatFileSize(REEL_MAX_FILE_SIZE)}`;
    case "duration":
      return `Vídeo deve ter até ${REEL_MAX_DURATION_SECONDS}s`;
  }
}

function NovoReel() {
  const nav = useNavigate();
  const [media, setMedia] = useState<MediaFile[]>([]);
  const [posterBlob, setPosterBlob] = useState<Blob | null>(null);
  const [durationS, setDurationS] = useState(0);
  const [caption, setCaption] = useState("");
  const [context, setContext] = useState<{ tipo: ReelContextType; id: string } | null>(null);
  const [publishState, setPublishState] = useState<ReelPublishState>("idle");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const previewUrlRef = useRef<string | null>(null);

  const videoFile = media[0]?.file ?? null;
  const videoUrl = media[0]?.preview ?? null;
  const contextOptions = useMemo(buildContextOptions, []);
  const selectedContext = context
    ? (contextOptions.find((o) => o.tipo === context.tipo && o.id === context.id) ?? null)
    : null;
  const processing =
    publishState === "validating" ||
    publishState === "uploading" ||
    publishState === "saving" ||
    publishState === "saving_local";

  useEffect(() => {
    previewUrlRef.current = videoUrl;
  }, [videoUrl]);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  function clearSelection() {
    const url = previewUrlRef.current;
    if (url) {
      URL.revokeObjectURL(url);
      previewUrlRef.current = null;
    }
    setMedia([]);
    setPosterBlob(null);
    setDurationS(0);
  }

  function handleFilesChange(files: MediaFile[]) {
    if (files.length === 0) {
      clearSelection();
      return;
    }
    const file = files[0].file;
    const error = validateReelVideo(file, 0);
    if (error === "type" || error === "size") {
      toast.error(validationMessage(error));
      clearSelection();
      return;
    }
    setMedia(files);
    setPosterBlob(null);
    setDurationS(0);
  }

  function handleLoadedMetadata() {
    const v = videoRef.current;
    if (!v) return;
    const duration = Number.isFinite(v.duration) ? Math.round(v.duration) : 0;
    setDurationS(duration);
    if (duration > REEL_MAX_DURATION_SECONDS) {
      toast.error(validationMessage("duration"));
      clearSelection();
      return;
    }
    v.currentTime = 0.1;
  }

  function grabPoster() {
    const v = videoRef.current;
    if (!v) return;
    const canvas = document.createElement("canvas");
    canvas.width = v.videoWidth || 720;
    canvas.height = v.videoHeight || 1280;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (blob) setPosterBlob(blob);
      },
      "image/jpeg",
      0.82,
    );
  }

  async function handlePublish() {
    if (processing) return;
    const file = videoFile;
    const error = validateReelVideo(file, durationS);
    if (error) {
      toast.error(validationMessage(error));
      return;
    }

    setPublishState("validating");
    try {
      setPublishState(isSupabaseConfigured() ? "uploading" : "saving_local");
      const result = await publishReel({
        file: file as File,
        caption,
        context: selectedContext
          ? { tipo: selectedContext.tipo, id: selectedContext.id, titulo: selectedContext.titulo }
          : null,
        posterBlob,
        durationS,
      });
      setPublishState("success");
      toast.success(
        result.persistence === "supabase"
          ? "Reel publicado!"
          : "Reel salvo neste dispositivo (modo de desenvolvimento)",
      );
      nav({ to: "/reels/$reelId", params: { reelId: result.reel.id } });
    } catch (err) {
      console.error("[NovoReel] Falha ao publicar", err);
      setPublishState("error");
      toast.error("Falha ao publicar o reel. Tente novamente.");
    }
  }

  const publishLabel = (() => {
    switch (publishState) {
      case "validating":
        return "Validando vídeo…";
      case "uploading":
        return "Enviando…";
      case "saving":
        return "Salvando…";
      case "saving_local":
        return "Salvando neste dispositivo…";
      case "success":
        return "Publicado!";
      case "error":
        return "Tentar novamente";
      default:
        return "Publicar reel";
    }
  })();

  return (
    <div className="flex-1 flex flex-col pb-8">
      <StatusBar />
      <header className="px-4 pt-1 pb-3 flex items-center gap-2">
        <BackButton
          fallbackTo="/reels"
          className="h-9 w-9 grid place-items-center rounded-full bg-secondary"
        />
        <div className="flex-1">
          <h1 className="font-display font-bold text-lg">Novo reel</h1>
          <p className="text-[11px] text-muted-foreground">
            Um momento real de um lugar do Connexy
          </p>
        </div>
      </header>

      <div className="px-4 space-y-4">
        <section className="space-y-2">
          <SectionLabel icon={<Film className="h-3.5 w-3.5" />} text="1 · Vídeo" />
          {!videoUrl ? (
            <UploadMedia
              mode="video"
              value={media}
              onChange={handleFilesChange}
              label="Escolher vídeo"
            />
          ) : (
            <div className="relative rounded-3xl overflow-hidden bg-black aspect-[9/16] max-h-[46vh]">
              <video
                key={videoUrl}
                ref={videoRef}
                src={videoUrl}
                muted
                playsInline
                controls
                onLoadedMetadata={handleLoadedMetadata}
                onSeeked={grabPoster}
                className="absolute inset-0 h-full w-full object-cover"
              />
              <button
                onClick={clearSelection}
                aria-label="Remover vídeo"
                className="absolute top-2 right-2 h-8 w-8 grid place-items-center rounded-full bg-black/60 text-white z-10"
              >
                <X className="h-4 w-4" />
              </button>
              {durationS > 0 && (
                <div className="absolute bottom-2 left-2 rounded-full bg-black/60 text-white text-[10px] px-2 py-1 z-10">
                  {formatDuration(durationS)}
                </div>
              )}
            </div>
          )}
          {videoFile && (
            <p className="text-[11px] text-muted-foreground">
              {videoFile.name} · {formatFileSize(videoFile.size)} · até {REEL_MAX_DURATION_SECONDS}s
            </p>
          )}
        </section>

        <section className="rounded-3xl bg-surface border border-border p-4 space-y-3 shadow-soft">
          <SectionLabel icon={<Music className="h-3.5 w-3.5" />} text="2 · Legenda" />
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            maxLength={REEL_MAX_CAPTION_LENGTH}
            placeholder="Conte o que rolou nesse momento…"
            className="w-full min-h-[70px] rounded-2xl bg-secondary p-3 text-sm outline-none focus:ring-2 focus:ring-primary/40 resize-none"
          />
          <p className="text-right text-[11px] text-muted-foreground">
            {caption.length}/{REEL_MAX_CAPTION_LENGTH}
          </p>
        </section>

        <section className="rounded-3xl bg-surface border border-border p-4 space-y-3 shadow-soft">
          <SectionLabel icon={<MapPin className="h-3.5 w-3.5" />} text="3 · Contexto (opcional)" />
          <div className="flex flex-wrap gap-2">
            {CONTEXT_TYPES.map((type) => {
              const active = context?.tipo === type.tipo;
              return (
                <button
                  key={type.tipo}
                  onClick={() => {
                    if (active) {
                      setContext(null);
                    } else {
                      setContext({ tipo: type.tipo, id: "" });
                    }
                  }}
                  aria-pressed={active}
                  className={`h-9 px-3 rounded-full text-xs font-semibold transition-colors ${
                    active
                      ? "bg-gradient-brand text-white shadow"
                      : "bg-secondary text-muted-foreground hover:bg-border"
                  }`}
                >
                  {type.emoji} {type.label}
                </button>
              );
            })}
          </div>

          {context && (
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
              {contextOptions
                .filter((o) => o.tipo === context.tipo)
                .map((option) => {
                  const active = context.id === option.id;
                  return (
                    <button
                      key={`${option.tipo}:${option.id}`}
                      onClick={() => setContext({ tipo: option.tipo, id: option.id })}
                      aria-pressed={active}
                      className={`flex items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                        active ? "bg-primary/15 ring-1 ring-primary/40" : "bg-secondary"
                      }`}
                    >
                      <span className="text-base">{option.emoji}</span>
                      <span className="min-w-0 truncate text-muted-foreground">
                        {option.titulo}
                      </span>
                    </button>
                  );
                })}
            </div>
          )}
          {selectedContext && (
            <p className="text-[11px] text-muted-foreground">
              Contexto: {selectedContext.emoji} {selectedContext.titulo}
            </p>
          )}
        </section>

        <section className="rounded-3xl bg-surface border border-border p-4 space-y-3 shadow-soft">
          <SectionLabel
            icon={<CheckCircle2 className="h-3.5 w-3.5" />}
            text="4 · Revisar e publicar"
          />
          <div className="rounded-2xl bg-secondary p-3 space-y-1.5 text-sm">
            <Row
              label="Vídeo"
              value={
                videoFile
                  ? `${formatDuration(durationS)} · ${formatFileSize(videoFile.size)}`
                  : "Não escolhido"
              }
            />
            <Row label="Legenda" value={caption.trim() ? caption.trim() : "Sem legenda"} />
            <Row
              label="Contexto"
              value={
                selectedContext ? `${selectedContext.emoji} ${selectedContext.titulo}` : "Nenhum"
              }
            />
            {isSupabaseConfigured() && (
              <Row label="Destino" value="Supabase (com fallback local)" />
            )}
          </div>

          <button
            onClick={handlePublish}
            disabled={processing || !videoFile}
            className="w-full h-12 rounded-2xl bg-gradient-brand text-white font-semibold shadow-elegant flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {processing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}{" "}
            {publishLabel}
          </button>
          {publishState === "error" && (
            <p className="text-[11px] text-red-500 text-center">
              Algo deu errado. Verifique sua conexão e tente novamente.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}

function SectionLabel({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
      <span className="text-primary">{icon}</span> {text}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 truncate text-right font-medium">{value}</span>
    </div>
  );
}
