import { useState } from "react";
import { Eye } from "lucide-react";

type VisibilityValue = "public" | "private" | "followers";

interface PublisherVisibilityProps {
  value: VisibilityValue;
  onChange: (value: VisibilityValue) => void;
}

const OPTIONS: { value: VisibilityValue; label: string; desc: string }[] = [
  { value: "public", label: "Público", desc: "Todos podem ver" },
  { value: "followers", label: "Seguidores", desc: "Apenas seguidores" },
  { value: "private", label: "Privado", desc: "Só você" },
];

export function PublisherVisibility({ value, onChange }: PublisherVisibilityProps) {
  const [open, setOpen] = useState(false);
  const current = OPTIONS.find((o) => o.value === value) ?? OPTIONS[0];

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
        <Eye className="h-3.5 w-3.5" />
        Quem pode ver
      </div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-secondary/50 text-sm"
      >
        <span className="font-medium">{current.label}</span>
        <span className="text-xs text-muted-foreground">{current.desc}</span>
      </button>
      {open && (
        <div className="space-y-1 mt-1">
          {OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-colors ${
                value === opt.value
                  ? "bg-primary/10 text-primary font-semibold"
                  : "bg-secondary/30 hover:bg-secondary/50"
              }`}
            >
              <span>{opt.label}</span>
              <span className="text-xs text-muted-foreground">{opt.desc}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export type { VisibilityValue };
