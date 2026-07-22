import { Sparkles } from "lucide-react";

interface MutualInterestsProps {
  interests: string[];
  maxShow?: number;
}

export function MutualInterests({ interests, maxShow = 3 }: MutualInterestsProps) {
  if (interests.length === 0) return null;

  const shown = interests.slice(0, maxShow);
  const remaining = interests.length - maxShow;

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <Sparkles className="h-3 w-3 text-primary shrink-0" />
      {shown.map((interest) => (
        <span
          key={interest}
          className="rounded-full bg-primary/10 text-primary text-[10px] font-semibold px-2 py-0.5"
        >
          {interest}
        </span>
      ))}
      {remaining > 0 && <span className="text-[10px] text-muted-foreground">+{remaining}</span>}
    </div>
  );
}
