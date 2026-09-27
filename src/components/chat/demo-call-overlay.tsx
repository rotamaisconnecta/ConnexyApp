import { Phone, PhoneOff, Video } from "lucide-react";
import { DEMO_CALL_FEEDBACK, type DemoCallSession } from "@/lib/chat/demo-call";

interface DemoCallOverlayProps {
  call: DemoCallSession;
  peerName: string;
  onAccept: () => void;
  onDecline: () => void;
  onHangup: () => void;
}

export function DemoCallOverlay({
  call,
  peerName,
  onAccept,
  onDecline,
  onHangup,
}: DemoCallOverlayProps) {
  const isVideo = call.media === "video";
  const label = isVideo ? "Videochamada" : "Ligação de voz";
  const outgoing = call.status === "outgoing";

  return (
    <div
      className="absolute inset-0 z-30 flex flex-col bg-background/95 px-6 py-10"
      data-demo-call-overlay
      data-demo-call-media={call.media}
      data-demo-call-status={call.status}
    >
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <span className="grid h-16 w-16 place-items-center rounded-3xl bg-primary/10 text-primary">
          {isVideo ? <Video className="h-7 w-7" /> : <Phone className="h-7 w-7" />}
        </span>
        <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {label} (demo)
        </p>
        <h2 className="mt-1 font-display text-xl font-bold">{peerName}</h2>
        <p className="mt-2 max-w-xs text-sm text-muted-foreground">{DEMO_CALL_FEEDBACK}</p>
        <p className="mt-3 text-sm font-medium">
          {outgoing ? "Chamando…" : "Conectado no modo demo"}
        </p>
      </div>

      <div className="flex gap-3">
        {outgoing ? (
          <>
            <button
              type="button"
              onClick={onDecline}
              className="h-12 flex-1 rounded-2xl bg-red-500/10 text-sm font-bold text-red-600"
            >
              Encerrar
            </button>
            <button
              type="button"
              onClick={onAccept}
              className="h-12 flex-1 rounded-2xl bg-primary text-sm font-bold text-primary-foreground"
            >
              Simular atendimento
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={onHangup}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-red-500 text-sm font-bold text-white"
          >
            <PhoneOff className="h-4 w-4" />
            Encerrar
          </button>
        )}
      </div>
    </div>
  );
}
