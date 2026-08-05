import type { ReactNode } from "react";
import { useRouter } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";

interface BackButtonProps {
  className?: string;
  ariaLabel?: string;
  fallbackTo?: string;
  children?: ReactNode;
}

export function BackButton({
  className,
  ariaLabel = "Voltar",
  fallbackTo,
  children,
}: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    if (window.history.length > 1) {
      router.history.back();
      return;
    }
    if (fallbackTo) {
      router.navigate({ to: fallbackTo as never });
    }
  };

  return (
    <button type="button" onClick={handleBack} className={className} aria-label={ariaLabel}>
      {children ?? <ChevronLeft className="h-4 w-4" />}
    </button>
  );
}
