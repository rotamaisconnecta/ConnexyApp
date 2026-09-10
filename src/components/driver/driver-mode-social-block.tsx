/* Bloqueio social durante o Modo Motorista (Fase 6.3).
   Exibido no lugar do conteúdo das rotas sociais enquanto o
   motorista está no Modo Motorista ativo. */

import { Car } from "lucide-react";
import { toast } from "sonner";
import { Colors } from "@/theme";
import { switchToPassengerMode } from "@/hooks/use-driver-mode";

export function DriverModeSocialBlock() {
  function handleBack() {
    if (!switchToPassengerMode()) {
      toast.error("Corrida ativa", {
        description: "Conclua ou cancele a corrida antes de trocar o modo.",
      });
    }
  }

  return (
    <div className="flex min-h-full flex-col items-center justify-center px-6 py-16 text-center">
      <span
        className="grid h-14 w-14 place-items-center rounded-2xl"
        style={{ background: Colors.brand.primary + "1A", color: Colors.brand.primary }}
      >
        <Car className="h-6 w-6" />
      </span>
      <h2 className="mt-5 font-display text-xl font-bold text-foreground">Modo Motorista ativo</h2>
      <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
        Para sua segurança, as conexões sociais ficam pausadas enquanto você está dirigindo.
      </p>
      <button
        type="button"
        onClick={handleBack}
        className="mt-7 rounded-full px-6 py-3 text-sm font-bold text-white"
        style={{ background: Colors.brand.primary }}
      >
        Voltar para modo passageiro
      </button>
    </div>
  );
}
