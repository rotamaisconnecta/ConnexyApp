import type { ReactNode } from "react";

export const catalogInputClass =
  "mt-1.5 h-11 w-full rounded-2xl border border-border bg-surface px-3 text-sm text-foreground";

export const catalogAreaClass =
  "mt-1.5 w-full rounded-2xl border border-border bg-surface px-3 py-2 text-sm text-foreground";

export function CatalogSection({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="space-y-3 rounded-3xl border border-border/60 bg-background/70 p-4">
      <div>
        <h2 className="font-display text-sm font-bold">{title}</h2>
        {hint ? <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{hint}</p> : null}
      </div>
      {children}
    </section>
  );
}

export function CatalogField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block text-xs font-semibold text-muted-foreground">
      {label}
      {children}
    </label>
  );
}
