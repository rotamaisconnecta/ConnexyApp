import { useState } from "react";
import { X, Hash } from "lucide-react";

interface PublisherHashtagsProps {
  tags: string[];
  onChange: (tags: string[]) => void;
}

export function PublisherHashtags({ tags, onChange }: PublisherHashtagsProps) {
  const [input, setInput] = useState("");

  function addTag() {
    const clean = input.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase();
    if (clean.length === 0) return;
    if (tags.includes(clean)) {
      setInput("");
      return;
    }
    onChange([...tags, clean]);
    setInput("");
  }

  function removeTag(tag: string) {
    onChange(tags.filter((t) => t !== tag));
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
        <Hash className="h-3.5 w-3.5" />
        Hashtags
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium"
            >
              #{tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="hover:text-primary/60"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addTag();
            }
          }}
          placeholder="Adicionar hashtag"
          className="flex-1 px-4 py-2.5 rounded-xl bg-secondary/50 text-sm outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
        />
        <button
          type="button"
          onClick={addTag}
          className="px-3 py-2.5 rounded-xl bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors"
        >
          +
        </button>
      </div>
    </div>
  );
}
