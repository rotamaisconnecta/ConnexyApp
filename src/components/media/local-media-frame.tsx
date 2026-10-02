import { useLocalMediaUrl } from "@/hooks/use-local-media-url";

export function LocalMediaFrame({
  mediaId,
  fallbackUrl,
  children,
}: {
  mediaId?: string | null;
  fallbackUrl?: string | null;
  children: (url: string | null) => React.ReactNode;
}) {
  const resolved = useLocalMediaUrl(mediaId);
  return <>{children(resolved || fallbackUrl || null)}</>;
}
