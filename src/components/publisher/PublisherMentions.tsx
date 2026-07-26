import { useState } from "react";
import { X, AtSign } from "lucide-react";

interface PublisherMentionsProps {
  mentions: string[];
  onChange: (mentions: string[]) => void;
}

export function PublisherMentions({ mentions, onChange }: PublisherMentionsProps) {
  const [input, setInput] = useState("");

  function addMention() {
    const clean = input.replace(/[^a-zA-Z0-9_.]/g, "").toLowerCase();
    if (clean.length === 0) return;
    if (mentions.includes(clean)) {
      setInput("");
      return;
    }
    onChange([...mentions, clean]);
    setInput("");
  }

  function removeMention(mention: string) {
    onChange(mentions.filter((m) => m !== mention));
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
        <AtSign className="h-3.5 w-3.5" />
        Marcar pessoas
      </div>
      {mentions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {mentions.map((mention) => (
            <span
              key={mention}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary text-xs font-medium"
            >
              @{mention}
              <button
                type="button"
                onClick={() => removeMention(mention)}
                className="hover:text-destructive"
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
              addMention();
            }
          }}
          placeholder="@usuario"
          className="flex-1 px-4 py-2.5 rounded-xl bg-secondary/50 text-sm outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
        />
        <button
          type="button"
          onClick={addMention}
          className="px-3 py-2.5 rounded-xl bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors"
        >
          +
        </button>
      </div>
    </div>
  );
}
