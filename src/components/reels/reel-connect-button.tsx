import { Link } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReelConnectButtonProps {
  onConnect: () => void;
}

export function ReelConnectButton({ onConnect }: ReelConnectButtonProps) {
  return (
    <button
      onClick={onConnect}
      className={cn(
        "flex items-center gap-2 rounded-full px-4 h-8",
        "bg-gradient-brand text-white text-[11px] font-semibold",
      )}
    >
      <Link className="h-3.5 w-3.5" />
      Conectar
    </button>
  );
}
