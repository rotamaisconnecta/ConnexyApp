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
    <div className="shrink-0 px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] border-t border-border/50 bg-background/95 backdrop-blur-xl z-10 relative">
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
