import type { ShareTargetValue } from "./reel-types";
import { SHARE_OPTIONS, ShareTarget } from "./reel-types";

export function getShareOptions() {
  return SHARE_OPTIONS;
}

const SHARE_LABELS: Record<ShareTargetValue, string> = {
  [ShareTarget.CHAT]: "Enviar no Chat",
  [ShareTarget.WHATSAPP]: "WhatsApp",
  [ShareTarget.INSTAGRAM]: "Instagram",
  [ShareTarget.COPY_LINK]: "Copiar link",
  [ShareTarget.OTHER]: "Outro",
};

const SHARE_ICONS: Record<ShareTargetValue, string> = {
  [ShareTarget.CHAT]: "message-circle",
  [ShareTarget.WHATSAPP]: "smartphone",
  [ShareTarget.INSTAGRAM]: "instagram",
  [ShareTarget.COPY_LINK]: "link",
  [ShareTarget.OTHER]: "share-2",
};

const SHARE_COLORS: Record<ShareTargetValue, string> = {
  [ShareTarget.CHAT]: "text-blue-400",
  [ShareTarget.WHATSAPP]: "text-green-400",
  [ShareTarget.INSTAGRAM]: "text-pink-400",
  [ShareTarget.COPY_LINK]: "text-gray-400",
  [ShareTarget.OTHER]: "text-gray-400",
};

export function getShareLabel(target: ShareTargetValue): string {
  return SHARE_LABELS[target] ?? target;
}

export function getShareIcon(target: ShareTargetValue): string {
  return SHARE_ICONS[target] ?? "share-2";
}

export function getShareColor(target: ShareTargetValue): string {
  return SHARE_COLORS[target] ?? "text-gray-400";
}

export function getShareMockUrl(target: ShareTargetValue, reelId: string): string {
  const base = `https://connexy.app/reel/${reelId}`;
  switch (target) {
    case ShareTarget.WHATSAPP:
      return `https://wa.me/?text=${encodeURIComponent(base)}`;
    case ShareTarget.INSTAGRAM:
      return `https://www.instagram.com/`;
    case ShareTarget.COPY_LINK:
      return base;
    case ShareTarget.CHAT:
      return `connexy://chat?reel=${reelId}`;
    default:
      return base;
  }
}

export function formatShareCount(n: number): string {
  if (n >= 1_000_000) {
    const v = n / 1_000_000;
    return `${v % 1 === 0 ? v : v.toFixed(1)}M`;
  }
  if (n >= 1_000) {
    const v = n / 1_000;
    return `${v % 1 === 0 ? v : v.toFixed(1).replace(".", ",")}k`;
  }
  return String(n);
}
