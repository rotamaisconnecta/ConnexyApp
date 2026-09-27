import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { StatusBar } from "@/components/phone-frame";
import { BackButton } from "@/components/navigation/back-button";
import { getDemoIdentity } from "@/lib/demo/demo-identity";
import {
  acceptCaronaRequest,
  cancelCaronaOffer,
  cancelCaronaRequest,
  getCaronaOffer,
  listCaronaRequestsForOffer,
  listMyCaronaRequests,
  rejectCaronaRequest,
  requestCarona,
  subscribeCarona,
} from "@/lib/carona/carona-store";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/carona/$offerId")({
  head: () => ({ meta: [{ title: "Carona Amiga — Connexy" }] }),
  component: CaronaDetailPage,
});

function CaronaDetailPage() {
  const { offerId } = Route.useParams();
  const identity = getDemoIdentity();
  const [, setTick] = useState(0);
  const [showMeetup, setShowMeetup] = useState(false);
  useEffect(() => subscribeCarona(() => setTick((value) => value + 1)), []);

  const offer = getCaronaOffer(offerId);
  const requests = offer ? listCaronaRequestsForOffer(offer.id) : [];
  const myRequest = listMyCaronaRequests(identity.id).find((item) => item.rideOfferId === offerId);

  if (!offer) {
    return (
      <div className="flex-1">
        <StatusBar />
        <header className="flex items-center gap-2 px-4 pt-1 pb-3">
          <BackButton
            fallbackTo="/carona"
            className="h-9 w-9 grid place-items-center rounded-full bg-secondary"
          />
          <h1 className="font-display font-bold">Carona</h1>
        </header>
        <p className="px-5 text-sm text-muted-foreground">Carona não encontrada.</p>
      </div>
    );
  }

  const isOwner = offer.ownerId === identity.id;
  const accepted = myRequest?.status === "accepted";
  const ownerAccepted = requests.find((item) => item.status === "accepted");
  const conversationId = myRequest?.conversationId ?? ownerAccepted?.conversationId;
  const confirmed = isOwner ? Boolean(ownerAccepted) : accepted;

  async function onAccept(requestId: string) {
    try {
      await acceptCaronaRequest(requestId, identity.id);
      toast.success("Carona confirmada.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível aceitar.");
    }
  }

  return (
    <div className="flex-1">
      <StatusBar />
      <header className="flex items-center gap-2 px-4 pt-1 pb-3">
        <BackButton
          fallbackTo="/carona"
          className="h-9 w-9 grid place-items-center rounded-full bg-secondary"
        />
        <h1 className="font-display font-bold">Carona Amiga</h1>
      </header>
      <div className="space-y-4 px-5 pb-8">
        <article className="rounded-2xl border border-border bg-surface p-4 shadow-soft">
          <p className="font-display text-lg font-bold">
            {offer.origin} → {offer.destination}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {offer.date} · {offer.time}
          </p>
          <p className="mt-2 text-sm">Encontro: {offer.meetup}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {offer.availableSeats} vagas · {offer.status}
          </p>
        </article>

        {isOwner ? (
          <section className="space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Pedidos
            </h2>
            {requests.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum pedido ainda.</p>
            )}
            {requests.map((request) => (
              <div key={request.id} className="rounded-2xl border border-border bg-surface p-3">
                <p className="text-sm font-semibold">{request.requesterId}</p>
                <p className="text-[11px] text-muted-foreground">{request.status}</p>
                {request.status === "requested" && (
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => void onAccept(request.id)}
                      className="rounded-full bg-gradient-brand px-3 py-1.5 text-[11px] font-semibold text-white"
                    >
                      Aceitar
                    </button>
                    <button
                      type="button"
                      onClick={() => rejectCaronaRequest(request.id, identity.id)}
                      className="rounded-full bg-secondary px-3 py-1.5 text-[11px] font-semibold"
                    >
                      Recusar
                    </button>
                  </div>
                )}
              </div>
            ))}
            {confirmed && (
              <ConfirmedCaronaActions
                conversationId={conversationId}
                meetup={offer.meetup}
                showMeetup={showMeetup}
                onShowMeetup={() => setShowMeetup(true)}
                cancelLabel="Cancelar carona"
                onCancel={() => cancelCaronaOffer(offer.id, identity.id)}
              />
            )}
            {!confirmed && offer.status !== "cancelled" && (
              <button
                type="button"
                onClick={() => cancelCaronaOffer(offer.id, identity.id)}
                className="text-xs font-semibold text-muted-foreground"
              >
                Cancelar carona
              </button>
            )}
          </section>
        ) : (
          <section className="space-y-3">
            {!myRequest && offer.status === "active" && (
              <button
                type="button"
                onClick={() => {
                  try {
                    requestCarona(offer.id, identity.id);
                    toast.success("Pedido enviado.");
                  } catch (error) {
                    toast.error(
                      error instanceof Error ? error.message : "Não foi possível solicitar.",
                    );
                  }
                }}
                className="flex w-full items-center justify-center rounded-full bg-gradient-brand py-3.5 text-sm font-semibold text-white"
              >
                Solicitar carona
              </button>
            )}
            {myRequest && <p className="text-sm">Pedido: {myRequest.status}</p>}
            {confirmed && (
              <ConfirmedCaronaActions
                conversationId={conversationId}
                meetup={offer.meetup}
                showMeetup={showMeetup}
                onShowMeetup={() => setShowMeetup(true)}
                cancelLabel="Cancelar"
                onCancel={() => cancelCaronaRequest(myRequest!.id, identity.id)}
              />
            )}
            {!confirmed && myRequest && myRequest.status !== "cancelled" && (
              <button
                type="button"
                onClick={() => cancelCaronaRequest(myRequest.id, identity.id)}
                className="text-xs font-semibold text-muted-foreground"
              >
                Cancelar pedido
              </button>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

function ConfirmedCaronaActions({
  conversationId,
  meetup,
  showMeetup,
  onShowMeetup,
  cancelLabel,
  onCancel,
}: {
  conversationId?: string;
  meetup: string;
  showMeetup: boolean;
  onShowMeetup: () => void;
  cancelLabel: string;
  onCancel: () => void;
}) {
  return (
    <div className="space-y-3">
      {conversationId && (
        <Link
          to="/chat/$conversationId"
          params={{ conversationId }}
          className="flex w-full items-center justify-center rounded-full bg-gradient-brand py-3 text-sm font-semibold text-white"
        >
          Conversar
        </Link>
      )}
      <button
        type="button"
        onClick={onShowMeetup}
        className="flex w-full items-center justify-center rounded-full bg-secondary py-3 text-sm font-semibold"
      >
        Ver ponto de encontro
      </button>
      {showMeetup && (
        <article className="rounded-2xl border border-border bg-surface p-4">
          <h3 className="text-sm font-bold">Ponto de encontro</h3>
          <p className="mt-1 text-sm">{meetup}</p>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Localização aproximada. GPS em tempo real fica fora desta fase.
          </p>
        </article>
      )}
      <button
        type="button"
        onClick={onCancel}
        className="text-xs font-semibold text-muted-foreground"
      >
        {cancelLabel}
      </button>
    </div>
  );
}
