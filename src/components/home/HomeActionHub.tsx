import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  Building2,
  ChevronRight,
  Clock3,
  MessageCircle,
  Navigation,
  Plus,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import { people } from "@/lib/mock-data";
import { useDemoPendingRequests } from "@/lib/demo/use-demo-db";
import { useDemoPosts } from "@/lib/demo/demo-posts";
import { useAuth } from "@/hooks/use-auth";
import { TypeScale } from "@/theme/typography";
import { HomeSectionHeading } from "@/components/home/home-section-heading";
import {
  listHappeningNowCards,
  type HappeningNowCard,
} from "@/lib/home/happening-now";

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
    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white/90 text-gray-800 shadow-sm backdrop-blur-sm transition-transform group-active:translate-x-0.5">
      <ChevronRight className="h-3 w-3" strokeWidth={2.4} />
    </span>
  );
}

function ActionCard({ label, image, icon }: { label: string; image: string; icon?: ReactNode }) {
  return (
    <div className="group relative h-[112px] min-w-0 overflow-hidden rounded-[14px] bg-gray-200 shadow-soft">
      <img
        src={image}
        alt=""
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-black/5" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 p-1.5 text-white">
        <span className="flex min-w-0 items-center gap-1 text-[13px] font-medium leading-tight">
          <span className="min-w-0">{label}</span>
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
    <div className="group flex min-h-[124px] items-center gap-3 rounded-[18px] border border-border/50 bg-surface p-3.5 shadow-soft transition-colors hover:bg-accent/35">
      <span className="relative shrink-0">
        <img src={image} alt="" className="h-16 w-16 rounded-[16px] object-cover" />
        <StatusBadge tone={tone === "primary" ? "bg-primary" : "bg-amber-400"}>{badge}</StatusBadge>
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={`block text-[12px] font-semibold leading-tight ${tone === "primary" ? "text-primary" : "text-amber-600"}`}
        >
          {eyebrow}
        </span>
        <span className="mt-1 line-clamp-2 block text-[16px] font-semibold leading-[1.3] text-foreground">
          {title}
        </span>
        <span className="mt-1 line-clamp-2 block text-[13px] leading-[1.4] text-muted-foreground">
          {description}
        </span>
      </span>
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/[0.08] text-primary transition group-active:translate-x-0.5">
        <ChevronRight className="h-4 w-4" />
      </span>
    </div>
  );
}

function happeningBadge(kind: HappeningNowCard["kind"]) {
  if (kind === "request") return <MessageCircle className="h-3 w-3 fill-current" />;
  if (kind === "offer") return <ShoppingBag className="h-3 w-3 fill-current" />;
  if (kind === "business" || kind === "place") return <Building2 className="h-3 w-3 fill-current" />;
  return <Sparkles className="h-3 w-3 fill-current" />;
}

function HappeningLink({ card }: { card: HappeningNowCard }) {
  const className = "w-[86%] min-w-[86%] shrink-0 snap-start";
  const label = `Ver ${card.title}`;
  const body = (
    <HappeningCard
      image={card.image}
      badge={happeningBadge(card.kind)}
      eyebrow={card.eyebrow}
      title={card.title}
      description={card.description}
      tone={card.tone}
    />
  );
  const target = card.target;
  if (target.to === "/solicitacao/$id") {
    return (
      <Link
        to={target.to}
        params={target.params}
        search={target.search}
        aria-label={label}
        className={className}
      >
        {body}
      </Link>
    );
  }
  return (
    <Link to={target.to} params={target.params} aria-label={label} className={className}>
      {body}
    </Link>
  );
}

export function HomeActionHub() {
  const { user } = useAuth();
  const pendingRequests = useDemoPendingRequests(user?.id);
  const pendingRequest = pendingRequests[0];
  const posts = useDemoPosts();
  const [hour, setHour] = useState(() => new Date().getHours());
  const [nowTick, setNowTick] = useState(() => Date.now());

  useEffect(() => {
    const updateHour = () => {
      const current = new Date();
      setHour(current.getHours());
      setNowTick(current.getTime());
    };
    const timer = window.setInterval(updateHour, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const happening = useMemo(
    () =>
      listHappeningNowCards({
        now: new Date(nowTick),
        pendingRequest: pendingRequest
          ? { fromUserId: pendingRequest.fromUserId, message: pendingRequest.message }
          : null,
        posts,
        people,
      }),
    [nowTick, pendingRequest, posts],
  );

  const suggestion = suggestionForHour(hour);

  return (
    <section className="mt-5 px-5" aria-labelledby="home-actions-title">
      <h2
        id="home-actions-title"
        className={`font-display font-semibold ${TypeScale.subsectionTitle}`}
      >
        O que você quer fazer?
      </h2>

      <div className="mt-2 grid grid-cols-[repeat(auto-fit,minmax(104px,1fr))] gap-2">
        <Link to="/ride/request" aria-label="Ir para um destino" className="min-w-0">
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
        className="group relative mt-4 block h-[132px] overflow-hidden rounded-[20px] bg-gray-900 shadow-soft"
      >
        <img
          src={suggestion.image}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center transition-all duration-700 group-hover:scale-[1.03]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/40 to-black/5" />
        <div className="absolute inset-y-0 left-0 flex w-[68%] flex-col justify-center px-4 text-white">
          <span className="mb-1.5 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/75">
            <Clock3 className="h-3 w-3" /> {suggestion.period}
          </span>
          <p className="font-display text-[19px] font-semibold leading-[1.2] tracking-[-0.015em]">
            {suggestion.text.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </p>
          <span className="mt-2 inline-flex w-fit items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-medium backdrop-blur-md">
            Ver sugestão <ChevronRight className="h-3 w-3" />
          </span>
        </div>
      </Link>

      <div className="mt-5">
        <HomeSectionHeading
          title="Acontecendo agora"
          subtitle="Atualizações pessoais e novidades da região"
        />
      </div>

      <div className="-mx-5 mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 no-scrollbar">
        {happening.map((card) => (
          <HappeningLink key={card.id} card={card} />
        ))}

        <Link
          to="/reels"
          aria-label="Ver mais atualizações"
          className="w-[86%] min-w-[86%] shrink-0 snap-start"
        >
          <div className="group flex min-h-[124px] items-center gap-3 rounded-[18px] border border-dashed border-primary/35 bg-primary/[0.06] p-3.5 shadow-soft transition-colors hover:bg-primary/[0.1]">
            <span className="grid h-16 w-16 shrink-0 place-items-center rounded-[16px] bg-primary/10 text-primary">
              <Plus className="h-7 w-7" strokeWidth={2.2} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[12px] font-semibold leading-tight text-primary">
                Agora
              </span>
              <span className="mt-1 line-clamp-2 block text-[16px] font-semibold leading-[1.3] text-foreground">
                Ver mais atualizações
              </span>
              <span className="mt-1 line-clamp-2 block text-[13px] leading-[1.4] text-muted-foreground">
                Abra o Agora para acompanhar o que está acontecendo.
              </span>
            </span>
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/[0.08] text-primary transition group-active:translate-x-0.5">
              <ChevronRight className="h-4 w-4" />
            </span>
          </div>
        </Link>
      </div>
    </section>
  );
}
