import { Search } from "lucide-react";

interface DiscoverySearchProps {
  value: string;
  onChange: (value: string) => void;
}

export function DiscoverySearch({ value, onChange }: DiscoverySearchProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Pesquisar pessoas, interesses ou profissão"
        className="w-full rounded-xl border border-border bg-surface pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        aria-label="Pesquisar pessoas"
      />
    </div>
  );
}
