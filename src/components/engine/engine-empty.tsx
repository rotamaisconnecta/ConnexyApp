import { Brain } from "lucide-react";

interface EngineEmptyProps {
  message?: string;
  icon?: React.ReactNode;
}

export function EngineEmpty({
  message = "Nenhuma recomendação disponível",
  icon,
}: EngineEmptyProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-20">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-muted">
        {icon ?? <Brain className="h-8 w-8 text-lilac" />}
      </div>
      <div className="text-center">
        <p className="text-base font-semibold text-foreground">Tudo vazio por aqui</p>
        <p className="mt-1 text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
