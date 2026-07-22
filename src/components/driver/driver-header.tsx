import { Star } from "lucide-react";
import { OnlineSwitch } from "./online-switch";

interface DriverHeaderProps {
  driverName: string;
  rating: number;
  isOnline: boolean;
  onToggleOnline: () => void;
}

export function DriverHeader({ driverName, rating, isOnline, onToggleOnline }: DriverHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-gradient-brand grid place-items-center text-white font-bold text-sm">
          {driverName.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="font-display font-bold text-base text-foreground">{driverName}</h1>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            {rating.toFixed(1)}
          </span>
        </div>
      </div>
      <OnlineSwitch isOnline={isOnline} onToggle={onToggleOnline} />
    </div>
  );
}
