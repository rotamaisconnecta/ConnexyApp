import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { ArrowRight, CarFront, Inbox, MapPin } from "lucide-react";
import { StatusBar } from "@/components/phone-frame";
import { BackButton } from "@/components/navigation/back-button";
import { TypeScale } from "@/theme/typography";
import { getDemoIdentity } from "@/lib/demo/demo-identity";
import {
  listMyCaronaOffers,
  listMyCaronaRequests,
  getCaronaOffer,
  subscribeCarona,
  type CaronaOffer,
  type CaronaRequest,
} from "@/lib/carona/carona-store";
import {
  caronaDateAndTimeLabel,
  caronaOfferStatusLabel,
  caronaRequestStatusLabel,
  caronaSeatsLabel,
} from "@/lib/carona/carona-format";
import { resolveCaronaPerson, caronaPersonFirstName, caronaPersonInitials } from "@/lib/carona/carona-people";

export const Route = createFileRoute("/_app/carona/minhas")({
  head: () => ({ meta: [{ title: "Minhas caronas — Connexy" }] }),
  component: MinhasCaronasPage,
});

type CaronaTab = "oferecendo" | "solicitadas" | "concluidas";

const TABS: { id: CaronaTab; label: string }[] = [
  { id: "oferecendo", label: "Oferecendo" },
  { id: "solicitadas", label: "Solicitadas" },
  { id: "concluidas", label: "Concluídas" },
];

function MinhasCaronasPage() {
  const identity = getDemoIdentity();
  const [, setTick] = useState(0);
  const [tab, setTab] = useState<CaronaTab>("oferecendo");

  useEffect(() => subscribeCarona(() => setTick((value) => value + 1)), []);

  const offers = useMemo(() => listMyCaronaOffers(identity.id), [identity.id]);
  const requests = useMemo(() => listMyCaronaRequests(identity.id), [identity.id]);

  const offering = offers.filter(
    (offer) => offer.status === "active" || offer.status === "full",
  );
  const requested = requests.filter((request) => {
    const offer = getCaronaOffer(request.rideOfferId);
    if (request.status === "cancelled" || request.status === "rejected") return false;
    return offer?.status === "active" || offer?.status === "full";
  });
  const finished = [
    ...offers.filter((offer) => offer.status === "completed" || offer.status === "cancelled"),
    ...requests.filter(
      (request) =>
        request.status === "cancelled" || request.status === "rejected",
    ),
  ];

  const items: Record<CaronaTab, ReactNode> = {
    oferecendo:
      offering.length > 0 ? (
        offering.map((offer) => <MyOfferRow key={offer.id} offer={offer} />)
      ) : (
        <EmptyCarona
          title="Você não está oferecendo carona"
          description="Quando você publicar uma vaga, ela aparece aqui."
        />
      ),
    solicitadas:
      requested.length > 0 ? (
        requested.map((request) => <MyRequestRow key={request.id} request={request} />)
      ) : (
        <EmptyCarona
          title="Você não pediu vaga"
          description="Quando você pedir uma vaga, o pedido aparece aqui."
        />
      ),
    concluidas:
      finished.length > 0 ? (
        finished.map((item) =>
          "origin" in item ? (
            <MyOfferRow key={item.id} offer={item as CaronaOffer} muted />
          ) : (
            <MyRequestRow key={item.id} request={item as CaronaRequest} muted />
          ),
        )
      ) : (
        <EmptyCarona
          title="Nada concluído ainda"
          description="Caronas finalizadas e pedidos encerrados aparecem aqui."
        />
      ),
  };

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden">
      <StatusBar />

      <div className="flex items-center gap-3 px-5 pt-1 pb-3 shrink-0">
        <BackButton
          fallbackTo="/carona"
          className="h-9 w-9 grid place-items-center rounded-full bg-secondary"
        />
        <div>
          <h1 className={`font-display font-bold ${TypeScale.screenTitle}`}>Minhas caronas</h1>
          <p className={`text-muted-foreground ${TypeScale.meta}`}>
            Suas ofertas e pedidos em um só lugar
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 px-5 pb-3 shrink-0">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            aria-pressed={tab === item.id}
            className={`rounded-full px-3 py-1.5 text-[12px] font-semibold transition ${
              tab === item.id
                ? "bg-foreground text-white"
                : "bg-secondary/70 text-muted-foreground"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: [0.22, 0.61, 0.36, 1] }}
          className="space-y-2.5"
        >
          {items[tab]}
        </motion.div>
      </div>
    </div>
  );
}

function EmptyCarona({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-3xl border border-border/70 bg-surface/60 px-5 py-8 text-center">
      <Inbox className="mx-auto h-6 w-6 text-muted-foreground/70" strokeWidth={1.8} />
      <p className="mt-3 font-display text-[15px] font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">{description}</p>
    </div>
  );
}

function MyOfferRow({ offer, muted = false }: { offer: CaronaOffer; muted?: boolean }) {
  return (
    <Link
      to="/carona/$offerId"
      params={{ offerId: offer.id }}
      className={`flex items-center gap-3 rounded-3xl border border-border px-4 py-3.5 transition active:scale-[0.99] ${
        muted ? "bg-surface/50" : "bg-surface"
      }`}
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
        <CarFront className="h-[18px] w-[18px]" strokeWidth={2.1} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-display text-[14px] font-semibold text-foreground">
          {offer.origin} → {offer.destination}
        </span>
        <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
          {caronaDateAndTimeLabel(offer.date, offer.time)} · {caronaSeatsLabel(offer.availableSeats)} ·{" "}
          {caronaOfferStatusLabel(offer.status)}
        </span>
      </span>
      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={2.1} />
    </Link>
  );
}

function MyRequestRow({
  request,
  muted = false,
}: {
  request: CaronaRequest;
  muted?: boolean;
}) {
  const offer = getCaronaOffer(request.rideOfferId);
  const person = resolveCaronaPerson(offer?.ownerId ?? "");
  const firstName = caronaPersonFirstName(person);
  const initials = person ? caronaPersonInitials(person.name) : "";

  return (
    <Link
      to="/carona/$offerId"
      params={{ offerId: request.rideOfferId }}
      className={`flex items-center gap-3 rounded-3xl border border-border px-4 py-3.5 transition active:scale-[0.99] ${
        muted ? "bg-surface/50" : "bg-surface"
      }`}
    >
      {person?.photo ? (
        <img
          src={person.photo}
          alt={`Foto de ${person.name}`}
          className="h-10 w-10 shrink-0 rounded-full object-cover"
        />
      ) : (
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 text-[12px] font-semibold text-primary">
          {initials || <MapPin className="h-4 w-4" strokeWidth={2.1} />}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate font-display text-[14px] font-semibold text-foreground">
          {firstName}
          {offer ? ` · ${offer.origin} → ${offer.destination}` : ""}
        </span>
        <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
          {caronaRequestStatusLabel(request.status)}
          {offer?.time ? ` • ${offer.date} ${offer.time}` : ""}
        </span>
      </span>
      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={2.1} />
    </Link>
  );
}