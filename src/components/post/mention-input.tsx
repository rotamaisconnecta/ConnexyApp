import { useState } from "react";
import { AtSign, X, UserPlus } from "lucide-react";
import { type PostMention } from "@/lib/types/post";

interface MentionInputProps {
  mentions: PostMention[];
  onChange: (mentions: PostMention[]) => void;
  maxMentions?: number;
}

const MOCK_USERS: PostMention[] = [
  { id: "u1", name: "Beatriz Silva", photo: "https://i.pravatar.cc/80?img=47" },
  { id: "u2", name: "Carlos Souza", photo: "https://i.pravatar.cc/80?img=12" },
  { id: "u3", name: "Ana Oliveira", photo: "https://i.pravatar.cc/80?img=32" },
  { id: "u4", name: "Pedro Lima", photo: "https://i.pravatar.cc/80?img=15" },
  { id: "u5", name: "Giulia Santos", photo: "https://i.pravatar.cc/80?img=23" },
];

export function MentionInput({ mentions, onChange, maxMentions = 5 }: MentionInputProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = MOCK_USERS.filter(
    (u) =>
      u.name.toLowerCase().includes(query.toLowerCase()) && !mentions.some((m) => m.id === u.id),
  );

  const add = (user: PostMention) => {
    if (mentions.length >= maxMentions) return;
    onChange([...mentions, user]);
    setQuery("");
    setOpen(false);
  };

  const remove = (id: string) => {
    onChange(mentions.filter((m) => m.id !== id));
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(e.target.value.length > 0);
          }}
          onFocus={() => {
            if (query.length > 0) setOpen(true);
          }}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
          placeholder="Pesquisar usuário"
          className="w-full rounded-xl border border-border bg-surface pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label="Marcar pessoas"
        />
      </div>

      {open && filtered.length > 0 && (
        <div className="rounded-xl border border-border bg-surface shadow-soft max-h-40 overflow-y-auto">
          {filtered.map((user) => (
            <button
              key={user.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => add(user)}
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-accent transition-colors text-left"
            >
              <img src={user.photo} alt="" className="h-8 w-8 rounded-full object-cover" />
              <span className="text-sm font-medium flex-1 truncate">{user.name}</span>
              <UserPlus className="h-4 w-4 text-primary" />
            </button>
          ))}
        </div>
      )}

      {mentions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {mentions.map((m) => (
            <span
              key={m.id}
              className="inline-flex items-center gap-1.5 rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-primary"
            >
              <img src={m.photo} alt="" className="h-4 w-4 rounded-full object-cover" />
              {m.name}
              <button
                type="button"
                onClick={() => remove(m.id)}
                className="h-3.5 w-3.5 rounded-full hover:bg-primary/20 grid place-items-center"
                aria-label={`Remover ${m.name}`}
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
