import { useEffect, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  Building2,
  ChevronRight,
  Clock3,
  MessageCircle,
  Navigation,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import { people } from "@/lib/mock-data";
import { useDemoPendingRequests } from "@/lib/demo/use-demo-db";

const ACTION_IMAGES = {
  go: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=700&q=85",
  eat: "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=700&q=85",
  discover:
    "https://images.unsplash.com/photo-1498307833015-e7b400441eb8?auto=format&fit=crop&w=700&q=85",
  morning:
    "https://images.unsplash.com/photo-1445116572660-236099ec97a0?auto=format&fit=crop&w=1200&q=85",
  afternoon:
    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=85",
  evening:
    "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=1200&q=85",
  lateNight:
    "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=85",
  event:
    "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?auto=format&fit=crop&w=700&q=85",
  business:
    "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=700&q=85",
  marketplace:
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=700&q=85",
} as const;

type TimeSuggestion = {
  period: string;
  text: [string, string, string];
  image: string;
};

function suggestionForHour(hour: number): TimeSuggestion {
  if (hour >= 6 && hour < 12) {
    return {
      period: "Sugestão da manhã",
      text: ["Um café,", "novas pessoas,", "um ótimo começo."],
      image: ACTION_IMAGES.morning,
    };
  }
  if (hour >= 12 && hour < 18) {
    return {
      period: "Sugestão da tarde",
      text: ["Um almoço,", "novos sabores,", "uma boa história."],
      image: ACTION_IMAGES.afternoon,
    };
  }
  if (hour >= 18) {
    return {
      period: "Sugestão da noite",
      text: ["Um restaurante,", "música e encontros,", "uma noite especial."],
      image: ACTION_IMAGES.evening,
    };
  }
  return {
    period: "Sugestão da madrugada",
    text: ["Uma experiência,", "novas histórias,", "a cidade acordada."],
    image: ACTION_IMAGES.lateNight,
  };
}

function CardArrow() {
  return (
    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/90 text-gray-800 shadow-sm backdrop-blur-sm transition-transform group-active:translate-x-0.5">
      <ChevronRight className="h-3.5 w-3.5" strokeWidth={2.2} />
    </span>
  );
}

function ActionCard({ label, image, icon }: { label: string; image: string; icon?: ReactNode }) {
  return (
    <div className="group relative h-[104px] min-w-0 overflow-hidden rounded-[14px] bg-gray-200 shadow-soft">
      <img
        src={image}
        alt=""
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-black/5" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between gap-1.5 p-2 text-white">
        <span className="flex min-w-0 items-center gap-1.5 text-[15px] font-medium leading-none">
          <span className="truncate">{label}</span>
          {icon}
        </span>
        <CardArrow />
      </div>
    </div>
  );
}

function StatusBadge({ children, tone }: { children: ReactNode; tone: string }) {
  return (
    <span
      aria-hidden
      className={`absolute -right-1 -top-1 grid h-[20px] w-[20px] place-items-center rounded-full border-2 border-white text-white shadow-sm ${tone}`}
    >
      {children}
    </span>
  );
}

function HappeningCard({
  image,
  badge,
  eyebrow,
  title,
  description,
  tone,
}: {
  image: string;
  badge: ReactNode;
  eyebrow: string;
  title: string;
  description: string;
  tone: "primary" | "amber";
}) {
  return (
    <div className="group flex h-[108px] items-center gap-3 rounded-[18px] border border-border/50 bg-surface p-3 shadow-soft transition-colors hover:bg-accent/35">
      <span className="relative shrink-0">
        <img src={image} alt="" className="h-[68px] w-[68px] rounded-[15px] object-cover" />
        <StatusBadge tone={tone === "primary" ? "bg-primary" : "bg-amber-400"}>{badge}</StatusBadge>
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={`block text-[10px] font-bold leading-tight ${tone === "primary" ? "text-primary" : "text-amber-600"}`}
        >
          {eyebrow}
        </span>
        <span className="mt-1 block truncate text-[13px] font-bold text-foreground">{title}</span>
        <span className="mt-1 line-clamp-2 block text-[10px] leading-[1.35] text-muted-foreground">
          {description}
        </span>
      </span>
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/[0.08] text-primary transition group-active:translate-x-0.5">
        <ChevronRight className="h-4 w-4" />
      </span>
    </div>
  );
}

export function HomeActionHub() {
  const pendingRequests = useDemoPendingRequests();
  const pendingRequest = pendingRequests[0];
  const conversationPerson =
    people.find((person) => person.id === pendingRequest?.fromUserId) ??
    people.find((person) => person.id === "juliana") ??
    people[0];
  const friendWithPost = people.find((person) => person.id === "beatriz") ?? people[0];
  const [hour, setHour] = useState(() => new Date().getHours());
  const [localActivity, setLocalActivity] = useState(0);

  useEffect(() => {
    const updateHour = () => setHour(new Date().getHours());
    const timer = window.setInterval(updateHour, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setLocalActivity((current) => (current + 1) % 3), 8_000);
    return () => window.clearInterval(timer);
  }, []);

  if (!conversationPerson || !friendWithPost) return null;

  const suggestion = suggestionForHour(hour);
  const personalCard = pendingRequest ? (
    <Link
      to="/solicitacao/$id"
      params={{ id: conversationPerson.id }}
      search={{ mode: "receive" }}
      aria-label={`Ver pedido de conversa de ${conversationPerson.name}`}
      className="w-[88%] shrink-0 snap-start"
    >
      <HappeningCard
        image={conversationPerson.photo}
        badge={<MessageCircle className="h-3 w-3 fill-current" />}
        eyebrow="Novo pedido de conversa"
        title={conversationPerson.name}
        description={pendingRequest.message || "Quer conversar com você."}
        tone="primary"
      />
    </Link>
  ) : (
    <Link
      to="/perfil/$id"
      params={{ id: friendWithPost.id }}
      aria-label={`Ver nova publicação de ${friendWithPost.name}`}
      className="w-[88%] shrink-0 snap-start"
    >
      <HappeningCard
        image={friendWithPost.moments?.[0]?.photo ?? friendWithPost.photo}
        badge={<Sparkles className="h-3 w-3 fill-current" />}
        eyebrow="Nova publicação de uma conexão"
        title={friendWithPost.name}
        description={friendWithPost.moments?.[0]?.text ?? "Compartilhou um novo momento."}
        tone="primary"
      />
    </Link>
  );

  return (
    <section className="mt-5 px-5" aria-labelledby="home-actions-title">
      <h2
        id="home-actions-title"
        className="font-display text-[15px] font-bold leading-tight tracking-[-0.015em]"
      >
        O que você quer fazer?
      </h2>

      <div className="mt-2 grid grid-cols-3 gap-2">
        <Link to="/destino" aria-label="Ir para um destino" className="min-w-0">
          <ActionCard
            label="Ir"
            image={ACTION_IMAGES.go}
            icon={<Navigation className="h-3.5 w-3.5 -rotate-12" />}
          />
        </Link>
        <Link to="/locais" aria-label="Encontrar lugares para comer" className="min-w-0">
          <ActionCard label="Comer" image={ACTION_IMAGES.eat} />
        </Link>
        <Link to="/recommendations" aria-label="Descobrir novas experiências" className="min-w-0">
          <ActionCard label="Descobrir" image={ACTION_IMAGES.discover} />
        </Link>
      </div>

      <Link
        to="/recommendations"
        aria-label={`Ver ${suggestion.period.toLocaleLowerCase("pt-BR")}`}
        className="group relative mt-3 block h-[112px] overflow-hidden rounded-[16px] bg-gray-900 shadow-soft"
      >
        <img
          src={suggestion.image}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center transition-all duration-700 group-hover:scale-[1.03]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/40 to-black/5" />
        <div className="absolute inset-y-0 left-0 flex w-[68%] flex-col justify-center px-4 text-white">
          <span className="mb-1.5 flex items-center gap-1 text-[8px] font-semibold uppercase tracking-[0.12em] text-white/75">
            <Clock3 className="h-2.5 w-2.5" /> {suggestion.period}
          </span>
          <p className="font-display text-[15px] font-semibold leading-[1.15] tracking-[-0.015em]">
            {suggestion.text.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </p>
          <span className="mt-2 inline-flex w-fit items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-[8px] font-medium backdrop-blur-md">
            Ver sugestão <ChevronRight className="h-2.5 w-2.5" />
          </span>
        </div>
      </Link>

      <div className="mt-5 flex items-end justify-between">
        <div>
          <h2 className="font-display text-[17px] font-bold leading-tight tracking-[-0.015em]">
            Acontecendo agora
          </h2>
          <p className="mt-0.5 text-[10px] text-muted-foreground">
            Atualizações pessoais e novidades da região
          </p>
        </div>
        <span className="text-[9px] text-muted-foreground">Deslize para ver</span>
      </div>

      <div className="-mx-5 mt-2 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 no-scrollbar">
        {personalCard}

        {localActivity === 0 && (
          <Link
            to="/event/$eventId"
            params={{ eventId: "event-007" }}
            aria-label="Ver o evento Roda de Samba"
            className="w-[88%] shrink-0 snap-start"
          >
            <HappeningCard
              image={ACTION_IMAGES.event}
              badge={<Sparkles className="h-3 w-3 fill-current" />}
              eyebrow="Evento próximo"
              title="Roda de Samba"
              description="Hoje à noite, perto de você."
              tone="amber"
            />
          </Link>
        )}

        {localActivity === 1 && (
          <Link
            to="/local/$id"
            params={{ id: "cafe-central" }}
            aria-label="Ver novo negócio próximo"
            className="w-[88%] shrink-0 snap-start"
          >
            <HappeningCard
              image={ACTION_IMAGES.business}
              badge={<Building2 className="h-3 w-3 fill-current" />}
              eyebrow="Novo negócio na região"
              title="Café Central"
              description="Um novo espaço abriu perto de você."
              tone="amber"
            />
          </Link>
        )}

        {localActivity === 2 && (
          <Link
            to="/marketplace"
            aria-label="Ver item à venda próximo"
            className="w-[88%] shrink-0 snap-start"
          >
            <HappeningCard
              image={ACTION_IMAGES.marketplace}
              badge={<ShoppingBag className="h-3 w-3 fill-current" />}
              eyebrow="Item à venda por perto"
              title="Relógio em ótimo estado"
              description="Oferta publicada recentemente na sua região."
              tone="amber"
            />
          </Link>
        )}
      </div>
    </section>
  );
}
