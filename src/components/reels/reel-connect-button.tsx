import { Link } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReelConnectStatus } from "@/lib/reels/reel-social-state";

interface ReelConnectButtonProps {
  status: ReelConnectStatus;
  onConnect: () => void;
}

export function ReelConnectButton({ status, onConnect }: ReelConnectButtonProps) {
  if (status === "unavailable") return null;
  const connected = status === "connected";
  const pending = status === "pending";
  return (
    <button
      type="button"
      data-reel-connect={status}
      onClick={onConnect}
      disabled={pending}
      className={cn(
        "flex items-center gap-2 rounded-full px-4 h-8 text-[11px] font-semibold",
        connected ? "bg-white/15 text-white" : "bg-gradient-brand text-white",
        pending && "opacity-70",
      )}
    >
      <Link className="h-3.5 w-3.5" />
      {connected ? "Conectado" : pending ? "Convite enviado" : "Conectar"}
    </button>
  );
}
