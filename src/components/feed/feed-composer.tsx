import { Camera, MapPin, Sparkles } from "lucide-react";
import { Link } from "@tanstack/react-router";

interface FeedComposerProps {
  userName: string;
  userPhoto: string;
}

export function FeedComposer({ userName, userPhoto }: FeedComposerProps) {
  return (
    <div className="flex items-center gap-3 rounded-3xl border border-border bg-surface p-3 shadow-soft">
      <img
        src={userPhoto}
        alt={`Foto de ${userName}`}
        className="h-10 w-10 rounded-full object-cover shrink-0"
      />
      <Link
        to="/create-post"
        className="flex-1 rounded-xl bg-secondary px-4 py-2.5 text-sm text-muted-foreground hover:bg-accent transition-colors text-left"
      >
        No que você está pensando?
      </Link>
      <div className="flex items-center gap-1">
        <QuickAction icon={Camera} label="Foto" />
        <QuickAction icon={MapPin} label="Local" />
        <QuickAction icon={Sparkles} label="Momento" />
      </div>
    </div>
  );
}

function QuickAction({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <button
      type="button"
      className="h-9 w-9 grid place-items-center rounded-xl bg-secondary text-muted-foreground hover:bg-accent hover:text-primary transition-colors"
      aria-label={label}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
