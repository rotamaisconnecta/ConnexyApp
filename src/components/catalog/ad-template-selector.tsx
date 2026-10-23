import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { AD_TEMPLATES, type AdTemplateId } from "./ad-template";

const swatchClassMap: Record<AdTemplateId, string> = {
  padrao: "bg-gradient-to-br from-primary/25 via-secondary/50 to-surface",
  destaque: "bg-gradient-to-br from-primary via-primary/55 to-accent/40",
  moderno: "bg-gradient-to-br from-accent/60 via-secondary to-primary/25",
  minimalista: "bg-surface",
};

const skeletonClassMap: Record<AdTemplateId, string> = {
  padrao: "h-6 w-full rounded-md bg-background/70",
  destaque: "h-8 w-full rounded-lg bg-background/80",
  moderno: "h-6 w-full rounded-full bg-background/60",
  minimalista: "h-px w-full rounded-full bg-border",
};

export function AdTemplateSelector({
  value,
  onChange,
}: {
  value: AdTemplateId;
  onChange: (next: AdTemplateId) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4" data-catalog-field="template">
      {AD_TEMPLATES.map((template) => {
        const selected = template.id === value;
        return (
          <button
            key={template.id}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(template.id)}
            className={cn(
              "group flex flex-col items-start gap-2 rounded-2xl border p-2.5 text-left transition-all",
              selected
                ? "border-primary/60 bg-primary/5 shadow-soft"
                : "border-border/60 bg-background/70 hover:border-border hover:bg-secondary/40",
            )}
          >
            <span
              className={cn(
                "relative flex h-16 w-full flex-col justify-center gap-1.5 overflow-hidden rounded-xl p-2",
                swatchClassMap[template.id],
              )}
            >
              <span className={cn("block", skeletonClassMap[template.id])} />
              <span className="block h-2 w-2/3 rounded-full bg-background/60" />
              {selected ? (
                <span className="absolute top-1.5 right-1.5 grid h-5 w-5 place-items-center rounded-full bg-primary text-primary-foreground">
                  <Check className="h-3 w-3" />
                </span>
              ) : null}
            </span>
            <span className="px-0.5">
              <span
                className={cn(
                  "block font-display text-xs font-bold",
                  selected ? "text-primary" : "text-foreground",
                )}
              >
                {template.label}
              </span>
              <span className="mt-0.5 block text-[10px] leading-tight text-muted-foreground">
                {template.hint}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
