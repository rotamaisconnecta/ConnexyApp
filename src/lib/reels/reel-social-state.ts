import { resolveDemoCatalogPerson } from "@/lib/chat/functional-conversation-list";
import {
  getConnectionBetween,
  getOutgoingPendingRequest,
  isConnected,
  isFollowing,
} from "@/lib/demo/demo-db";
import { isDetailSaved } from "@/lib/marketplace/saved-details";
import type { Reel } from "@/lib/reels/reel-types";

export type ReelConnectStatus = "available" | "pending" | "connected" | "unavailable";

export function canConnectReelAuthor(authorId: string, viewerId: string): boolean {
  return Boolean(
    authorId && viewerId && authorId !== viewerId && resolveDemoCatalogPerson(authorId),
  );
}

export function getReelConnectStatus(authorId: string, viewerId: string): ReelConnectStatus {
  if (!canConnectReelAuthor(authorId, viewerId)) return "unavailable";
  if (isConnected(authorId, viewerId)) return "connected";
  if (getOutgoingPendingRequest(viewerId, authorId)) return "pending";
  return "available";
}

export function getReelDirectConversationId(authorId: string, viewerId: string): string | null {
  return getConnectionBetween(viewerId, authorId)?.conversationId ?? null;
}

export function applyReelSocialState(reel: Reel, viewerId: string): Reel {
  return {
    ...reel,
    savedByMe: isDetailSaved(reel.id),
    author: {
      ...reel.author,
      isFollowing: isFollowing(reel.author.id, viewerId),
    },
  };
}
