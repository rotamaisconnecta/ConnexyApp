import { useEffect, useRef, useState } from "react";

const PLAYBACK_THRESHOLD = 0.6;

type Listener = (entry: IntersectionObserverEntry) => void;

let sharedObserver: IntersectionObserver | null = null;
const listeners = new Set<Listener>();

function getObserver(): IntersectionObserver | null {
  if (typeof IntersectionObserver === "undefined") return null;
  if (!sharedObserver) {
    sharedObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          listeners.forEach((listener) => listener(entry));
        }
      },
      { threshold: PLAYBACK_THRESHOLD },
    );
  }
  return sharedObserver;
}

export interface ActiveReelPlaybackResult {
  containerRef: React.RefObject<HTMLDivElement | null>;
  isActive: boolean;
  paused: boolean;
  setPaused: React.Dispatch<React.SetStateAction<boolean>>;
  shouldPlay: boolean;
}

/**
 * useActiveReelPlayback — controla a reprodução de um Reel no feed vertical.
 *
 * - Usa um único IntersectionObserver (módulo) com threshold 0.6 para
 *   detectar qual Reel está em foco → somente um vídeo toca por vez.
 * - Inicia sem som (muted é gerenciado pela página, preferência de sessão).
 * - Pausa automaticamente quando a aba fica oculta (visibilitychange)
 *   e retoma ao voltar, se o Reel continua em foco e não está pausado.
 * - Nunca propaga rejeição de video.play().
 */
export function useActiveReelPlayback(): ActiveReelPlaybackResult {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [paused, setPaused] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const observer = getObserver();
    if (!observer) return;

    const handleEntry = (entry: IntersectionObserverEntry) => {
      if (entry.target === element) {
        setIsActive(entry.isIntersecting);
      }
    };

    listeners.add(handleEntry);
    observer.observe(element);
    return () => {
      observer.unobserve(element);
      listeners.delete(handleEntry);
    };
  }, []);

  useEffect(() => {
    const handleVisibility = () => {
      setPageVisible(document.visibilityState === "visible");
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  const shouldPlay = isActive && pageVisible && !paused;

  return { containerRef, isActive, paused, setPaused, shouldPlay };
}

export const reelPlaybackThreshold = PLAYBACK_THRESHOLD;
