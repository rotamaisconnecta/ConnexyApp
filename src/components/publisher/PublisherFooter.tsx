import { BrandButton } from "@/components/ui/brand-button";

interface PublisherFooterProps {
  onSubmit: () => void;
  publishing?: boolean;
  label?: string;
  disabled?: boolean;
}

export function PublisherFooter({
  onSubmit,
  publishing = false,
  label = "Publicar",
  disabled = false,
}: PublisherFooterProps) {
  return (
    <div className="relative z-20 shrink-0 border-t border-border/50 bg-background/95 px-4 py-4 backdrop-blur-xl">
      <BrandButton
        variant="primary"
        size="lg"
        className="w-full"
        onClick={onSubmit}
        disabled={publishing || disabled}
      >
        {publishing ? "Publicando..." : label}
      </BrandButton>
    </div>
  );
}
