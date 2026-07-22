import { useState } from "react";
import { MapPin, Navigation } from "lucide-react";
import { cn } from "@/lib/utils";
import { type PostLocation } from "@/lib/types/post";

interface LocationSelectorProps {
  value: PostLocation | null;
  onChange: (location: PostLocation | null) => void;
}

export function LocationSelector({ value, onChange }: LocationSelectorProps) {
  const [query, setQuery] = useState("");

  return (
    <div className="space-y-2">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={value?.name ?? query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (e.target.value === "") onChange(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && query.trim()) {
              onChange({ name: query.trim() });
              setQuery("");
            }
          }}
          placeholder="Pesquisar lugar"
          className="w-full rounded-xl border border-border bg-surface pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label="Pesquisar lugar"
        />
      </div>

      <button
        type="button"
        onClick={() => onChange({ name: "Localização atual" })}
        className={cn(
          "w-full flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors",
          value?.name === "Localização atual"
            ? "border-primary bg-accent text-primary"
            : "border-border bg-surface text-foreground hover:border-primary/40",
        )}
      >
        <Navigation className="h-4 w-4" />
        Usar localização atual
      </button>

      {value && value.name !== "Localização atual" && (
        <div className="flex items-center gap-2 rounded-xl bg-accent px-3 py-2 text-sm">
          <MapPin className="h-4 w-4 text-primary shrink-0" />
          <span className="flex-1 truncate">{value.name}</span>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-xs font-semibold text-muted-foreground hover:text-foreground"
            aria-label="Remover localização"
          >
            Remover
          </button>
        </div>
      )}
    </div>
  );
}
