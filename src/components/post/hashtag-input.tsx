import { useState } from "react";
import { Hash, X } from "lucide-react";

interface HashtagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  maxTags?: number;
}

export function HashtagInput({ tags, onChange, maxTags = 10 }: HashtagInputProps) {
  const [input, setInput] = useState("");

  const add = () => {
    const tag = input.trim().replace(/^#/, "").replace(/\s+/g, "");
    if (!tag || tags.includes(tag) || tags.length >= maxTags) return;
    onChange([...tags, tag]);
    setInput("");
  };

  const remove = (tag: string) => {
    onChange(tags.filter((t) => t !== tag));
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder="Adicionar hashtag"
          maxLength={30}
          className="w-full rounded-xl border border-border bg-surface pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label="Adicionar hashtag"
        />
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-primary"
            >
              #{tag}
              <button
                type="button"
                onClick={() => remove(tag)}
                className="h-3.5 w-3.5 rounded-full hover:bg-primary/20 grid place-items-center"
                aria-label={`Remover #${tag}`}
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
