import { BrandButton } from "@/components/ui/brand-button";
import { Loader2 } from "lucide-react";

interface PublisherSubmitButtonProps {
  onClick: () => void;
  publishing?: boolean;
  label?: string;
  disabled?: boolean;
}

export function PublisherSubmitButton({
  onClick,
  publishing = false,
  label = "Publicar",
  disabled = false,
}: PublisherSubmitButtonProps) {
  return (
    <BrandButton
      variant="primary"
      size="lg"
      className="w-full"
      onClick={onClick}
      disabled={publishing || disabled}
    >
      {publishing ? (
        <span className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Publicando...
        </span>
      ) : (
        label
      )}
    </BrandButton>
  );
}
