import { Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { isPostValid, type PostDraft } from "@/lib/types/post";

interface PublishButtonProps {
  draft: PostDraft;
  onPublish: () => void;
  publishing?: boolean;
}

export function PublishButton({ draft, onPublish, publishing = false }: PublishButtonProps) {
  const valid = isPostValid(draft);

  return (
    <button
      type="button"
      onClick={onPublish}
      disabled={!valid || publishing}
      className={cn(
        "w-full h-12 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200",
        valid && !publishing
          ? "bg-gradient-brand text-white shadow-elegant active:scale-[0.98]"
          : "bg-muted text-muted-foreground cursor-not-allowed",
      )}
      aria-label="Publicar"
      aria-disabled={!valid || publishing}
    >
      <Send className="h-4 w-4" />
      {publishing ? "Publicando..." : "Publicar"}
    </button>
  );
}
