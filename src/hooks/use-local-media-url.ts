import { useEffect, useState } from "react";
import {
  getLocalMediaObjectUrl,
  peekLocalMediaObjectUrl,
} from "@/lib/media/local-media-storage";

export function useLocalMediaUrl(mediaId?: string | null): string | null {
  const [url, setUrl] = useState<string | null>(() =>
    mediaId ? peekLocalMediaObjectUrl(mediaId) : null,
  );

  useEffect(() => {
    if (!mediaId) {
      setUrl(null);
      return;
    }
    const cached = peekLocalMediaObjectUrl(mediaId);
    if (cached) setUrl(cached);
    let active = true;
    void getLocalMediaObjectUrl(mediaId)
      .then((next) => {
        if (active && next === cached) return;
        if (active) setUrl(next);
      })
      .catch(() => {
        if (active && !cached) setUrl(null);
      });
    return () => {
      active = false;
    };
  }, [mediaId]);

  return url;
}
