import type { ReactNode } from "react";
import { CalendarDays, Clock, ImagePlus, MapPin, Tag } from "lucide-react";
import { formatEventDate, formatEventTime } from "@/lib/marketplace/event-utils";
import type { SponsoredPlacement } from "@/lib/ads/sponsored-placement";
import { cn } from "@/lib/utils";
import type { AdTemplateId } from "./ad-template";

export type LiveAdKind = "local" | "evento";

export type LiveAdPreviewModel = {
  kind: LiveAdKind;
  template: AdTemplateId;
  title: string;
  category: string;
  description: string;
  imageUrl?: string;
  location?: string;
  offer?: string;
  offerPlaceholder?: string;
  tags: string[];
  date?: string;
  time?: string;
  endTime?: string;
  ctaLabel: string;
};

type TemplateSkin = {
  layout: "vertical" | "horizontal";
  card: string;
  media: string;
  body: string;
  title: string;
  description: string;
  category: string;
  meta: string;
  offer: string;
  tag: string;
  cta: string;
};

const TEMPLATE_SKINS: Record<AdTemplateId, TemplateSkin> = {
  padrao: {
    layout: "vertical",
    card: "overflow-hidden rounded-2xl border border-border/50 bg-surface shadow-soft",
    media: "relative aspect-[16/10] w-full overflow-hidden",
    body: "flex flex-col p-3",
    title: "font-display text-sm font-semibold leading-snug text-foreground",
    description: "mt-1 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground",
    category: "text-[10px] font-semibold uppercase tracking-wide text-primary",
    meta: "mt-1.5 inline-flex items-center gap-1 text-[11px] text-muted-foreground",
    offer:
      "mt-2 inline-flex w-fit items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold text-primary",
    tag: "rounded-full bg-secondary px-2 py-0.5 text-[9px] font-medium text-muted-foreground",
    cta: "mt-3 h-10 w-full rounded-full bg-primary/10 text-xs font-semibold text-primary transition-colors hover:bg-primary/20 active:scale-[0.98]",
  },
  destaque: {
    layout: "vertical",
    card: "overflow-hidden rounded-3xl border border-primary/30 bg-background shadow-xl",
    media: "relative aspect-[4/3] w-full overflow-hidden",
    body: "flex flex-col p-4",
    title: "font-display text-lg font-bold leading-tight text-foreground",
    description: "mt-1.5 line-clamp-3 text-xs leading-relaxed text-muted-foreground",
    category:
      "w-fit rounded-full bg-gradient-to-r from-primary to-accent px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-primary-foreground",
    meta: "mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-foreground/80",
    offer:
      "mt-2.5 inline-flex w-fit items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[10px] font-bold text-primary",
    tag: "rounded-full border border-primary/25 bg-primary/5 px-2 py-0.5 text-[9px] font-semibold text-primary",
    cta: "mt-4 h-11 w-full rounded-full bg-primary text-xs font-bold text-primary-foreground shadow-soft transition-opacity hover:opacity-90 active:scale-[0.98]",
  },
  moderno: {
    layout: "horizontal",
    card: "flex gap-3 overflow-hidden rounded-3xl border border-border/50 bg-gradient-to-br from-background via-background to-primary/5 shadow-soft",
    media: "relative aspect-square w-24 shrink-0 overflow-hidden rounded-none sm:w-28",
    body: "flex min-w-0 flex-1 flex-col p-3",
    title: "font-display text-sm font-bold leading-snug text-foreground",
    description: "mt-1 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground",
    category:
      "w-fit rounded-full bg-primary/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-primary",
    meta: "mt-1.5 inline-flex items-center gap-1 text-[11px] text-muted-foreground",
    offer:
      "mt-2 inline-flex w-fit items-center gap-1 rounded-2xl bg-secondary px-2.5 py-1 text-[10px] font-bold text-foreground",
    tag: "rounded-full bg-secondary px-2 py-0.5 text-[9px] font-medium text-muted-foreground",
    cta: "mt-3 h-9 w-full rounded-2xl bg-primary text-xs font-bold text-primary-foreground transition-opacity hover:opacity-90 active:scale-[0.98]",
  },
  minimalista: {
    layout: "vertical",
    card: "overflow-hidden rounded-2xl border border-border bg-background",
    media: "relative aspect-[21/9] w-full overflow-hidden",
    body: "flex flex-col p-4",
    title: "font-display text-sm font-medium tracking-tight text-foreground",
    description: "mt-1.5 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground",
    category: "text-[9px] font-medium uppercase tracking-[0.18em] text-muted-foreground",
    meta: "mt-2 inline-flex items-center gap-1.5 text-[11px] text-muted-foreground",
    offer:
      "mt-2.5 inline-flex w-fit items-center gap-1.5 border-b border-border pb-0.5 text-[10px] font-medium uppercase tracking-wide text-foreground/70",
    tag: "text-[9px] uppercase tracking-[0.14em] text-muted-foreground",
    cta: "mt-4 h-9 w-full rounded-none border border-border bg-transparent text-[11px] font-semibold uppercase tracking-wide text-foreground transition-colors hover:bg-secondary/50",
  },
};

function resolveText(value: string | undefined, placeholder: string) {
  const trimmed = value?.trim() ?? "";
  return trimmed ? { value: trimmed, missing: false } : { value: placeholder, missing: true };
}

function parseLocalDate(value: string | undefined): Date | null {
  if (!value) return null;
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00` : value;
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function LiveAdPreview({
  model,
  placement,
  className,
}: {
  model: LiveAdPreviewModel;
  /**
   * Superfície preparada para o sistema de anúncios. Hoje nenhum preenchimento
   * é feita aqui: quando ausente, a prévia usa apenas os valores do formulário.
   */
  placement?: SponsoredPlacement;
  className?: string;
}) {
  const skin = TEMPLATE_SKINS[model.template] ?? TEMPLATE_SKINS.padrao;
  const title = resolveText(model.title, "Título do anúncio");
  const category = resolveText(model.category, "Categoria");
  const description = resolveText(model.description, "Sua descrição aparece aqui.");
  const location = resolveText(model.location, "Informe a localização");
  const offer = resolveText(model.offer, model.offerPlaceholder ?? "Adicione uma oferta");
  const ctaLabel = model.ctaLabel;
  const isEvent = model.kind === "evento";

  const startDate = parseLocalDate(model.date);
  const startTime = parseLocalDate(model.time);
  const endTime = parseLocalDate(model.endTime);

  const dateLabel = startDate ? formatEventDate(startDate) : null;
  const timeLabel = startTime
    ? endTime
      ? `${formatEventTime(startTime)} - ${formatEventTime(endTime)}`
      : formatEventTime(startTime)
    : null;

  function media() {
    return model.imageUrl ? (
      <img src={model.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
    ) : (
      <div
        className={cn(
          "absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-gradient-to-br from-primary/10 via-secondary/40 to-surface text-muted-foreground",
          model.template === "minimalista" && "bg-secondary/30",
        )}
      >
        <ImagePlus className="h-5 w-5 opacity-60" />
        <span className="px-3 text-center text-[10px] leading-tight opacity-70">
          Adicione uma imagem
        </span>
      </div>
    );
  }

  function categoryBadge() {
    return (
      <span className={cn(skin.category, category.missing && "opacity-60")}>{category.value}</span>
    );
  }

  function metaRow(icon: ReactNode, label: string, missing: boolean) {
    return (
      <span className={cn(skin.meta, missing && "opacity-60")}>
        {icon}
        <span className="truncate">{label}</span>
      </span>
    );
  }

  function metaRows() {
    return (
      <div className="flex flex-col">
        {isEvent && dateLabel
          ? metaRow(<CalendarDays className="h-3.5 w-3.5 shrink-0" />, dateLabel, false)
          : null}
        {isEvent && timeLabel
          ? metaRow(<Clock className="h-3.5 w-3.5 shrink-0" />, timeLabel, false)
          : null}
        {metaRow(<MapPin className="h-3.5 w-3.5 shrink-0" />, location.value, location.missing)}
        <span className={cn(skin.offer, offer.missing && "opacity-60")}>
          {isEvent ? <Tag className="h-3 w-3 shrink-0" /> : <Clock className="h-3 w-3 shrink-0" />}
          <span className="truncate">{offer.value}</span>
        </span>
      </div>
    );
  }

  function tagRow() {
    if (model.tags.length === 0) return null;
    return (
      <div className="mt-2 flex flex-wrap gap-1.5">
        {model.tags.map((tag) => (
          <span key={tag} className={skin.tag}>
            {tag}
          </span>
        ))}
      </div>
    );
  }

  const body = (
    <>
      {categoryBadge()}
      <h3 className={cn(skin.title, title.missing && "opacity-60")}>{title.value}</h3>
      <p className={cn(skin.description, description.missing && "italic opacity-60")}>
        {description.value}
      </p>
      {metaRows()}
      {tagRow()}
      <span className={cn(skin.cta, "inline-grid place-items-center")}>{ctaLabel}</span>
    </>
  );

  return (
    <article className={cn("w-full", skin.card, className)} data-live-ad-preview={model.template}>
      <div className={skin.media}>
        {media()}
        {placement?.sponsored === true ? (
          <span className="absolute top-2.5 left-2.5 z-10 rounded-full bg-white/90 px-2.5 py-0.5 text-[10px] font-semibold text-gray-800 shadow-soft">
            Patrocinado
          </span>
        ) : null}
      </div>
      <div className={skin.body}>{body}</div>
    </article>
  );
}
