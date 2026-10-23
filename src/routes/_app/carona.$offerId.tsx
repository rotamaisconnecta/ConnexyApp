import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Check, MapPin, MessageCircle, Users } from "lucide-react";
import { toast } from "sonner";
import { StatusBar } from "@/components/phone-frame";
import { BackButton } from "@/components/navigation/back-button";
import { TypeScale } from "@/theme/typography";
import { getDemoIdentity } from "@/lib/demo/demo-identity";
import {
  acceptCaronaRequest,
  cancelCaronaOffer,
  cancelCaronaRequest,
  getActiveCaronaRequest,
  getCaronaOffer,
  listCaronaRequestsForOffer,
  rejectCaronaRequest,
  requestCarona,
  subscribeCarona,
  type CaronaRequest,
} from "@/lib/carona/carona-store";
import {
  caronaDateAndTimeLabel,
  caronaOfferStatusLabel,
  caronaRequestStatusLabel,
  caronaSeatsLabel,
} from "@/lib/carona/carona-format";
import {
  caronaPersonFirstName,
  caronaPersonInitials,
  resolveCaronaPerson,
} from "@/lib/carona/carona-people";

export const Route = createFileRoute("/_app/carona/$offerId")({
  head: () => ({ meta: [{ title: "Carona Amiga — Connexy" }] }),
  component: CaronaDetailPage,
});

function CaronaDetailPage() {
  const { offerId } = Route.useParams();
  const identity = getDemoIdentity();
  const [, setTick] = useState(0);
  const [message, setMessage] = useState("");
  const [messageOpen, setMessageOpen] = useState(false);

  useEffect(() => subscribeCarona(() => setTick((value) => value + 1)), []);

  const offer = getCaronaOffer(offerId);

  if (!offer) {
    return (
      <div className="flex-1 flex flex-col h-full">
        <StatusBar />
        <div className="flex items-center gap-3 px-5 pt-1 pb-3">
          <BackButton
            fallbackTo="/carona"
            className="h-9 w-9 grid place-items-center rounded-full bg-secondary"
          />
          <h1 className={`font-display font-bold ${TypeScale.screenTitle}`}>Carona Amiga</h1>
        </div>
        <p className="px-5 text-sm text-muted-foreground">Esta carona não existe mais.</p>
        <Link
          to="/carona/encontrar"
          className="mx-5 mt-4 rounded-full bg-gradient-brand py-3 text-center text-sm font-semibold text-white"
        >
          Encontrar carona
        </Link>
      </div>
    );
  }

  const isOwner = offer.ownerId === identity.id;
  const requests = isOwner ? listCaronaRequestsForOffer(offer.id) : [];
  const myRequest = getActiveCaronaRequest(offer.id, identity.id);
  const confirmedRequest = myRequest ?? requests.find((item) => item.status === "accepted");
  const conversationId = confirmedRequest?.conversationId;
  const confirmed = isOwner
    ? requests.some((item) => item.status === "accepted")
    : myRequest?.status === "accepted";
  const canRequest = !isOwner && offer.status === "active" && offer.availableSeats > 0;

  function sendRequest() {
    try {
      requestCarona(offer!.id, identity.id, { message, seats: 1 });
      setMessage("");
      setMessageOpen(false);
      toast.success("Pedido enviado");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível enviar o pedido.");
    }
  }

  async function onAccept(requestId: string) {
    try {
      await acceptCaronaRequest(requestId, identity.id);
      toast.success("Carona confirmada");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível aceitar.");
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden">
      <StatusBar />

      <div className="flex items-center gap-3 px-5 pt-1 pb-2 shrink-0">
        <BackButton
          fallbackTo={isOwner ? "/carona/minhas" : "/carona/encontradas"}
          className="h-9 w-9 grid place-items-center rounded-full bg-secondary"
        />
        <h1 className={`font-display font-bold ${TypeScale.screenTitle}`}>Carona Amiga</h1>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.26, ease: [0.22, 0.61, 0.36, 1] }}
          className="flex items-center gap-3.5"
        >
          <OwnerIdentity ownerId={offer.ownerId} />
          <div className="min-w-0 flex-1">
            <p className="font-display text-[20px] font-bold leading-tight tracking-tight text-foreground">
              {caronaPersonFirstName(resolveCaronaPerson(offer.ownerId))}
            </p>
            {resolveCaronaPerson(offer.ownerId)?.headline ? (
              <p className="mt-0.5 truncate text-[12px] text-muted-foreground">
                {resolveCaronaPerson(offer.ownerId)?.headline}
              </p>
            ) : null}
          </div>
        </motion.section>

        <section className="mt-5 rounded-[26px] border border-border bg-surface px-4 py-4">
          <RouteLine label="De" value={offer.origin} />
          <div className="my-2.5 ml-[7px] h-5 w-px bg-border" aria-hidden />
          <RouteLine label="Para" value={offer.destination} />
          <div className="my-3.5 h-px bg-border" aria-hidden />
          <div className="flex items-center justify-between gap-3">
            <span className="text-[13px] font-medium text-foreground">
              {caronaDateAndTimeLabel(offer.date, offer.time)}
            </span>
            <span className="shrink-0 text-[13px] font-semibold text-primary">
              {caronaSeatsLabel(offer.availableSeats)}
            </span>
          </div>
          <p className="mt-2 flex items-start gap-1.5 text-[11px] leading-relaxed text-muted-foreground">
            <MapPin className="mt-0.5 h-3 w-3 shrink-0" strokeWidth={2.2} />
            Encontro: {offer.meetup}
          </p>
        </section>

        {confirmed ? (
          <ConfirmedCarona
            conversationId={conversationId}
            onCancel={
              isOwner
                ? () => {
                    cancelCaronaOffer(offer.id, identity.id);
                    toast.success("Carona cancelada.");
                  }
                : myRequest
                  ? () => {
                      cancelCaronaRequest(myRequest.id, identity.id);
                      toast.success("Pedido cancelado.");
                    }
                  : undefined
            }
          />
        ) : null}

        {isOwner ? (
          <OwnerRequests
            requests={requests}
            onAccept={onAccept}
            onReject={(requestId) => {
              rejectCaronaRequest(requestId, identity.id);
              toast.success("Pedido recusado.");
            }}
          />
        ) : (
          <PassengerActions
            canRequest={canRequest}
            myRequest={myRequest}
            messageOpen={messageOpen}
            message={message}
            onMessage={setMessage}
            onToggleMessage={() => setMessageOpen((value) => !value)}
            onSend={sendRequest}
            onCancel={
              myRequest
                ? () => {
                    cancelCaronaRequest(myRequest.id, identity.id);
                    toast.success("Pedido cancelado.");
                  }
                : undefined
            }
          />
        )}

        {!isOwner && !canRequest && offer.status !== "active" && (
          <p className="mt-4 text-center text-[12px] text-muted-foreground">
            {caronaOfferStatusLabel(offer.status)} — esta carona não recebe novos pedidos.
          </p>
        )}
      </div>
    </div>
  );
}

function OwnerIdentity({ ownerId }: { ownerId: string }) {
  const person = resolveCaronaPerson(ownerId);
  if (person?.photo) {
    return (
      <img
        src={person.photo}
        alt={`Foto de ${person.name}`}
        className="h-14 w-14 shrink-0 rounded-full object-cover"
      />
    );
  }
  return (
    <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-primary/12 font-semibold text-primary">
      {(person ? caronaPersonInitials(person.name) : "") || (
        <Users className="h-6 w-6" strokeWidth={2} />
      )}
    </span>
  );
}

function RouteLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary/60" aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <span className="mt-0.5 block truncate font-display text-[15px] font-semibold text-foreground">
          {value}
        </span>
      </span>
    </div>
  );
}

function PassengerActions({
  canRequest,
  myRequest,
  messageOpen,
  message,
  onMessage,
  onToggleMessage,
  onSend,
  onCancel,
}: {
  canRequest: boolean;
  myRequest: CaronaRequest | null;
  messageOpen: boolean;
  message: string;
  onMessage: (value: string) => void;
  onToggleMessage: () => void;
  onSend: () => void;
  onCancel?: () => void;
}) {
  if (myRequest) {
    return (
      <section className="mt-5 rounded-[26px] border border-border bg-surface px-4 py-4">
        <p className="flex items-center gap-2 text-[13px] font-semibold text-foreground">
          <Check className="h-4 w-4 text-primary" strokeWidth={2.4} />
          {myRequest.status === "accepted" ? "Carona confirmada" : null}
          {myRequest.status === "requested" ? "Pedido aguardando resposta" : null}
          {myRequest.status === "rejected" ? "Pedido recusado" : null}
          {myRequest.status === "cancelled" ? "Pedido cancelado" : null}
        </p>
        <p className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground">
          {myRequest.status === "accepted"
            ? "Carona confirmada. Combine o ponto de encontro pela conversa."
            : "Quem oferece a carona foi avisado. Você recebe a resposta aqui."}
        </p>
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="mt-3 text-[12px] font-semibold text-muted-foreground"
          >
            Cancelar pedido
          </button>
        ) : null}
      </section>
    );
  }

  if (!canRequest) return null;

  return (
    <section className="mt-5 space-y-3">
      <button
        type="button"
        onClick={onToggleMessage}
        className="flex w-full items-center justify-between gap-2 rounded-2xl border border-border bg-surface px-4 py-3 text-left"
      >
        <span className="min-w-0 flex-1">
          <span className="block text-[13px] font-semibold text-foreground">
            Mensagem para quem oferece a carona
          </span>
          <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
            Opcional — "Oi! Também vou para esse lugar."
          </span>
        </span>
        <ArrowRight
          className="h-4 w-4 shrink-0 text-muted-foreground"
          strokeWidth={2.2}
        />
      </button>

      {messageOpen ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="rounded-[26px] border border-border bg-surface px-4 py-4"
        >
          <textarea
            value={message}
            onChange={(event) => onMessage(event.target.value)}
            rows={3}
            maxLength={240}
            placeholder="Escreva uma mensagem curta"
            className="w-full resize-none rounded-2xl bg-secondary/50 px-3.5 py-3 text-[13px] text-foreground outline-none placeholder:text-muted-foreground/70"
          />
        </motion.div>
      ) : null}

      <button
        type="button"
        onClick={onSend}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-brand py-3.5 text-[15px] font-semibold text-white shadow-[0_12px_28px_rgba(109,40,217,0.26)] transition active:scale-[0.98]"
      >
        Pedir vaga
      </button>
    </section>
  );
}

function OwnerRequests({
  requests,
  onAccept,
  onReject,
}: {
  requests: CaronaRequest[];
  onAccept: (requestId: string) => Promise<void>;
  onReject: (requestId: string) => void;
}) {
  const viewerId = getDemoIdentity().id;
  if (requests.length === 0) {
    return (
      <section className="mt-5 rounded-[26px] border border-border/70 bg-surface/60 px-4 py-5 text-center">
        <p className="text-[13px] font-semibold text-foreground">Nenhum pedido ainda</p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          Quem procurar sua carona aparece aqui.
        </p>
      </section>
    );
  }

  return (
    <section className="mt-5 space-y-2.5">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        Passageiros
      </p>
      {requests.map((request) => {
        const person = resolveCaronaPerson(request.requesterId);
        const name = caronaPersonFirstName(person);
        const pending = request.status === "requested";
        return (
          <article
            key={request.id}
            className="rounded-[26px] border border-border bg-surface px-4 py-3.5"
          >
            <div className="flex items-center gap-3">
              {person?.photo ? (
                <img
                  src={person.photo}
                  alt={`Foto de ${person.name}`}
                  className="h-10 w-10 shrink-0 rounded-full object-cover"
                />
              ) : (
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/12 text-[12px] font-semibold text-primary">
                  {(person ? caronaPersonInitials(person.name) : "") || request.requesterId.charAt(0)}
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate font-display text-[15px] font-semibold text-foreground">
                  {name}
                  {request.requesterId === viewerId ? " (você)" : ""}
                </span>
                <span className="mt-0.5 block text-[11px] text-muted-foreground">
                  {caronaSeatsLabel(request.seats ?? 1)} ·{" "}
                  {caronaRequestStatusLabel(request.status)}
                </span>
              </span>
            </div>

            {request.message ? (
              <p className="mt-2.5 rounded-2xl bg-secondary/50 px-3.5 py-2.5 text-[12px] leading-relaxed text-foreground">
                “{request.message}”
              </p>
            ) : null}

            {pending ? (
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => void onAccept(request.id)}
                  className="flex-1 rounded-full bg-gradient-brand py-2.5 text-[13px] font-semibold text-white transition active:scale-[0.98]"
                >
                  Aceitar
                </button>
                <button
                  type="button"
                  onClick={() => onReject(request.id)}
                  className="flex-1 rounded-full bg-secondary py-2.5 text-[13px] font-semibold text-foreground transition active:scale-[0.98]"
                >
                  Recusar
                </button>
              </div>
            ) : null}
          </article>
        );
      })}
    </section>
  );
}

function ConfirmedCarona({
  conversationId,
  onCancel,
}: {
  conversationId?: string;
  onCancel?: () => void;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24 }}
      className="mt-5 rounded-[26px] border border-primary/25 bg-primary/8 px-4 py-4"
    >
      <p className="flex items-center gap-2 font-display text-[16px] font-bold text-foreground">
        <Check className="h-4 w-4 text-primary" strokeWidth={2.6} />
        Carona confirmada
      </p>
      <p className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground">
        Combinem o ponto de encontro pela conversa. O endereço de cada um continua privado.
      </p>
      {conversationId ? (
        <Link
          to="/chat/$conversationId"
          params={{ conversationId }}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-brand py-3 text-[14px] font-semibold text-white transition active:scale-[0.98]"
        >
          <MessageCircle className="h-4 w-4" strokeWidth={2.2} />
          Conversar
        </Link>
      ) : null}
      {onCancel ? (
        <button
          type="button"
          onClick={onCancel}
          className="mt-3 w-full text-[12px] font-semibold text-muted-foreground"
        >
          Cancelar
        </button>
      ) : null}
    </motion.section>
  );
}