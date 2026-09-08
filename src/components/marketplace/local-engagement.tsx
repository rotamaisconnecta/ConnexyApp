import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Bookmark,
  CarFront,
  Check,
  Copy,
  MapPin,
  Phone,
  Send,
  Share2,
  Star,
  UsersRound,
  X,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { people, type Person } from "@/lib/mock-data";
import { estimateRouteDistance } from "@/lib/mobility/route-utils";

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
const OUTING_INVITES_KEY = "connexy:demo:outing-invites";

type OutingTarget = {
  id: string;
  title: string;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

const MAX_COMPANIONS = 3;

type CompanionStop = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
};

const DEMO_STREETS = [
  "Rua Augusta, 1420",
  "Alameda Santos, 980",
  "Rua Oscar Freire, 512",
  "Rua Haddock Lobo, 1377",
  "Av. Paulista, 1578",
  "Rua Vergueiro, 2434",
  "Rua dos Pinheiros, 690",
  "Rua Peixoto Gomide, 128",
] as const;

const DEMO_NEIGHBORHOODS = [
  "Consolação",
  "Bela Vista",
  "Jardins",
  "Pinheiros",
  "Vila Mariana",
  "Moema",
] as const;

const DEMO_ORIGIN = { lat: -23.55, lng: -46.64, label: "Minha localização" };

function companionLocation(
  personId: string,
  distanceMeters: number,
): { address: string; lat: number; lng: number } {
  const street = DEMO_STREETS[personId.length % DEMO_STREETS.length];
  const number = 100 + ((personId.charCodeAt(0) + personId.charCodeAt(personId.length - 1)) % 1800);
  const neighborhood =
    DEMO_NEIGHBORHOODS[(personId.charCodeAt(1) || 0) % DEMO_NEIGHBORHOODS.length];
  const baseName = street.slice(0, street.lastIndexOf(",")).trim();
  const angle = ((personId.length * 7) % 8) * (Math.PI / 4);
  const lat = DEMO_ORIGIN.lat + (distanceMeters / 111_000) * Math.cos(angle);
  const lng =
    DEMO_ORIGIN.lng +
    (distanceMeters / (111_000 * Math.cos((DEMO_ORIGIN.lat * Math.PI) / 180))) * Math.sin(angle);
  return {
    address: `${baseName}, ${number} — ${neighborhood}`,
    lat,
    lng,
  };
}

function companionStopFor(person: Person): CompanionStop {
  const fallback = companionLocation(person.id, person.distanceMeters);
  return {
    id: person.id,
    name: person.name,
    address: person.address ?? fallback.address,
    lat: person.latitude ?? fallback.lat,
    lng: person.longitude ?? fallback.lng,
  };
}

function orderCompanionsByRoute(companions: CompanionStop[]): CompanionStop[] {
  if (companions.length <= 1) return companions;
  const remaining = [...companions];
  const ordered: CompanionStop[] = [];
  let cursor = DEMO_ORIGIN;
  while (remaining.length > 0) {
    let bestIndex = 0;
    let bestDistance = Number.POSITIVE_INFINITY;
    for (let index = 0; index < remaining.length; index += 1) {
      const distance = estimateRouteDistance(cursor, {
        lat: remaining[index].lat,
        lng: remaining[index].lng,
        label: remaining[index].address,
      });
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = index;
      }
    }
    const [next] = remaining.splice(bestIndex, 1);
    ordered.push(next);
    cursor = { lat: next.lat, lng: next.lng, label: next.address };
  }
  return ordered;
}

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
  outing,
}: {
  targetId: string;
  title: string;
  phone?: string;
  outing?: OutingTarget;
}) {
  const [saved, setSaved] = useState(() => savedDetailIds().includes(targetId));
  const [inviteOpen, setInviteOpen] = useState(false);

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
    <>
      <div className="grid grid-cols-4 gap-2">
        <ActionButton icon={Phone} label="Ligar" onClick={call} />
        <ActionButton
          icon={Bookmark}
          label={saved ? "Salvo" : "Salvar"}
          active={saved}
          onClick={toggleSaved}
        />
        <ActionButton icon={Share2} label="Compartilhar" onClick={() => void share()} />
        {outing && (
          <ActionButton icon={UsersRound} label="Ir juntos" onClick={() => setInviteOpen(true)} />
        )}
      </div>
      {outing && (
        <InviteTogetherSheet
          target={outing}
          open={inviteOpen}
          onClose={() => setInviteOpen(false)}
        />
      )}
    </>
  );
}

function InviteTogetherSheet({
  target,
  open,
  onClose,
}: {
  target: OutingTarget;
  open: boolean;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [message, setMessage] = useState(`Vamos juntos para ${target.title}?`);
  const [accepted, setAccepted] = useState<CompanionStop[]>([]);
  const candidates = people.slice(0, 7);

  if (!open) return null;

  const togglePerson = (personId: string) => {
    setSelectedIds((current) => {
      if (current.includes(personId)) return current.filter((id) => id !== personId);
      if (current.length >= MAX_COMPANIONS) {
        toast.error("Você pode convidar até 3 pessoas para ir junto.");
        return current;
      }
      return [...current, personId];
    });
  };

  const buildCompanions = (): CompanionStop[] =>
    people.filter((person) => selectedIds.includes(person.id)).map(companionStopFor);

  const sendInvite = () => {
    if (selectedIds.length === 0) {
      toast.error("Escolha ao menos uma pessoa para convidar.");
      return;
    }
    const companions = buildCompanions();
    const current = readJson<Array<Record<string, unknown>>>(OUTING_INVITES_KEY, []);
    writeJson(OUTING_INVITES_KEY, [
      ...companions.map((companion) => ({
        id: `outing-${Date.now()}-${companion.id}`,
        targetId: target.id,
        personId: companion.id,
        message: message.trim(),
        status: "accepted",
        createdAt: Date.now(),
      })),
      ...current,
    ]);
    toast.success(
      companions.length === 1
        ? `Convite enviado para ${companions[0].name.split(" ")[0]}.`
        : `${companions.length} convites enviados.`,
    );
    setAccepted(companions);
  };

  const orderedRoute = accepted.length > 0 ? orderCompanionsByRoute(accepted) : [];

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end bg-black/35 p-3 backdrop-blur-[1px] sm:items-center sm:justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Convidar para ir junto"
    >
      <div className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-[28px] bg-background p-5 shadow-elevated no-scrollbar">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-bold">Convidar para ir junto</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Convide até {MAX_COMPANIONS} amigos para {target.title} e divida a rota.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full bg-secondary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {accepted.length === 0 ? (
          <>
            <label className="mt-5 block text-xs font-semibold">
              Quem você quer convidar?{" "}
              <span className="text-muted-foreground">
                ({selectedIds.length}/{MAX_COMPANIONS})
              </span>
            </label>
            <ul className="mt-2 space-y-2">
              {candidates.map((person) => {
                const location = companionStopFor(person);
                const selected = selectedIds.includes(person.id);
                const readsOnly = !selected && selectedIds.length >= MAX_COMPANIONS;
                return (
                  <li key={person.id}>
                    <button
                      type="button"
                      onClick={() => togglePerson(person.id)}
                      disabled={readsOnly}
                      aria-pressed={selected}
                      className={`flex w-full items-center gap-3 rounded-2xl border p-2.5 text-left transition disabled:opacity-50 ${
                        selected ? "border-primary/50 bg-primary/5" : "border-border bg-surface"
                      }`}
                    >
                      <img
                        src={person.photo}
                        alt=""
                        className="h-11 w-11 rounded-full object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold">{person.name}</div>
                        <div className="truncate text-[11px] text-muted-foreground">
                          {location.address}
                        </div>
                      </div>
                      <span
                        className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border ${
                          selected ? "border-primary bg-primary text-white" : "border-border"
                        }`}
                      >
                        {selected && <Check className="h-3.5 w-3.5" />}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className="mt-4 flex items-start gap-2 rounded-2xl border border-primary/20 bg-primary/5 px-3 py-2.5">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Ao aceitar o convite de ir junto, cada amigo também aceita{" "}
                <strong className="text-foreground">compartilhar a localização</strong> — usada como
                paradas para definir a melhor rota até o destino.
              </p>
            </div>

            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={2}
              maxLength={240}
              className="mt-3 w-full resize-none rounded-xl bg-secondary/70 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            />

            <button
              type="button"
              onClick={sendInvite}
              disabled={selectedIds.length === 0}
              className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-gradient-brand text-sm font-bold text-white shadow-elegant disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send className="h-4 w-4" /> Enviar convite{selectedIds.length > 1 ? "s" : ""}
            </button>
          </>
        ) : (
          <div className="mt-5 space-y-3">
            <div className="rounded-2xl bg-primary/10 p-4">
              <div className="flex items-center gap-2 text-sm font-bold text-primary">
                <Check className="h-4 w-4" />
                {accepted.map((companion) => companion.name.split(" ")[0]).join(", ")}{" "}
                {accepted.length > 1 ? "aceitaram" : "aceitou"} o convite
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Cada pessoa compartilhou a localização. O Connexy calculou a melhor rota com as
                paradas planejadas até {target.title}.
              </p>
            </div>

            <div className="rounded-2xl bg-secondary/60 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Rota planejada
              </p>
              <ul className="mt-2 space-y-1.5 text-xs">
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-success" />
                  <span className="font-medium">Sua localização</span>
                </li>
                {orderedRoute.map((companion) => (
                  <li key={companion.id} className="flex items-center gap-2">
                    <span className="h-2 w-2 shrink-0 rounded-full bg-amber-500" />
                    <span className="font-medium">{companion.name.split(" ")[0]}</span>
                    <span className="truncate text-muted-foreground">— {companion.address}</span>
                  </li>
                ))}
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 shrink-0 rounded-sm bg-primary" />
                  <span className="font-medium">{target.title}</span>
                </li>
              </ul>
            </div>

            <button
              type="button"
              onClick={() =>
                navigate({
                  to: "/ride/request",
                  search: {
                    destinationId: target.id,
                    destinationName: target.title,
                    destinationAddress: target.address ?? null,
                    destinationLat: target.latitude ?? null,
                    destinationLng: target.longitude ?? null,
                    companions: JSON.stringify(accepted),
                    source: "invite",
                  },
                })
              }
              className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-gradient-brand text-sm font-bold text-white shadow-elegant"
            >
              <CarFront className="h-4 w-4" /> Pedir corrida pelo Connexy
            </button>
          </div>
        )}
      </div>
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
      <span className="text-center leading-tight">{label}</span>
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
                className="grid h-8 w-8 place-items-center rounded-full transition hover:bg-yellow-50"
              >
                <Star
                  className={cn(
                    "h-4 w-4",
                    value <= rating ? "fill-yellow-400 text-yellow-400" : "text-border",
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
              <span className="flex items-center gap-0.5 text-yellow-400">
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
