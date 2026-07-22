import { cn } from "@/lib/utils";
import { type PostPrivacyValue, PostPrivacy, POST_PRIVACY_META } from "@/lib/types/post";

interface PrivacySelectorProps {
  value: PostPrivacyValue;
  onChange: (privacy: PostPrivacyValue) => void;
}

const PRIVACY_OPTIONS = Object.values(PostPrivacy);

export function PrivacySelector({ value, onChange }: PrivacySelectorProps) {
  return (
    <div className="space-y-1.5">
      {PRIVACY_OPTIONS.map((option) => {
        const meta = POST_PRIVACY_META[option];
        const active = value === option;
        return (
          <label
            key={option}
            className={cn(
              "flex items-center gap-3 rounded-xl border px-4 py-3 cursor-pointer transition-colors",
              active
                ? "border-primary bg-accent"
                : "border-border bg-surface hover:border-primary/40",
            )}
          >
            <span
              className={cn(
                "h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0",
                active ? "border-primary" : "border-muted-foreground/40",
              )}
            >
              {active && <span className="h-2 w-2 rounded-full bg-primary" />}
            </span>
            <input
              type="radio"
              name="privacy"
              value={option}
              checked={active}
              onChange={() => onChange(option)}
              className="sr-only"
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold">{meta.label}</div>
              <div className="text-[11px] text-muted-foreground">{meta.description}</div>
            </div>
          </label>
        );
      })}
    </div>
  );
}
