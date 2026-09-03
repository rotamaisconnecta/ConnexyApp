import { Link } from "@tanstack/react-router";
import { ChevronRight, MessageCircle, Navigation, Sparkles } from "lucide-react";
import { people } from "@/lib/mock-data";
import { useDemoPendingRequests } from "@/lib/demo/use-demo-db";

const ACTION_IMAGES = {
  go: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=700&q=85",
  eat: "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=700&q=85",
  discover:
    "https://images.unsplash.com/photo-1498307833015-e7b400441eb8?auto=format&fit=crop&w=700&q=85",
  suggestion:
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=85",
  event:
    "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?auto=format&fit=crop&w=500&q=85",
} as const;

function CardArrow() {
  return (
    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/90 text-gray-800 shadow-sm backdrop-blur-sm transition-transform group-active:translate-x-0.5">
      <ChevronRight className="h-3.5 w-3.5" strokeWidth={2.2} />
    </span>
  );
}

function ActionCard({
  label,
  image,
  icon,
}: {
  label: string;
  image: string;
  icon?: React.ReactNode;
}) {
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

function StatusBadge({ tone }: { tone: "conversation" | "event" }) {
  const conversation = tone === "conversation";

  return (
    <span
      aria-hidden
      className={`absolute -right-1 -top-1 grid h-[17px] w-[17px] place-items-center rounded-full border-2 border-white text-white shadow-sm ${
        conversation ? "bg-primary" : "bg-amber-400"
      }`}
    >
      {conversation ? (
        <MessageCircle className="h-2.5 w-2.5 fill-current" />
      ) : (
        <Sparkles className="h-2.5 w-2.5 fill-current" />
      )}
    </span>
  );
}

export function HomeActionHub() {
  const pendingRequests = useDemoPendingRequests();
  const pendingRequest = pendingRequests[0];
  const conversationPerson =
    people.find((person) => person.id === pendingRequest?.fromUserId) ??
    people.find((person) => person.id === "juliana") ??
    people[0];

  if (!conversationPerson) return null;

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
        aria-label="Ver sugestão de lugar"
        className="group relative mt-3 block h-[88px] overflow-hidden rounded-[14px] bg-gray-900 shadow-soft"
      >
        <img
          src={ACTION_IMAGES.suggestion}
          alt=""
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.03]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/35 to-black/5" />
        <div className="absolute inset-y-0 left-0 flex w-[48%] flex-col justify-center px-4 text-white">
          <p className="font-display text-[15px] font-semibold leading-[1.15] tracking-[-0.015em]">
            Um lugar,
            <br />
            novas pessoas,
            <br />
            uma boa história.
          </p>
          <span className="mt-2 inline-flex w-fit items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-[8px] font-medium backdrop-blur-md">
            Ver sugestão <ChevronRight className="h-2.5 w-2.5" />
          </span>
        </div>
      </Link>

      <h2 className="mt-4 font-display text-[15px] font-bold leading-tight tracking-[-0.015em]">
        Acontecendo agora
      </h2>

      <div className="mt-2 grid min-h-[62px] grid-cols-2 overflow-hidden rounded-[14px] border border-border/45 bg-surface shadow-soft">
        <Link
          to="/solicitacao/$id"
          params={{ id: conversationPerson.id }}
          search={{ mode: "receive" }}
          aria-label={`Ver pedido de conversa de ${conversationPerson.name}`}
          className="group flex min-w-0 items-center gap-2 border-r border-border/40 px-2 py-2 transition-colors hover:bg-primary/[0.035]"
        >
          <span className="relative shrink-0">
            <img
              src={conversationPerson.photo}
              alt=""
              className="h-9 w-9 rounded-[10px] object-cover"
            />
            <StatusBadge tone="conversation" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[7px] font-semibold leading-tight text-primary">
              Novo pedido de conversa
            </span>
            <span className="mt-1 block text-[8px] leading-[1.2] text-foreground">
              {conversationPerson.name.split(" ")[0]} quer conversar com você.
            </span>
          </span>
          <span className="flex h-6 shrink-0 items-center gap-0.5 rounded-full bg-primary/[0.07] px-2 text-[7px] font-semibold text-primary transition-colors group-hover:bg-primary/[0.12]">
            Ver <ChevronRight className="h-2.5 w-2.5" />
          </span>
        </Link>

        <Link
          to="/event/$eventId"
          params={{ eventId: "event-007" }}
          aria-label="Ver o evento Roda de Samba"
          className="group flex min-w-0 items-center gap-2 px-2 py-2 transition-colors hover:bg-amber-50/60"
        >
          <span className="relative shrink-0">
            <img src={ACTION_IMAGES.event} alt="" className="h-9 w-9 rounded-[10px] object-cover" />
            <StatusBadge tone="event" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[7px] font-semibold leading-tight text-amber-500">
              Evento próximo
            </span>
            <span className="mt-1 block text-[8px] leading-[1.2] text-foreground">
              Roda de Samba hoje à noite
            </span>
          </span>
          <span className="flex h-6 shrink-0 items-center gap-0.5 rounded-full bg-primary/[0.07] px-2 text-[7px] font-semibold text-primary transition-colors group-hover:bg-primary/[0.12]">
            Ver <ChevronRight className="h-2.5 w-2.5" />
          </span>
        </Link>
      </div>
    </section>
  );
}
