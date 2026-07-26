import { Sparkles } from "lucide-react";

export function RoleEmpty() {
  return (
    <div className="flex flex-col items-center gap-3 py-8 text-center">
      <div className="h-12 w-12 rounded-full bg-primary/10 grid place-items-center">
        <Sparkles className="h-5 w-5 text-primary" />
      </div>
      <div>
        <p className="text-sm font-semibold">Você está no modo básico</p>
        <p className="text-xs text-muted-foreground mt-1 max-w-[220px]">
          Ative funcionalidades como Motorista, Empresa ou Organizador para desbloquear mais
          recursos.
        </p>
      </div>
    </div>
  );
}
