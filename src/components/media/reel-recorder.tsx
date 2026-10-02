import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Plus, RefreshCcw, Square, Video, X } from "lucide-react";
import { REEL_MAX_DURATION_SECONDS } from "@/lib/reels/reel-limits";
import {
  captureDeviceError,
  captureDeviceMessage,
  pickRecorderMimeType,
  stopMediaStream,
  VIDEO_RECORDER_TYPES,
} from "@/lib/media/capture-utils";
import {
  clampRecordedDuration,
  formatExactDurationLabel,
} from "@/lib/media/media-duration";

export type RecordedClip = {
  blob: Blob;
  mimeType: string;
  durationSec: number;
  fileName: string;
};

export function ReelRecorder({
  onCancel,
  onUse,
  maxDurationSec = REEL_MAX_DURATION_SECONDS,
  title = "Criar Reel",
  confirmLabel = "Usar",
  variant = "overlay",
  showFilePicker = false,
  onPickFile,
}: {
  onCancel: () => void;
  onUse: (clip: RecordedClip) => void;
  maxDurationSec?: number;
  title?: string;
  confirmLabel?: string;
  variant?: "overlay" | "embedded";
  showFilePicker?: boolean;
  onPickFile?: (file: File) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const startedAtRef = useRef(0);
  const elapsedRef = useRef(0);
  const previewUrlRef = useRef<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [clip, setClip] = useState<RecordedClip | null>(null);
  const [error, setError] = useState<string | null>(null);

  const stopStream = useCallback(() => {
    stopMediaStream(streamRef.current);
    streamRef.current = null;
  }, []);

  const startCamera = useCallback(async () => {
    stopStream();
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setError(captureDeviceMessage("unsupported"));
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => undefined);
      }
    } catch (caught) {
      setError(captureDeviceMessage(captureDeviceError(caught)));
      stopStream();
    }
  }, [stopStream]);

  useEffect(() => {
    void startCamera();
    return () => {
      recorderRef.current?.stop();
      stopStream();
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, [startCamera, stopStream]);

  useEffect(() => {
    if (!recording) return;
    const timer = window.setInterval(() => {
      const next = Math.max(0, (performance.now() - startedAtRef.current) / 1000);
      elapsedRef.current = next;
      setElapsed(next);
      if (next >= maxDurationSec) {
        recorderRef.current?.stop();
      }
    }, 200);
    return () => window.clearInterval(timer);
  }, [recording, maxDurationSec]);

  function startRecording() {
    const stream = streamRef.current;
    if (!stream || typeof MediaRecorder === "undefined") {
      setError(captureDeviceMessage("unsupported"));
      return;
    }
    const mimeType = pickRecorderMimeType(VIDEO_RECORDER_TYPES);
    chunksRef.current = [];
    const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
    recorderRef.current = recorder;
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };
    recorder.onstop = () => {
      setRecording(false);
      const type = recorder.mimeType || mimeType || "video/webm";
      const blob = new Blob(chunksRef.current, { type });
      const url = URL.createObjectURL(blob);
      previewUrlRef.current = url;
      setPreviewUrl((current) => {
        if (current) URL.revokeObjectURL(current);
        return url;
      });
      const durationSec = clampRecordedDuration(
        (performance.now() - startedAtRef.current) / 1000,
        maxDurationSec,
      );
      elapsedRef.current = durationSec;
      setElapsed(durationSec);
      setClip({
        blob,
        mimeType: type,
        durationSec,
        fileName: `reel-${Date.now()}.${type.includes("mp4") ? "mp4" : "webm"}`,
      });
      stopStream();
    };
    elapsedRef.current = 0;
    startedAtRef.current = performance.now();
    setElapsed(0);
    setClip(null);
    setRecording(true);
    recorder.start(200);
  }

  function stopRecording() {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
  }

  async function redo() {
    setClip(null);
    elapsedRef.current = 0;
    setElapsed(0);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrlRef.current = null;
    setPreviewUrl(null);
    await startCamera();
  }

  const body = (
    <>
      <div className="flex items-center justify-between px-4 py-3">
        <h2 className="font-display text-base font-semibold">{title}</h2>
        {variant === "overlay" ? (
          <button
            type="button"
            onClick={onCancel}
            className="grid h-9 w-9 place-items-center rounded-full bg-secondary"
            aria-label="Cancelar"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>
      <div className="relative min-h-0 flex-1 bg-black">
        {previewUrl && clip ? (
          <video src={previewUrl} controls playsInline autoPlay className="h-full w-full object-cover" />
        ) : (
          <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
        )}
        {recording ? (
          <span className="absolute left-3 top-3 rounded-full bg-destructive px-2 py-1 text-[11px] font-semibold text-white">
            {formatExactDurationLabel(elapsed)} / {maxDurationSec}s
          </span>
        ) : null}
        {clip && !recording ? (
          <span className="absolute bottom-3 left-3 rounded-full bg-black/65 px-2 py-1 text-[11px] font-semibold text-white">
            {formatExactDurationLabel(clip.durationSec)}
          </span>
        ) : null}
      </div>
      {error ? <p className="px-4 py-3 text-sm text-destructive">{error}</p> : null}
      {showFilePicker && !clip && !recording ? (
        <div className="px-4 pb-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 rounded-[24px] border border-dashed border-border bg-secondary/70 text-muted-foreground"
            aria-label="Adicionar vídeo"
          >
            <span className="grid h-12 w-12 place-items-center rounded-full bg-surface text-2xl font-semibold text-foreground">
              <Plus className="h-6 w-6" />
            </span>
            <span className="text-sm font-semibold text-foreground">Adicionar vídeo</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) onPickFile?.(file);
            }}
          />
        </div>
      ) : null}
      <div className="flex gap-2 p-4">
        {!clip && !recording ? (
          <button
            type="button"
            onClick={startRecording}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-gradient-brand text-sm font-semibold text-white"
          >
            <Video className="h-4 w-4" /> Gravar
          </button>
        ) : null}
        {recording ? (
          <button
            type="button"
            onClick={stopRecording}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-destructive text-sm font-semibold text-white"
          >
            <Square className="h-4 w-4" /> Parar
          </button>
        ) : null}
        {clip ? (
          <>
            <button
              type="button"
              onClick={() => void redo()}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full border border-border text-sm font-semibold"
            >
              <RefreshCcw className="h-4 w-4" /> Refazer
            </button>
            <button
              type="button"
              onClick={() => onUse(clip)}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-gradient-brand text-sm font-semibold text-white"
            >
              <Check className="h-4 w-4" /> {confirmLabel}
            </button>
          </>
        ) : null}
      </div>
    </>
  );

  if (variant === "embedded") {
    return (
      <div className="flex min-h-[420px] flex-col overflow-hidden rounded-[28px] bg-surface" role="region" aria-label={title}>
        {body}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[90] flex flex-col bg-black/80 p-3" role="dialog" aria-modal aria-label={title}>
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col overflow-hidden rounded-[28px] bg-surface">
        {body}
      </div>
    </div>
  );
}
