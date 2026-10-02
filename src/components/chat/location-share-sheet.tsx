import { useEffect } from "react";
import { Loader2, RefreshCw, ShieldAlert, X } from "lucide-react";
import { useGeolocation } from "@/hooks/use-geolocation";
import { formatCurrentLocationShare } from "@/lib/chat/current-location";
import { MapCanvas } from "@/components/map-canvas";

export function LocationShareSheet({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (input: { label: string; proximity: string; lat: number; lng: number }) => void;
}) {
  const geo = useGeolocation({ enableHighAccuracy: true, maximumAge: 0 });
  const share =
    geo.latitude != null && geo.longitude != null
      ? formatCurrentLocationShare({
          latitude: geo.latitude,
          longitude: geo.longitude,
          accuracy: geo.accuracy,
        })
      : null;

  useEffect(() => {
    if (open) geo.request();
  }, [open, geo.request]);

  if (!open) return null;

  const locating =
    geo.isLoading || (geo.permission === "prompt" && !share && !geo.error);

  return (
    <div
      className="absolute inset-0 z-[70] flex items-end bg-[#3B2A78]/18 p-3 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-labelledby="location-share-title"
        aria-modal="true"
        className="w-full overflow-hidden rounded-[28px] bg-white shadow-[0_18px_40px_rgba(108,59,255,0.12)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between px-4 pt-4">
          <div>
            <h2 id="location-share-title" className="text-sm font-semibold">
              Compartilhar localização
            </h2>
            <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
              Usamos sua localização atual só para enviar este ponto na conversa.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full bg-secondary"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-4 pb-5 pt-3">
          {locating ? (
            <div className="grid h-36 place-items-center rounded-[22px] bg-primary/[0.06]">
              <div className="flex flex-col items-center gap-2 text-primary">
                <Loader2 className="h-5 w-5 animate-spin" />
                <p className="text-xs font-medium">Obtendo sua localização…</p>
              </div>
            </div>
          ) : geo.permission === "denied" ? (
            <div className="rounded-[22px] bg-destructive/5 p-4">
              <ShieldAlert className="h-5 w-5 text-destructive" />
              <p className="mt-2 text-sm font-semibold">Permissão negada</p>
              <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
                Nada foi enviado. Autorize a localização nas configurações do navegador e tente de
                novo.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 h-10 w-full rounded-full bg-secondary text-sm font-semibold"
              >
                Voltar à conversa
              </button>
            </div>
          ) : geo.error || !share ? (
            <div className="rounded-[22px] bg-secondary p-4">
              <p className="text-sm font-semibold">Não foi possível obter a localização</p>
              <p className="mt-1 text-[12px] text-muted-foreground">
                {geo.error ?? "Tente novamente para capturar o ponto atual."}
              </p>
              <button
                type="button"
                onClick={() => geo.request()}
                className="mt-3 inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-primary px-4 text-sm font-semibold text-white"
              >
                <RefreshCw className="h-4 w-4" />
                Tentar novamente
              </button>
            </div>
          ) : (
            <>
              <div className="overflow-hidden rounded-[22px] bg-primary/[0.06]">
                <MapCanvas height={128} pins={[{ x: 50, y: 52, kind: "user" }]} />
                <div className="space-y-1 px-3.5 py-3">
                  <p className="text-sm font-semibold">{share.label}</p>
                  <p className="text-[12px] text-muted-foreground">{share.proximity}</p>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="h-11 flex-1 rounded-full bg-secondary text-sm font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => onConfirm(share)}
                  className="h-11 flex-1 rounded-full bg-gradient-brand text-sm font-semibold text-white"
                >
                  Enviar
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
