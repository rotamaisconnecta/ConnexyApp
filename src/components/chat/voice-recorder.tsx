import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { MicOff, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatAudioDuration } from "@/lib/chat/chat-format";

interface VoiceRecorderProps {
  onCancel: () => void;
  onComplete: (durationSec: number) => void;
  maxDurationSec?: number;
}

export function VoiceRecorder({ onCancel, onComplete, maxDurationSec = 120 }: VoiceRecorderProps) {
  const [elapsed, setElapsed] = useState(0);
  const [cancelled, setCancelled] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setElapsed((prev) => {
        if (prev + 1 >= maxDurationSec) {
          clearInterval(intervalRef.current!);
          return maxDurationSec;
        }
        return prev + 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [maxDurationSec]);

  useEffect(() => {
    if (elapsed >= maxDurationSec) {
      onComplete(elapsed);
    }
  }, [elapsed, maxDurationSec, onComplete]);

  const handleCancel = useCallback(() => {
    setCancelled(true);
    onCancel();
  }, [onCancel]);

  const handleStop = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    onComplete(elapsed);
  }, [elapsed, onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="flex items-center gap-3 px-3 py-3 border-t border-border bg-surface/80 backdrop-blur-md"
    >
      <button
        type="button"
        onClick={handleCancel}
        className="h-9 w-9 rounded-xl grid place-items-center bg-destructive/15 text-destructive shrink-0"
        aria-label="Cancelar gravação"
      >
        <MicOff className="h-4 w-4" />
      </button>

      <div className="flex-1 flex items-center gap-3">
        <motion.span
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1.2, repeat: Infinity }}
          className="h-3 w-3 rounded-full bg-destructive shrink-0"
        />
        <div className="flex-1">
          <div className="h-8 flex items-center gap-[3px]">
            {Array.from({ length: Math.min(elapsed, 40) }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ height: 4 }}
                animate={{ height: Math.random() * 28 + 4 }}
                transition={{ duration: 0.2 }}
                className="w-[3px] rounded-full bg-primary/60"
              />
            ))}
          </div>
        </div>
        <span className="text-xs font-mono text-muted-foreground tabular-nums">
          {formatAudioDuration(elapsed)}
        </span>
      </div>

      <button
        type="button"
        onClick={handleStop}
        className="h-9 w-9 rounded-xl grid place-items-center bg-primary text-primary-foreground shrink-0"
        aria-label="Parar gravação"
      >
        <Square className="h-4 w-4" />
      </button>
    </motion.div>
  );
}
