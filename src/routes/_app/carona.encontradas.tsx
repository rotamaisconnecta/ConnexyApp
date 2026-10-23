import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, CalendarX2, Users } from "lucide-react";
import { StatusBar } from "@/components/phone-frame";
import { BackButton } from "@/components/navigation/back-button";
import { TypeScale } from "@/theme/typography";
import { getDemoIdentity } from "@/lib/demo/demo-identity";
import { searchCaronaOffers, subscribeCarona, type CaronaOffer } from "@/lib/carona/carona-store";
import { caronaSearchSchema, type CaronaSearch } from "@/lib/carona/carona-search-params";
import { caronaDateAndTimeLabel, caronaDateLabel, caronaSeatsLabel } from "@/lib/carona/carona-format";
import {
  caronaPersonFirstName,
  caronaPersonInitials,
  resolveCaronaPerson,
} from "@/lib/carona/carona-people";

export const Route = createFileRoute("/_app/carona/encontradas")({
  validateSearch: caronaSearchSchema,
  head: () => ({ meta: [{ title: "Caronas encontradas — Connexy" }] }),
  component: CaronasEncontradasPage,
});

function CaronasEncontradasPage() {
  const search = Route.useSearch();
  const identity = getDemoIdentity();
  const [, setTick] = useState(0);

  useEffect(() => subscribeCarona(() => setTick((value) => value + 1)), []);

  // setTick força o re-render quando o store emite; a busca é sempre lida do store.
  const offers = searchCaronaOffers(
    {
      origin: search.origin,
      destination: search.destination,
      date: search.date,
      time: search.time,
      seats: search.seats,
    },
    identity.id,
  );

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden">
      <StatusBar />

      <div className="flex items-center gap-3 px-5 pt-1 pb-2 shrink-0">
        <BackButton
          fallbackTo="/carona/encontrar"
          className="h-9 w-9 grid place-items-center rounded-full bg-secondary"
        />
        <h1 className={`font-display font-bold ${TypeScale.screenTitle}`}>
          Caronas encontradas
        </h1>
      </div>

      <SearchSummary search={search} />

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {offers.length > 0 ? (
          <div className="space-y-2.5">
            {offers.map((offer, index) => (
              <CaronaResultRow key={offer.id} offer={offer} index={index} />
            ))}
          </div>
        ) : (
          <EmptyResults search={search} />
        )}
      </div>
    </div>
  );
}

function SearchSummary({ search }: { search: CaronaSearch }) {
  const when = search.date ? caronaDateLabel(search.date) : "Qualquer dia";
  const time = search.time ? ` • ${search.time}` : "";
  return (
    <div className="shrink-0 px-5 pb-3">
      <div className="rounded-3xl border border-border/70 bg-surface/70 px-4 py-3">
        <p className="truncate font-display text-[14px] font-semibold text-foreground">
          {search.destination || "Qualquer destino"}
        </p>
        <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
          {[search.origin, `${when}${time}`].filter(Boolean).join(" · ")}
        </p>
      </div>
    </div>
  );
}

function CaronaResultRow({ offer, index }: { offer: CaronaOffer; index: number }) {
  const person = resolveCaronaPerson(offer.ownerId);
  const firstName = caronaPersonFirstName(person);
  const initials = person ? caronaPersonInitials(person.name) : "";
  const seats = caronaSeatsLabel(offer.availableSeats);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, delay: Math.min(index, 5) * 0.04, ease: [0.22, 0.61, 0.36, 1] }}
    >
      <Link
        to="/carona/$offerId"
        params={{ offerId: offer.id }}
        className="block rounded-[26px] border border-border bg-surface px-4 py-4 transition active:scale-[0.99]"
      >
        <div className="flex items-center gap-3">
          {person?.photo ? (
            <img
              src={person.photo}
              alt={`Foto de ${person.name}`}
              className="h-12 w-12 shrink-0 rounded-full object-cover"
            />
          ) : (
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary/12 font-semibold text-primary">
              {initials || <Users className="h-5 w-5" strokeWidth={2} />}
            </span>
          )}
          <span className="min-w-0 flex-1">
            <span className="block truncate font-display text-[16px] font-bold tracking-tight text-foreground">
              {firstName}
            </span>
            {person?.headline ? (
              <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
                {person.headline}
              </span>
            ) : null}
          </span>
        </div>

        <div className="mt-3.5 flex items-center gap-2 text-[13px] font-medium text-foreground">
          <span className="min-w-0 truncate">{offer.origin}</span>
          <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" strokeWidth={2.2} />
          <span className="min-w-0 truncate">{offer.destination}</span>
        </div>

        <p className="mt-1.5 text-[12px] text-muted-foreground">
          {caronaDateAndTimeLabel(offer.date, offer.time)} • {seats}
        </p>

        <span className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-semibold text-primary">
          Ver carona
          <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.4} />
        </span>
      </Link>
    </motion.div>
  );
}

function EmptyResults({ search }: { search: CaronaSearch }) {
  return (
    <div className="rounded-[26px] border border-border/70 bg-surface/60 px-5 py-10 text-center">
      <CalendarX2 className="mx-auto h-7 w-7 text-muted-foreground/70" strokeWidth={1.7} />
      <p className="mt-3.5 font-display text-[17px] font-bold text-foreground">
        Nenhuma carona encontrada
      </p>
      <p className="mx-auto mt-1.5 max-w-[30ch] text-[12px] leading-relaxed text-muted-foreground">
        Não encontramos uma carona compatível com esses critérios.
        {search.destination ? " Tente outro destino ou outra data." : ""}
      </p>
      <Link
        to="/carona/encontrar"
        search={{ ...search, origin: undefined, destination: undefined, time: undefined }}
        className="mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-brand px-5 py-3 text-[14px] font-semibold text-white transition active:scale-[0.98]"
      >
        Alterar busca
      </Link>
      <Link
        to="/carona/nova"
        className="mt-3 block text-[12px] font-semibold text-muted-foreground"
      >
        Ou ofereça uma carona
      </Link>
    </div>
  );
}