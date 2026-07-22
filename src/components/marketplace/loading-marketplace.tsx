import { Loader2 } from "lucide-react";

export function LoadingMarketplace() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-20 space-y-4">
      <div className="relative">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <div className="absolute inset-0 h-10 w-10 rounded-full bg-primary/10 animate-ping" />
      </div>
      <div className="text-center space-y-1">
        <p className="font-semibold text-sm">Carregando marketplace</p>
        <p className="text-[11px] text-muted-foreground">
          Encontrando as melhores opções para você
        </p>
      </div>
    </div>
  );
}
