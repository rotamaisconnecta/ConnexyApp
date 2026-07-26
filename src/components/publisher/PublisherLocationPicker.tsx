import { MapPin } from "lucide-react";
import { BrandInput } from "@/components/ui/brand-input";

interface PublisherLocationPickerProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function PublisherLocationPicker({ value, onChange, error }: PublisherLocationPickerProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
        <MapPin className="h-3.5 w-3.5" />
        Localização
      </div>
      <BrandInput
        placeholder="Onde foi isso?"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        error={error}
      />
    </div>
  );
}
