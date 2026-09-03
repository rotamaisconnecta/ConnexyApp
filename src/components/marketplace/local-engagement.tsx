import { useState } from "react";
import { Bookmark, Check, Copy, Phone, Share2, Star, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type LocalReview = {
  id: string;
  author: string;
  rating: number;
  text: string;
  createdAt: number;
};

type RedeemedPromotion = {
  targetId: string;
  promotionId: string;
  title: string;
  code: string;
  redeemedAt: number;
};

const SAVED_KEY = "connexy:demo:saved-details";
const REVIEWS_KEY_PREFIX = "connexy:demo:recent-reviews:";
const PROMOTIONS_KEY = "connexy:demo:redeemed-promotions";

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    return JSON.parse(window.localStorage.getItem(key) ?? "") as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    toast.error("Não foi possível salvar neste dispositivo.");
  }
}

function savedDetailIds(): string[] {
  const value = readJson<unknown>(SAVED_KEY, []);
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

export function DetailActionBar({
  targetId,
  title,
  phone,
}: {
  targetId: string;
  title: string;
  phone?: string;
}) {
  const [saved, setSaved] = useState(() => savedDetailIds().includes(targetId));

  const toggleSaved = () => {
    const current = savedDetailIds();
    const next = current.includes(targetId)
      ? current.filter((id) => id !== targetId)
      : [...current, targetId];
    writeJson(SAVED_KEY, next);
    setSaved(next.includes(targetId));
    toast.success(next.includes(targetId) ? "Salvo nos seus itens." : "Removido dos itens salvos.");
  };

  const share = async () => {
    const data = {
      title: `${title} no Connexy`,
      text: `Veja ${title} no Connexy.`,
      url: window.location.href,
    };
    try {
      if (navigator.share) await navigator.share(data);
      else {
        await navigator.clipboard.writeText(data.url);
        toast.success("Link copiado para compartilhar.");
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      toast.error("Não foi possível compartilhar agora.");
    }
  };

  const call = () => {
    if (phone) {
      window.location.href = `tel:${phone}`;
      return;
    }
    toast("Este local ainda não cadastrou telefone.");
  };

  return (
    <div className="grid grid-cols-3 gap-2">
      <ActionButton icon={Phone} label="Ligar" onClick={call} />
      <ActionButton
        icon={Bookmark}
        label={saved ? "Salvo" : "Salvar"}
        active={saved}
        onClick={toggleSaved}
      />
      <ActionButton icon={Share2} label="Compartilhar" onClick={() => void share()} />
    </div>
  );
}

function ActionButton({
  icon: Icon,
  label,
  active = false,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl bg-secondary px-2 py-2 text-[10px] font-semibold transition active:scale-[0.97]",
        active && "bg-primary/12 text-primary",
      )}
    >
      <Icon className={cn("h-4 w-4 text-primary", active && "fill-current")} />
      <span className="truncate">{label}</span>
    </button>
  );
}

export function PromotionRedeemCard({
  targetId,
  promotionId,
  title,
  description,
}: {
  targetId: string;
  promotionId: string;
  title: string;
  description: string;
}) {
  const [voucher, setVoucher] = useState<RedeemedPromotion | null>(() => {
    const vouchers = readJson<RedeemedPromotion[]>(PROMOTIONS_KEY, []);
    return (
      vouchers.find((item) => item.targetId === targetId && item.promotionId === promotionId) ??
      null
    );
  });

  const redeem = () => {
    const vouchers = readJson<RedeemedPromotion[]>(PROMOTIONS_KEY, []);
    const existing = vouchers.find(
      (item) => item.targetId === targetId && item.promotionId === promotionId,
    );
    if (existing) {
      setVoucher(existing);
      return;
    }
    const code = `CX-${targetId
      .replace(/[^a-z0-9]/gi, "")
      .slice(0, 5)
      .toUpperCase()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
    const next = { targetId, promotionId, title, code, redeemedAt: Date.now() };
    writeJson(PROMOTIONS_KEY, [...vouchers, next]);
    setVoucher(next);
    toast.success("Promoção ativada no seu Connexy.");
  };

  const copyCode = async () => {
    if (!voucher) return;
    try {
      await navigator.clipboard.writeText(voucher.code);
      toast.success("Código copiado.");
    } catch {
      toast("Mostre este código no estabelecimento.");
    }
  };

  return (
    <div className="rounded-2xl bg-gradient-brand p-4 text-white shadow-elegant">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-white/80">
        Promoção Connexy
      </p>
      <h3 className="mt-1 font-display text-lg font-bold">{title}</h3>
      <p className="mt-1 text-xs leading-relaxed text-white/85">{description}</p>

      {voucher ? (
        <div className="mt-3 rounded-xl bg-white/15 p-3 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Check className="h-4 w-4" /> Cupom Connexy ativo
          </div>
          <p className="mt-1 text-[11px] text-white/80">
            Mostre este código no local para aplicar a promoção.
          </p>
          <button
            type="button"
            onClick={() => void copyCode()}
            className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-primary"
          >
            <Copy className="h-3.5 w-3.5" /> {voucher.code}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={redeem}
          className="mt-3 rounded-full bg-white px-3.5 py-2 text-xs font-bold text-primary transition active:scale-[0.97]"
        >
          Usar promoção
        </button>
      )}
    </div>
  );
}

export function RecentReviewSection({
  targetId,
  initialReviews = [],
}: {
  targetId: string;
  initialReviews?: Array<{ author: string; rating: number; text: string }>;
}) {
  const [reviews, setReviews] = useState<LocalReview[]>(() =>
    readJson<LocalReview[]>(`${REVIEWS_KEY_PREFIX}${targetId}`, []),
  );
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");

  const submitReview = () => {
    const message = text.trim();
    if (message.length < 3) {
      toast.error("Escreva uma avaliação curta antes de publicar.");
      return;
    }
    const review: LocalReview = {
      id: `${Date.now()}`,
      author: "Você",
      rating,
      text: message,
      createdAt: Date.now(),
    };
    const next = [review, ...reviews];
    setReviews(next);
    writeJson(`${REVIEWS_KEY_PREFIX}${targetId}`, next);
    setText("");
    toast.success("Sua avaliação foi publicada localmente.");
  };

  const displayReviews = [
    ...reviews,
    ...initialReviews.map((review, index) => ({
      id: `initial-${index}`,
      ...review,
      createdAt: 0,
    })),
  ].slice(0, 4);

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-sm font-bold">Avaliações recentes</h2>
        <span className="text-[10px] text-muted-foreground">Compartilhe sua experiência</span>
      </div>
      <div className="rounded-2xl border border-border bg-surface p-3 shadow-soft">
        <div className="flex gap-1" aria-label="Sua nota">
          {Array.from({ length: 5 }, (_, index) => {
            const value = index + 1;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setRating(value)}
                aria-label={`${value} estrelas`}
                className="grid h-8 w-8 place-items-center rounded-full transition hover:bg-amber-50"
              >
                <Star
                  className={cn(
                    "h-4 w-4",
                    value <= rating ? "fill-amber text-amber" : "text-border",
                  )}
                />
              </button>
            );
          })}
        </div>
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          maxLength={280}
          rows={3}
          placeholder="Como foi sua experiência?"
          className="mt-2 w-full resize-none rounded-xl bg-secondary/65 px-3 py-2 text-sm outline-none ring-primary/20 transition focus:ring-2"
        />
        <button
          type="button"
          onClick={submitReview}
          className="mt-2 h-9 rounded-full bg-primary px-4 text-xs font-semibold text-primary-foreground transition active:scale-[0.97]"
        >
          Publicar avaliação
        </button>
      </div>

      <div className="space-y-2">
        {displayReviews.map((review) => (
          <article key={review.id} className="rounded-2xl border border-border p-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold">{review.author}</span>
              <span className="flex items-center gap-0.5 text-amber">
                {Array.from({ length: review.rating }, (_, index) => (
                  <Star key={index} className="h-3 w-3 fill-current" />
                ))}
              </span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{review.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
