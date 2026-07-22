import type { ReelComment } from "./reel-types";

export function formatCommentCount(n: number): string {
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

export function sortComments(comments: ReelComment[], by: "recent" | "popular"): ReelComment[] {
  return [...comments].sort((a, b) => {
    if (by === "popular") return b.likes - a.likes;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export function getTopLevelComments(comments: ReelComment[]): ReelComment[] {
  return comments.filter(
    (c) => !comments.some((other) => other.replies?.some((r) => r.id === c.id)),
  );
}

export function getReplies(comments: ReelComment[], parentId: string): ReelComment[] {
  for (const c of comments) {
    if (c.id === parentId) return c.replies ?? [];
  }
  return [];
}

export function buildCommentTree(flat: ReelComment[]): ReelComment[] {
  const map = new Map<string, ReelComment>();
  const roots: ReelComment[] = [];

  for (const c of flat) {
    map.set(c.id, { ...c, replies: [] });
  }

  for (const c of flat) {
    const node = map.get(c.id)!;
    if (c.replies && c.replies.length > 0) {
      for (const reply of c.replies) {
        const replyNode = map.get(reply.id);
        if (replyNode) {
          node.replies.push(replyNode);
        } else {
          node.replies.push({ ...reply, replies: [] });
        }
      }
    }
  }

  for (const c of flat) {
    const node = map.get(c.id)!;
    let isReply = false;
    for (const other of flat) {
      if (other.id !== c.id && other.replies?.some((r) => r.id === c.id)) {
        isReply = true;
        break;
      }
    }
    if (!isReply) {
      roots.push(node);
    }
  }

  return roots;
}

function countAll(comments: ReelComment[]): number {
  let total = 0;
  for (const c of comments) {
    total += 1;
    if (c.replies?.length) {
      total += countAll(c.replies);
    }
  }
  return total;
}

export function getTotalCommentCount(comments: ReelComment[]): number {
  return countAll(comments);
}
