import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Loader2, MicOff, Pause, Play, Square, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatAudioDuration } from "@/lib/chat/chat-format";
import {
  AUDIO_RECORDER_TYPES,
  captureDeviceError,
  captureDeviceMessage,
  pickRecorderMimeType,
  stopMediaStream,
} from "@/lib/media/capture-utils";
import {
  reduceVoiceRecorderPhase,
  VoiceRecorderPhase,
  type VoiceRecorderPhaseValue,
} from "@/lib/chat/voice-recorder-state";

export type VoiceClip = {
  blob: Blob;
  durationSec: number;
  mimeType: string;
};

interface VoiceRecorderProps {
  onCancel: () => void;
  onComplete: (clip: VoiceClip) => void | Promise<void>;
  maxDurationSec?: number;
}

export function VoiceRecorder({ onCancel, onComplete, maxDurationSec = 120 }: VoiceRecorderProps) {
  const [phase, setPhase] = useState<VoiceRecorderPhaseValue>(VoiceRecorderPhase.RECORDING);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [clip, setClip] = useState<VoiceClip | null>(null);
  const [playing, setPlaying] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [currentSec, setCurrentSec] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const elapsedRef = useRef(0);
  const previewUrlRef = useRef<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const go = useCallback((event: Parameters<typeof reduceVoiceRecorderPhase>[1]) => {
    setPhase((current) => reduceVoiceRecorderPhase(current, event));
  }, []);

  const clearTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const releasePreview = useCallback(() => {
    audioRef.current?.pause();
    audioRef.current = null;
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
  }, []);

  const stopHardware = useCallback(() => {
    clearTimer();
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.onstop = null;
      recorderRef.current.stop();
    }
    stopMediaStream(streamRef.current);
    streamRef.current = null;
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function start() {
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
        setError(captureDeviceMessage("unsupported"));
        go("fail");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) {
          stopMediaStream(stream);
          return;
        }
        streamRef.current = stream;
        const mimeType = pickRecorderMimeType(AUDIO_RECORDER_TYPES);
        const recorder = mimeType
          ? new MediaRecorder(stream, { mimeType })
          : new MediaRecorder(stream);
        recorderRef.current = recorder;
        chunksRef.current = [];
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) chunksRef.current.push(event.data);
        };
        recorder.onstop = () => {
          const type = recorder.mimeType || mimeType || "audio/webm";
          const blob = new Blob(chunksRef.current, { type });
          stopMediaStream(streamRef.current);
          streamRef.current = null;
          if (blob.size === 0) {
            setError("A gravação ficou vazia. Tente novamente.");
            go("fail");
            return;
          }
          const next: VoiceClip = {
            blob,
            durationSec: Math.max(elapsedRef.current, 1),
            mimeType: type,
          };
          if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
          previewUrlRef.current = URL.createObjectURL(blob);
          setClip(next);
          go("stop");
        };
        recorder.start(200);
        intervalRef.current = setInterval(() => {
          elapsedRef.current += 1;
          setElapsed(elapsedRef.current);
          if (elapsedRef.current >= maxDurationSec) {
            recorder.stop();
            clearTimer();
          }
        }, 1000);
      } catch (caught) {
        setError(captureDeviceMessage(captureDeviceError(caught)));
        go("fail");
      }
    }
    void start();
    return () => {
      cancelled = true;
      clearTimer();
      if (recorderRef.current && recorderRef.current.state !== "inactive") {
        recorderRef.current.onstop = null;
        recorderRef.current.stop();
      }
      stopMediaStream(streamRef.current);
      releasePreview();
    };
  }, [go, maxDurationSec, releasePreview]);

  const handleCancelRecording = useCallback(() => {
    stopHardware();
    releasePreview();
    go("cancel");
    onCancel();
  }, [go, onCancel, releasePreview, stopHardware]);

  const handleStop = useCallback(() => {
    clearTimer();
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
      return;
    }
    if (phase === VoiceRecorderPhase.ERROR) onCancel();
  }, [onCancel, phase]);

  const handleDiscard = useCallback(() => {
    if (!confirmDiscard) {
      setConfirmDiscard(true);
      return;
    }
    releasePreview();
    setClip(null);
    go("discard");
    onCancel();
  }, [confirmDiscard, go, onCancel, releasePreview]);

  const handleSend = useCallback(async () => {
    if (!clip || phase !== VoiceRecorderPhase.PREVIEW) return;
    go("send");
    try {
      await onComplete(clip);
      go("sent");
    } catch {
      setError("Não foi possível enviar o áudio.");
      go("fail");
    }
  }, [clip, go, onComplete, phase]);

  const togglePreview = useCallback(() => {
    if (!previewUrlRef.current) return;
    if (!audioRef.current) audioRef.current = new Audio(previewUrlRef.current);
    const audio = audioRef.current;
    audio.ontimeupdate = () => setCurrentSec(audio.currentTime);
    audio.onended = () => {
      setPlaying(false);
      setCurrentSec(0);
    };
    if (playing) {
      audio.pause();
      setPlaying(false);
      return;
    }
    void audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  }, [playing]);

  if (phase === VoiceRecorderPhase.ERROR) {
    return (
      <div className="rounded-[24px] bg-[#F6F3FF] px-3 py-3">
        <p className="text-xs text-destructive">{error ?? "Não foi possível gravar."}</p>
        <button
          type="button"
          onClick={handleCancelRecording}
          className="mt-2 h-10 w-full rounded-full bg-secondary text-sm font-semibold"
        >
          Voltar
        </button>
      </div>
    );
  }

  if (phase === VoiceRecorderPhase.PREVIEW || phase === VoiceRecorderPhase.SENDING) {
    const total = clip?.durationSec ?? elapsed;
    const progress = Math.min(100, (currentSec / Math.max(total, 1)) * 100);
    return (
      <div className="rounded-[24px] bg-[#F6F3FF] px-3 py-3">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={togglePreview}
            disabled={phase === VoiceRecorderPhase.SENDING}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary text-white"
            aria-label={playing ? "Pausar" : "Reproduzir"}
          >
            {playing ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex h-7 items-end gap-[2px]">
              {Array.from({ length: 32 }).map((_, i) => (
                <span
                  key={i}
                  className="w-[3px] rounded-full bg-primary/40"
                  style={{ height: `${8 + ((i * 7) % 16)}px`, opacity: (i / 32) * 100 < progress ? 1 : 0.35 }}
                />
              ))}
            </div>
            <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-primary/15">
              <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
            </div>
          </div>
          <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
            {formatAudioDuration(playing || currentSec > 0 ? currentSec : total)}
          </span>
        </div>
        {confirmDiscard ? (
          <p className="mt-3 text-center text-[11px] text-muted-foreground">
            Descartar esta gravação?
          </p>
        ) : null}
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={handleDiscard}
            disabled={phase === VoiceRecorderPhase.SENDING}
            className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full bg-secondary text-sm font-semibold"
            aria-label={confirmDiscard ? "Confirmar descarte" : "Descartar gravação"}
          >
            <Trash2 className="h-4 w-4" />
            {confirmDiscard ? "Confirmar" : "Descartar"}
          </button>
          <button
            type="button"
            onClick={() => void handleSend()}
            disabled={phase === VoiceRecorderPhase.SENDING}
            className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full bg-gradient-brand text-sm font-semibold text-white"
            aria-label="Enviar áudio"
          >
            {phase === VoiceRecorderPhase.SENDING ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Enviar"
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[24px] bg-[#F6F3FF] px-3 py-3"
    >
      <div className="flex items-center gap-2">
        <motion.span
          animate={{ opacity: [1, 0.35, 1] }}
          transition={{ duration: 1.1, repeat: Infinity }}
          className="h-2.5 w-2.5 rounded-full bg-destructive"
        />
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-destructive">
          Gravando
        </p>
        <span className="ml-auto font-mono text-xs tabular-nums text-foreground">
          {formatAudioDuration(elapsed)}
        </span>
      </div>
      <div className="mt-2 flex h-8 items-center gap-[3px]">
        {Array.from({ length: 36 }).map((_, i) => (
          <motion.div
            key={i}
            animate={{ height: 6 + ((elapsed + i) % 5) * 4 }}
            transition={{ duration: 0.18 }}
            className="w-[3px] rounded-full bg-primary/55"
          />
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={handleCancelRecording}
          className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full bg-secondary text-sm font-semibold text-foreground"
          aria-label="Cancelar gravação"
        >
          <MicOff className="h-4 w-4" />
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleStop}
          className={cn(
            "inline-flex h-12 min-w-[7.5rem] items-center justify-center gap-1.5 rounded-full bg-primary px-4 text-sm font-bold text-white shadow-[0_8px_20px_rgba(108,59,255,0.28)]",
          )}
          aria-label="STOP"
        >
          <Square className="h-3.5 w-3.5 fill-current" />
          STOP
        </button>
      </div>
    </motion.div>
  );
}
