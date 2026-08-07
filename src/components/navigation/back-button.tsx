import type { ReactNode } from "react";
import { useRouter } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";

export type FallbackRoute =
  | "/cadastro"
  | "/completar-perfil"
  | "/connecta"
  | "/create"
  | "/driver"
  | "/events"
  | "/home"
  | "/interesses"
  | "/locais"
  | "/marketplace"
  | "/perfil"
  | "/profile"
  | "/reels"
  | "/ride"
  | "/rota"
  | "/welcome";

interface BackButtonProps {
  className?: string;
  ariaLabel?: string;
  fallbackTo?: FallbackRoute;
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
      router.navigate({ to: fallbackTo });
    }
  };

  return (
    <button type="button" onClick={handleBack} className={className} aria-label={ariaLabel}>
      {children ?? <ChevronLeft className="h-4 w-4" />}
    </button>
  );
}
