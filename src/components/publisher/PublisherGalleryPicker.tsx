import { ImageIcon, Film } from "lucide-react";
import { BrandCard } from "@/components/ui/brand-card";

interface PublisherGalleryPickerProps {
  type?: "image" | "video";
  label?: string;
  onClick?: () => void;
}

export function PublisherGalleryPicker({
  type = "image",
  label = "Adicionar mídia",
  onClick,
}: PublisherGalleryPickerProps) {
  const Icon = type === "video" ? Film : ImageIcon;

  return (
    <BrandCard
      onClick={onClick}
      className="flex flex-col items-center gap-3 py-8 border-2 border-dashed border-border/60 hover:border-primary/40 transition-colors"
    >
      <div className="h-14 w-14 rounded-full bg-primary/10 grid place-items-center">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">Toque para selecionar</p>
      </div>
    </BrandCard>
  );
}
