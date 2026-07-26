import { ChevronLeft, X } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { BrandButton } from "@/components/ui/brand-button";

interface PublisherHeaderProps {
  title: string;
  onBack?: () => void;
  onPublish?: () => void;
  publishing?: boolean;
  publishLabel?: string;
}

export function PublisherHeader({
  title,
  onBack,
  onPublish,
  publishing = false,
  publishLabel = "Publicar",
}: PublisherHeaderProps) {
  return (
    <header className="shrink-0 px-4 pt-1 pb-3 flex items-center gap-3 border-b border-border/50">
      <Link
        to="/create"
        className="h-9 w-9 grid place-items-center rounded-full bg-secondary shrink-0"
        aria-label="Voltar"
      >
        <ChevronLeft className="h-4 w-4" />
      </Link>
      <h1 className="flex-1 font-display font-bold text-lg truncate">{title}</h1>
      {onPublish && (
        <BrandButton variant="primary" size="sm" onClick={onPublish} disabled={publishing}>
          {publishing ? "..." : publishLabel}
        </BrandButton>
      )}
      <Link
        to="/create"
        className="h-9 w-9 grid place-items-center rounded-full bg-secondary shrink-0"
        aria-label="Fechar"
      >
        <X className="h-4 w-4" />
      </Link>
    </header>
  );
}
