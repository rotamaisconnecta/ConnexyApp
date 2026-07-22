import { UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConnectButtonProps {
  onClick: () => void;
  connected?: boolean;
  disabled?: boolean;
}

export function ConnectButton({
  onClick,
  connected = false,
  disabled = false,
}: ConnectButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || connected}
      className={cn(
        "h-9 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-[0.97]",
        connected
          ? "bg-secondary text-muted-foreground cursor-default"
          : "bg-gradient-brand text-white shadow-soft hover:brightness-110",
        disabled && "opacity-50 cursor-not-allowed",
      )}
      aria-label={connected ? "Conectado" : "Conectar"}
    >
      <UserPlus className="h-3.5 w-3.5" />
      {connected ? "Conectado" : "Conectar"}
    </button>
  );
}
