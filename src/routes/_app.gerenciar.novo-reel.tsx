import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, MapPin, Music, Plus, X, Send, CheckCircle2, Film } from "lucide-react";
import { BackButton } from "@/components/navigation/back-button";
import { createMediaFile, formatFileSize, type MediaFile } from "@/lib/upload";
import { StatusBar } from "@/components/phone-frame";
import { ConnexyAiAssistant } from "@/components/ai/connexy-ai-assistant";
import { toast } from "sonner";
import { ReelRecorder, type RecordedClip } from "@/components/media/reel-recorder";
import { HashtagInput } from "@/components/post/hashtag-input";
import {
  REEL_MAX_CAPTION_LENGTH,
  REEL_MAX_DURATION_SECONDS,
  REEL_MAX_FILE_SIZE,
} from "@/lib/reels/reel-limits";
import {
  publishReel,
  validateReelVideo,
  willPublishReelRemotely,
  type ReelValidationError,
} from "@/lib/reels/reel-publish";
import type { ReelContextType } from "@/lib/reels/reel-local-storage";
import { MOCK_REELS } from "@/lib/reels/reel-mocks";
import { ReelCategory, type ReelCategoryValue } from "@/lib/reels/reel-types";
import {
  formatExactDurationLabel,
  readVideoDurationSeconds,
  resolveMediaDurationSeconds,
} from "@/lib/media/media-duration";
import {
  clearReelDraft,
  persistReelDraftClip,
  restoreReelDraftFile,
} from "@/lib/reels/reel-draft";

export const Route = createFileRoute("/_app/gerenciar/novo-reel")({
  head: () => ({ meta: [{ title: "Novo no Agora — Connexy" }] }),
  component: NovoReel,
});

type ReelPublishState =
  | "idle"
  | "validating"
  | "uploading"
  | "saving"
  | "saving_local"
  | "success"
  | "error";

interface ContextOption {
  tipo: ReelContextType;
  id: string;
  titulo: string;
  emoji: string;
}

const CONTEXT_CHIPS: { id: string; label: string; category: ReelCategoryValue; tipo?: ReelContextType }[] = [
  { id: "now", label: "Acontecendo agora", category: ReelCategory.MOMENT },
  { id: "place", label: "Lugar", category: ReelCategory.PLACE, tipo: "local" },
  { id: "event", label: "Evento", category: ReelCategory.EVENT, tipo: "evento" },
  { id: "people", label: "Pessoas", category: ReelCategory.PERSON },
  { id: "discover", label: "Descoberta", category: ReelCategory.NETWORKING },
  { id: "experience", label: "Experiência", category: ReelCategory.MOMENT },
  { id: "food", label: "Comida", category: ReelCategory.PLACE },
  { id: "music", label: "Música", category: ReelCategory.MOMENT },
  { id: "travel", label: "Viagem", category: ReelCategory.TRAVEL },
  { id: "sport", label: "Esporte", category: ReelCategory.MOMENT },
  { id: "work", label: "Trabalho", category: ReelCategory.NETWORKING },
  { id: "business", label: "Negócio", category: ReelCategory.BUSINESS, tipo: "negocio" },
  { id: "offer", label: "Oferta", category: ReelCategory.OFFER, tipo: "oferta" },
  { id: "other", label: "Outro", category: ReelCategory.MOMENT },
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
  const [mediaId, setMediaId] = useState<string | null>(null);
  const [durationLocked, setDurationLocked] = useState(false);
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [chipId, setChipId] = useState<string | null>(null);
  const [context, setContext] = useState<{ tipo: ReelContextType; id: string } | null>(null);
  const [publishState, setPublishState] = useState<ReelPublishState>("idle");
  const [processingPercent, setProcessingPercent] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const previewUrlRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const videoFile = media[0]?.file ?? null;
  const videoUrl = media[0]?.preview ?? null;
  const contextOptions = useMemo(buildContextOptions, []);
  const selectedChip = CONTEXT_CHIPS.find((chip) => chip.id === chipId) ?? null;
  const selectedContext = context
    ? (contextOptions.find((o) => o.tipo === context.tipo && o.id === context.id) ?? null)
    : null;
  const processing =
    publishState === "validating" ||
    publishState === "uploading" ||
    publishState === "saving" ||
    publishState === "saving_local" ||
    processingPercent != null;

  useEffect(() => {
    previewUrlRef.current = videoUrl;
  }, [videoUrl]);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  useEffect(() => {
    let active = true;
    void restoreReelDraftFile().then((restored) => {
      if (!active || !restored) return;
      const created = createMediaFile(restored.file);
      setMedia([created]);
      setMediaId(restored.draft.mediaId);
      setDurationS(restored.draft.durationSec);
      setDurationLocked(true);
    });
    return () => {
      active = false;
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
    setMediaId(null);
    setDurationLocked(false);
    setProcessingPercent(null);
    clearReelDraft();
  }

  async function persistClip(file: File, recordedSec: number, metadataSec?: number | null) {
    setProcessingPercent(12);
    try {
      const draft = await persistReelDraftClip({
        blob: file,
        mimeType: file.type || "video/webm",
        fileName: file.name,
        recordedSec,
        metadataSec,
        maxSeconds: REEL_MAX_DURATION_SECONDS,
        onProgress: setProcessingPercent,
      });
      setMediaId(draft.mediaId);
      setDurationS(draft.durationSec);
      setDurationLocked(true);
    } catch {
      toast.error("Não foi possível salvar o vídeo neste dispositivo.");
    } finally {
      setProcessingPercent(null);
    }
  }

  function applyFile(file: File, recordedSec: number, lock: boolean) {
    const created = createMediaFile(file);
    setMedia([created]);
    setPosterBlob(null);
    const duration = resolveMediaDurationSeconds({
      recordedSec,
      metadataSec: null,
      maxSeconds: REEL_MAX_DURATION_SECONDS,
    });
    setDurationS(duration);
    setDurationLocked(lock);
    void persistClip(file, recordedSec);
  }

  function handleRecordedClip(clip: RecordedClip) {
    const file = new File([clip.blob], clip.fileName, { type: clip.mimeType.split(";")[0] });
    applyFile(file, clip.durationSec, true);
  }

  async function handlePickedFile(file: File) {
    const typeError = validateReelVideo(file, 1);
    if (typeError === "type" || typeError === "size") {
      toast.error(validationMessage(typeError));
      return;
    }
    const metadataSec = await readVideoDurationSeconds(file);
    if (metadataSec == null || metadataSec > REEL_MAX_DURATION_SECONDS) {
      toast.error(validationMessage("duration"));
      return;
    }
    applyFile(file, metadataSec, true);
  }

  function handleLoadedMetadata() {
    const v = videoRef.current;
    if (!v) return;
    const metadata = Number.isFinite(v.duration) ? v.duration : null;
    const next = resolveMediaDurationSeconds({
      recordedSec: durationLocked ? durationS : metadata,
      metadataSec: metadata,
      maxSeconds: REEL_MAX_DURATION_SECONDS,
    });
    if (next > REEL_MAX_DURATION_SECONDS) {
      toast.error(validationMessage("duration"));
      clearSelection();
      return;
    }
    if (!durationLocked || Math.abs(next - durationS) <= 2) {
      setDurationS(next);
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
      setPublishState(willPublishReelRemotely() ? "uploading" : "saving_local");
      const result = await publishReel({
        file: file as File,
        caption,
        hashtags,
        mediaId: mediaId ?? undefined,
        category: selectedChip?.category,
        context: selectedContext
          ? { tipo: selectedContext.tipo, id: selectedContext.id, titulo: selectedContext.titulo }
          : null,
        posterBlob,
        durationS,
      });
      clearReelDraft();
      setPublishState("success");
      toast.success(
        result.persistence === "supabase"
          ? "Publicado no Agora!"
          : "Salvo no Agora neste dispositivo (modo de desenvolvimento)",
      );
      nav({ to: "/reels/$reelId", params: { reelId: result.reel.id } });
    } catch (err) {
      console.error("[NovoReel] Falha ao publicar", err);
      setPublishState("error");
      toast.error("Falha ao publicar no Agora. Tente novamente.");
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
        return "Publicar no Agora";
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
          <h1 className="font-display font-bold text-lg">Criar Reel</h1>
          <p className="text-[11px] text-muted-foreground">Grave agora ou adicione um vídeo</p>
        </div>
      </header>

      <div className="px-4 space-y-4">
        <section className="space-y-2">
          <SectionLabel icon={<Film className="h-3.5 w-3.5" />} text="1 · Vídeo" />
          {!videoUrl ? (
            <div className="space-y-3">
              <ReelRecorder
                variant="embedded"
                title="Câmera"
                onCancel={() => undefined}
                onUse={handleRecordedClip}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-[28px] border border-dashed border-border bg-secondary/70"
                aria-label="Adicionar vídeo"
              >
                <span className="grid h-14 w-14 place-items-center rounded-full bg-surface text-foreground shadow-soft">
                  <Plus className="h-7 w-7" />
                </span>
                <span className="text-sm font-semibold">Adicionar vídeo</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = "";
                  if (file) void handlePickedFile(file);
                }}
              />
            </div>
          ) : (
            <div className="relative rounded-3xl overflow-hidden bg-black aspect-[9/16] max-h-[46vh]">
              <video
                key={videoUrl}
                ref={videoRef}
                src={videoUrl}
                muted
                playsInline
                controls
                autoPlay
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
                  {formatExactDurationLabel(durationS)}
                </div>
              )}
            </div>
          )}
          {processingPercent != null ? (
            <div className="rounded-2xl bg-secondary p-3">
              <p className="text-xs font-semibold">Processando vídeo...</p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-border">
                <div
                  className="h-full rounded-full bg-gradient-brand transition-all"
                  style={{ width: `${processingPercent}%` }}
                />
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">{processingPercent}%</p>
            </div>
          ) : null}
          {videoFile && (
            <p className="text-[11px] text-muted-foreground">
              {videoFile.name} · {formatFileSize(videoFile.size)}
              {durationS > 0 ? ` · ${formatExactDurationLabel(durationS)}` : ""}
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
          <HashtagInput tags={hashtags} onChange={setHashtags} />
          <ConnexyAiAssistant mode="media" label="Ideias para a legenda" />
        </section>

        <section className="rounded-3xl bg-surface border border-border p-4 space-y-3 shadow-soft">
          <SectionLabel icon={<MapPin className="h-3.5 w-3.5" />} text="3 · Contexto" />
          <div className="flex flex-wrap gap-2">
            {CONTEXT_CHIPS.map((chip) => {
              const active = chipId === chip.id;
              return (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => {
                    if (active) {
                      setChipId(null);
                      setContext(null);
                    } else {
                      setChipId(chip.id);
                      setContext(chip.tipo ? { tipo: chip.tipo, id: "" } : null);
                    }
                  }}
                  aria-pressed={active}
                  className={`h-9 px-3 rounded-full text-xs font-semibold transition-colors ${
                    active
                      ? "bg-gradient-brand text-white shadow"
                      : "bg-secondary text-muted-foreground hover:bg-border"
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>

          {context?.tipo && (
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
              {contextOptions
                .filter((o) => o.tipo === context.tipo)
                .map((option) => {
                  const active = context.id === option.id;
                  return (
                    <button
                      key={`${option.tipo}:${option.id}`}
                      type="button"
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
                  ? `${formatExactDurationLabel(durationS)} · ${formatFileSize(videoFile.size)}`
                  : "Não escolhido"
              }
            />
            <Row label="Legenda" value={caption.trim() ? caption.trim() : "Sem legenda"} />
            <Row
              label="Contexto"
              value={
                selectedContext
                  ? `${selectedContext.emoji} ${selectedContext.titulo}`
                  : (selectedChip?.label ?? "Nenhum")
              }
            />
            {willPublishReelRemotely() && (
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
