import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReelComment } from "@/lib/reels/reel-types";
import { formatRelativeTime } from "@/lib/reels/reel-utils";

interface ReelCommentItemProps {
  comment: ReelComment;
  onLike: (id: string) => void;
  onReply: (comment: ReelComment) => void;
}

export function ReelCommentItem({ comment, onLike, onReply }: ReelCommentItemProps) {
  return (
    <div>
      <div className="flex items-start gap-2.5">
        <img
          src={
            comment.authorPhoto ??
            `https://api.dicebear.com/9.x/initials/svg?seed=${comment.authorName}`
          }
          alt=""
          className="h-8 w-8 rounded-full object-cover shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="rounded-2xl bg-secondary px-3 py-2">
            <div className="text-[11px] font-semibold text-primary">{comment.authorName}</div>
            <div className="text-sm text-foreground">{comment.text}</div>
          </div>
          <div className="mt-1 flex items-center gap-3 text-[10px] text-muted-foreground">
            <span>{formatRelativeTime(comment.createdAt)}</span>
            <button
              onClick={() => onLike(comment.id)}
              className={cn(
                "flex items-center gap-1 font-semibold",
                comment.likedByMe && "text-pink-500",
              )}
            >
              <Heart className={cn("h-3 w-3", comment.likedByMe && "fill-pink-500")} />
              {comment.likes > 0 && comment.likes}
            </button>
            <button onClick={() => onReply(comment)} className="font-semibold">
              Responder
            </button>
          </div>
        </div>
      </div>
      {comment.replies.length > 0 && (
        <div className="mt-3 ml-8 space-y-3 border-l border-border pl-3">
          {comment.replies.map((reply) => (
            <ReelCommentItem key={reply.id} comment={reply} onLike={onLike} onReply={onReply} />
          ))}
        </div>
      )}
    </div>
  );
}
