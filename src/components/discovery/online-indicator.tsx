import { PresenceDot } from "@/components/presence-dot";

interface OnlineIndicatorProps {
  online: boolean;
  size?: number;
}

export function OnlineIndicator({ online, size = 10 }: OnlineIndicatorProps) {
  return <PresenceDot online={online} size={size} />;
}
