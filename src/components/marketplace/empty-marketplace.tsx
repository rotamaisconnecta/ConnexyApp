import { Store } from "lucide-react";

interface EmptyMarketplaceProps {
  message?: string;
  icon?: React.ReactNode;
}

export function EmptyMarketplace({
  message = "Nenhum resultado encontrado",
  icon,
}: EmptyMarketplaceProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
      {icon ?? (
        <div className="h-16 w-16 rounded-full bg-secondary grid place-items-center">
          <Store className="h-8 w-8 text-muted-foreground/50" />
        </div>
      )}
      <p className="text-sm font-medium text-muted-foreground">{message}</p>
      <p className="text-[11px] text-muted-foreground/70 max-w-[200px]">
        Tente ajustar os filtros ou buscar por outro termo
      </p>
    </div>
  );
}
