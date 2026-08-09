import { PhoneFrame } from "@/components/phone-frame";
import { CloudOff, RotateCw } from "lucide-react";

export function BackendOffline() {
  return (
    <PhoneFrame>
      <div className="flex-1 grid place-items-center px-6 text-center">
        <div>
          <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-secondary text-primary">
            <CloudOff className="h-6 w-6" />
          </span>
          <h1 className="text-lg font-bold text-foreground">Conexão indisponível</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Não foi possível conectar aos serviços do Connexy neste momento. Atualize a página em
            alguns instantes.
          </p>
          <button
            type="button"
            onClick={() => {
              if (typeof window !== "undefined") window.location.reload();
            }}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-brand px-5 py-2.5 text-sm font-semibold text-white shadow-elegant"
          >
            <RotateCw className="h-4 w-4" />
            Tentar novamente
          </button>
        </div>
      </div>
    </PhoneFrame>
  );
}
