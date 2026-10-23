import { useEffect, useState, type ImgHTMLAttributes, type ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { getAvatarMediaUrl } from "@/lib/media/avatar-media.functions";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  profileId: string;
  legacyUrl?: string | null;
  fallback: ReactNode;
};

/** Renders legacy/demo sources directly, and resolves persisted profile avatars server-side. */
export function AuthenticatedAvatarImage({
  profileId,
  legacyUrl,
  fallback,
  onError,
  ...imageProps
}: Props) {
  const { user } = useAuth();
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const isLocalPreview = legacyUrl?.startsWith("blob:") || legacyUrl?.startsWith("data:");
  const shouldResolve = UUID_RE.test(profileId) && !isLocalPreview;

  useEffect(() => {
    let obsolete = false;
    setFailed(false);
    if (!shouldResolve) {
      setResolvedUrl(legacyUrl ?? null);
      return () => {
        obsolete = true;
      };
    }

    setResolvedUrl(null);
    if (!user?.id) return;
    getAvatarMediaUrl({ data: { profileId } })
      .then((result) => {
        if (!obsolete) setResolvedUrl(result.status === "ready" ? result.url : null);
      })
      .catch(() => {
        if (!obsolete) setResolvedUrl(null);
      });
    return () => {
      obsolete = true;
    };
  }, [legacyUrl, profileId, shouldResolve, user?.id]);

  const src = isLocalPreview ? legacyUrl : shouldResolve ? resolvedUrl : legacyUrl;
  if (!src || failed) return <>{fallback}</>;

  return (
    <img
      {...imageProps}
      src={src}
      onError={(event) => {
        setFailed(true);
        onError?.(event);
      }}
    />
  );
}
