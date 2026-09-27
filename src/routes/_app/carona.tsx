import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { StatusBar } from "@/components/phone-frame";
import { BackButton } from "@/components/navigation/back-button";
import { getDemoIdentity } from "@/lib/demo/demo-identity";
import {
  listDiscoverableCaronaOffers,
  listMyCaronaOffers,
  listMyCaronaRequests,
  subscribeCarona,
} from "@/lib/carona/carona-store";

export const Route = createFileRoute("/_app/carona")({
  head: () => ({ meta: [{ title: "Carona Amiga — Connexy" }] }),
  component: CaronaLayout,
});

function CaronaLayout() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  if (pathname.replace(/\/$/, "") === "/carona") return <CaronaListPage />;
  return <Outlet />;
}

function CaronaListPage() {
  const identity = getDemoIdentity();
  const [, setTick] = useState(0);
  useEffect(() => subscribeCarona(() => setTick((value) => value + 1)), []);
  const mine = listMyCaronaOffers(identity.id);
  const nearby = listDiscoverableCaronaOffers(identity.id);
  const requests = listMyCaronaRequests(identity.id);

  return (
    <div className="flex-1">
      <StatusBar />
      <header className="flex items-center gap-2 px-4 pt-1 pb-3">
        <BackButton
          fallbackTo="/home"
          className="h-9 w-9 grid place-items-center rounded-full bg-secondary"
        />
        <div className="flex-1">
          <h1 className="font-display font-bold">Carona Amiga</h1>
          <p className="text-[11px] text-muted-foreground">Vagas entre pessoas, sem dispatcher.</p>
        </div>
        <Link
          to="/carona/nova"
          className="rounded-full bg-gradient-brand px-3 py-1.5 text-[11px] font-semibold text-white"
        >
          Oferecer
        </Link>
      </header>
      <div className="space-y-5 px-5 pb-8">
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Minhas ofertas
          </h2>
          <div className="mt-2 space-y-2">
            {mine.length === 0 && (
              <p className="text-sm text-muted-foreground">Você ainda não ofereceu carona.</p>
            )}
            {mine.map((offer) => (
              <Link
                key={offer.id}
                to="/carona/$offerId"
                params={{ offerId: offer.id }}
                className="block rounded-2xl border border-border bg-surface p-4 shadow-soft"
              >
                <p className="font-display text-sm font-bold">
                  {offer.origin} → {offer.destination}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {offer.date} · {offer.time} · {offer.availableSeats} vagas · {offer.status}
                </p>
              </Link>
            ))}
          </div>
        </section>
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Disponíveis
          </h2>
          <div className="mt-2 space-y-2">
            {nearby.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhuma carona ativa no momento.</p>
            )}
            {nearby.map((offer) => (
              <Link
                key={offer.id}
                to="/carona/$offerId"
                params={{ offerId: offer.id }}
                className="block rounded-2xl border border-border bg-surface p-4 shadow-soft"
              >
                <p className="font-display text-sm font-bold">
                  {offer.origin} → {offer.destination}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {offer.date} · {offer.time} · encontro em {offer.meetup}
                </p>
              </Link>
            ))}
          </div>
        </section>
        {requests.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Meus pedidos
            </h2>
            <div className="mt-2 space-y-2">
              {requests.map((request) => (
                <Link
                  key={request.id}
                  to="/carona/$offerId"
                  params={{ offerId: request.rideOfferId }}
                  className="block rounded-2xl border border-border bg-surface p-4 text-sm shadow-soft"
                >
                  Pedido {request.status}
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
