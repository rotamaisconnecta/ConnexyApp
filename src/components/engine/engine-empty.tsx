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
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#F4F1FF]">
        {icon ?? <Brain className="h-8 w-8 text-[#A88DFF]" />}
      </div>
      <div className="text-center">
        <p className="text-base font-semibold text-[#18181B]">Tudo vazio por aqui</p>
        <p className="mt-1 text-sm text-[#71717A]">{message}</p>
      </div>
    </div>
  );
}
