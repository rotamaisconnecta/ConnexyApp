import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, RefreshCcw, X } from "lucide-react";
import {
  captureDeviceError,
  captureDeviceMessage,
  stopMediaStream,
} from "@/lib/media/capture-utils";

type CaptureState = "live" | "review" | "error";

export function CameraCapture({
  title = "Tirar foto",
  confirmLabel = "Usar foto",
  onCancel,
  onCapture,
}: {
  title?: string;
  confirmLabel?: string;
  onCancel: () => void;
  onCapture: (blob: Blob, fileName: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [state, setState] = useState<CaptureState>("live");
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);

  const previewUrlRef = useRef<string | null>(null);

  const stop = useCallback(() => {
    stopMediaStream(streamRef.current);
    streamRef.current = null;
  }, []);

  const start = useCallback(async () => {
    stop();
    setError(null);
    setState("live");
    if (!navigator.mediaDevices?.getUserMedia) {
      setError(captureDeviceMessage("unsupported"));
      setState("error");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => undefined);
      }
    } catch (caught) {
      setError(captureDeviceMessage(captureDeviceError(caught)));
      setState("error");
      stop();
    }
  }, [stop]);

  useEffect(() => {
    void start();
    return () => {
      stop();
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, [start, stop]);

  function handleCapture() {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 720;
    canvas.height = video.videoHeight || 960;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (next) => {
        if (!next) return;
        const url = URL.createObjectURL(next);
        previewUrlRef.current = url;
        setBlob(next);
        setPreviewUrl((current) => {
          if (current) URL.revokeObjectURL(current);
          return url;
        });
        setState("review");
        stop();
      },
      "image/jpeg",
      0.9,
    );
  }

  return (
    <div className="fixed inset-0 z-[90] flex flex-col bg-black/80 p-3" role="dialog" aria-modal aria-label={title}>
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col overflow-hidden rounded-[28px] bg-surface">
        <div className="flex items-center justify-between px-4 py-3">
          <h2 className="font-display text-base font-semibold">{title}</h2>
          <button
            type="button"
            onClick={onCancel}
            className="grid h-9 w-9 place-items-center rounded-full bg-secondary"
            aria-label="Cancelar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="relative min-h-0 flex-1 bg-black">
          {state === "review" && previewUrl ? (
            <img src={previewUrl} alt="Prévia da foto" className="h-full w-full object-cover" />
          ) : (
            <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
          )}
        </div>
        {error ? <p className="px-4 py-3 text-sm text-destructive">{error}</p> : null}
        <div className="flex gap-2 p-4">
          {state === "live" ? (
            <button
              type="button"
              onClick={handleCapture}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-gradient-brand text-sm font-semibold text-white"
            >
              <Camera className="h-4 w-4" /> Capturar
            </button>
          ) : null}
          {state === "review" && blob ? (
            <>
              <button
                type="button"
                onClick={() => void start()}
                className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full border border-border text-sm font-semibold"
              >
                <RefreshCcw className="h-4 w-4" /> Refazer
              </button>
              <button
                type="button"
                onClick={() => onCapture(blob, `foto-${Date.now()}.jpg`)}
                className="h-12 flex-1 rounded-full bg-gradient-brand text-sm font-semibold text-white"
              >
                {confirmLabel}
              </button>
            </>
          ) : null}
          {state === "error" ? (
            <button
              type="button"
              onClick={() => void start()}
              className="h-12 flex-1 rounded-full bg-gradient-brand text-sm font-semibold text-white"
            >
              Tentar novamente
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
