import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { PresenceVisibility, PresenceVisibilityMeta } from "@/lib/event-checkin/checkin-types";
import type { PresenceVisibilityValue } from "@/lib/event-checkin/checkin-types";

interface PresencePrivacyPickerProps {
  value: PresenceVisibilityValue;
  onChange: (visibility: PresenceVisibilityValue) => void;
  savePreference?: boolean;
  onSavePreferenceChange?: (save: boolean) => void;
}

const OPTIONS = Object.values(PresenceVisibility);

export function PresencePrivacyPicker({
  value,
  onChange,
  savePreference = false,
  onSavePreferenceChange,
}: PresencePrivacyPickerProps) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Quem poderá ver sua presença?
      </p>

      {OPTIONS.map((option) => {
        const meta = PresenceVisibilityMeta[option];
        const selected = value === option;
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={cn(
              "w-full flex items-start gap-3 rounded-2xl border p-3 text-left transition-all active:scale-[0.99]",
              selected
                ? "border-primary bg-primary/5 shadow-soft"
                : "border-border bg-surface hover:bg-accent/40",
            )}
          >
            <motion.span
              animate={{ scale: selected ? 1.1 : 1 }}
              className="text-xl leading-none"
              aria-hidden
            >
              {meta.emoji}
            </motion.span>
            <span className="flex-1 min-w-0">
              <span className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-foreground">{meta.label}</span>
                {selected && <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />}
              </span>
              <span className="mt-0.5 block text-xs text-muted-foreground leading-relaxed">
                {meta.description}
              </span>
            </span>
          </button>
        );
      })}

      {onSavePreferenceChange && (
        <label className="flex cursor-pointer items-center gap-2 px-1 pt-1">
          <button
            type="button"
            role="switch"
            aria-checked={savePreference}
            onClick={() => onSavePreferenceChange(!savePreference)}
            className={cn(
              "relative h-5 w-9 shrink-0 rounded-full transition-colors",
              savePreference ? "bg-primary" : "bg-muted-foreground/30",
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all",
                savePreference ? "left-[18px]" : "left-0.5",
              )}
            />
          </button>
          <span className="text-xs text-muted-foreground">
            Salvar preferência para os próximos check-ins
          </span>
        </label>
      )}
    </div>
  );
}
