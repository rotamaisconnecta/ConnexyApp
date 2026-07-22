import { useState, useCallback } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/lib/chat/chat-types";
import { searchMessages, type TextSegment, highlightMatch } from "@/lib/chat/chat-search";

interface ChatSearchProps {
  messages: ChatMessage[];
  onResultClick: (messageId: string) => void;
  onClose: () => void;
}

export function ChatSearch({ messages, onResultClick, onClose }: ChatSearchProps) {
  const [query, setQuery] = useState("");
  const results = searchMessages(messages, query);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  return (
    <div className="border-b border-border bg-surface/80 backdrop-blur-md px-3 py-2">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pesquisar mensagens…"
            autoFocus
            className="w-full h-8 rounded-lg border border-border bg-surface pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            aria-label="Pesquisar mensagens"
          />
        </div>
        <button
          type="button"
          onClick={onClose}
          className="h-8 w-8 rounded-lg grid place-items-center hover:bg-accent transition-colors"
          aria-label="Fechar pesquisa"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {query.trim() && (
        <p className="text-[10px] text-muted-foreground mt-1.5 px-1">
          {results.length} {results.length === 1 ? "resultado" : "resultados"}
        </p>
      )}

      {results.length > 0 && (
        <div className="mt-2 space-y-1 max-h-40 overflow-y-auto no-scrollbar">
          {results.map((result) => (
            <button
              key={result.messageId}
              type="button"
              onClick={() => onResultClick(result.messageId)}
              className="w-full text-left rounded-lg p-2 hover:bg-accent transition-colors"
            >
              <p className="text-xs leading-snug">
                <HighlightedText
                  text={result.snippet}
                  segments={highlightMatch(result.snippet, query)}
                />
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function HighlightedText({ segments }: { text: string; segments: TextSegment[] }) {
  return (
    <>
      {segments.map((seg, i) =>
        seg.highlighted ? (
          <mark key={i} className="bg-primary/20 text-foreground rounded px-0.5">
            {seg.text}
          </mark>
        ) : (
          <span key={i} className="text-muted-foreground">
            {seg.text}
          </span>
        ),
      )}
    </>
  );
}
