import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { ArrowRight, CalendarDays, Clock3, MapPin, Navigation, Users } from "lucide-react";
import { StatusBar } from "@/components/phone-frame";
import { BackButton } from "@/components/navigation/back-button";
import { TypeScale } from "@/theme/typography";
import { resolveRideOrigin, CURRENT_RIDE_ORIGIN_LABEL } from "@/lib/mobility/ride-request-context";
import { caronaAddDaysIso, caronaTodayIso } from "@/lib/carona/carona-format";
import { buildCaronaSearch, caronaSearchSchema } from "@/lib/carona/carona-search-params";

export const Route = createFileRoute("/_app/carona/encontrar")({
  validateSearch: caronaSearchSchema,
  head: () => ({ meta: [{ title: "Encontrar carona — Connexy" }] }),
  component: EncontrarCaronaPage,
});

const MAX_SEATS = 4;

function EncontrarCaronaPage() {
  const nav = useNavigate();
  const search = Route.useSearch();

  // A origem nunca vem do contexto (evento/local). Se houver localização,
  // ela é a atual; caso contrário o usuário informa manualmente.
  const currentLocation = resolveRideOrigin();
  const [useCurrentLocation, setUseCurrentLocation] = useState(Boolean(currentLocation));
  const [origin, setOrigin] = useState(search.origin ?? "");
  const [destination, setDestination] = useState(search.destination ?? "");
  const [date, setDate] = useState(search.date ?? caronaTodayIso());
  const [time, setTime] = useState(search.time ?? "");
  const [seats, setSeats] = useState(Math.max(1, search.seats ?? 1));

  const effectiveOrigin = useCurrentLocation
    ? (currentLocation?.address ?? CURRENT_RIDE_ORIGIN_LABEL)
    : origin.trim();
  const contextLabel = search.contextLabel?.trim() || "";
  const originReady = useCurrentLocation ? Boolean(currentLocation) : origin.trim().length > 0;
  const canSearch = destination.trim().length > 0 && originReady;

  function goToResults() {
    const criteria = buildCaronaSearch({
      origin: useCurrentLocation ? (currentLocation?.address ?? CURRENT_RIDE_ORIGIN_LABEL) : origin,
      destination,
      date,
      time,
      seats,
      contextType: search.contextType,
      contextId: search.contextId,
      contextLabel: search.contextLabel,
    });
    nav({ to: "/carona/encontradas", search: criteria });
  }

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden">
      <StatusBar />

      <div className="flex items-center gap-3 px-5 pt-1 pb-2 shrink-0">
        <BackButton
          fallbackTo="/carona"
          className="h-9 w-9 grid place-items-center rounded-full bg-secondary"
        />
        <h1 className={`font-display font-bold ${TypeScale.screenTitle}`}>
          Encontrar carona
        </h1>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {contextLabel ? (
          <div className="mb-5 rounded-3xl border border-border/70 bg-surface/70 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Contexto
            </p>
            <p className="mt-1 text-[14px] font-semibold text-foreground">{contextLabel}</p>
          </div>
        ) : null}

        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, ease: [0.22, 0.61, 0.36, 1] }}
          className="rounded-[26px] border border-border bg-surface px-4 py-4"
        >
          <FieldLabel>De onde você sai?</FieldLabel>
          {currentLocation ? (
            <button
              type="button"
              onClick={() => setUseCurrentLocation((value) => !value)}
              aria-pressed={useCurrentLocation}
              className="mt-2.5 flex w-full items-center gap-3 rounded-2xl bg-secondary/60 px-3.5 py-3 text-left"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/12 text-primary">
                <Navigation className="h-4 w-4" strokeWidth={2.2} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-semibold text-foreground">
                  {useCurrentLocation ? CURRENT_RIDE_ORIGIN_LABEL : "Escolher outro ponto"}
                </span>
                <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
                  {useCurrentLocation
                    ? effectiveOrigin
                    : "Toque para usar a sua localização atual"}
                </span>
              </span>
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${useCurrentLocation ? "bg-primary" : "bg-muted-foreground/30"}`}
                aria-hidden
              />
            </button>
          ) : null}

          {(!currentLocation || !useCurrentLocation) && (
            <TextInput
              value={origin}
              onChange={setOrigin}
              placeholder="De onde você sai?"
              icon={<MapPin className="h-4 w-4" strokeWidth={2.2} />}
              className="mt-2.5"
            />
          )}

          <div className="my-3 flex items-center gap-3" aria-hidden>
            <span className="h-px flex-1 bg-border" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Para
            </span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <TextInput
            value={destination}
            onChange={setDestination}
            placeholder="Para onde você vai?"
            icon={<MapPin className="h-4 w-4" strokeWidth={2.2} />}
          />
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, delay: 0.05, ease: [0.22, 0.61, 0.36, 1] }}
          className="mt-3 rounded-[26px] border border-border bg-surface px-4 py-4"
        >
          <FieldLabel>Quando?</FieldLabel>
          <div className="mt-2.5 grid grid-cols-2 gap-2.5">
            <label className="block">
              <span className="flex items-center gap-1.5 rounded-2xl bg-secondary/60 px-3.5 py-2.5">
                <CalendarDays className="h-4 w-4 shrink-0 text-primary" strokeWidth={2.2} />
                <input
                  type="date"
                  value={date}
                  min={caronaTodayIso()}
                  onChange={(event) => setDate(event.target.value)}
                  className="w-full bg-transparent text-[13px] font-medium text-foreground outline-none"
                />
              </span>
            </label>
            <label className="block">
              <span className="flex items-center gap-1.5 rounded-2xl bg-secondary/60 px-3.5 py-2.5">
                <Clock3 className="h-4 w-4 shrink-0 text-primary" strokeWidth={2.2} />
                <input
                  type="time"
                  value={time}
                  onChange={(event) => setTime(event.target.value)}
                  className="w-full bg-transparent text-[13px] font-medium text-foreground outline-none"
                />
              </span>
            </label>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <QuickChip
              label="Hoje"
              active={date === caronaTodayIso()}
              onClick={() => setDate(caronaTodayIso())}
            />
            <QuickChip
              label="Amanhã"
              active={date === caronaAddDaysIso(1)}
              onClick={() => setDate(caronaAddDaysIso(1))}
            />
          </div>

          <div className="mt-4 flex items-center justify-between">
            <span className="flex items-center gap-2 text-[13px] font-semibold text-foreground">
              <Users className="h-4 w-4 text-primary" strokeWidth={2.2} />
              Passageiros
            </span>
            <div className="flex items-center gap-1 rounded-full bg-secondary/60 px-1 py-1">
              <StepButton
                label="Remover passageiro"
                disabled={seats <= 1}
                onClick={() => setSeats((value) => Math.max(1, value - 1))}
                text="−"
              />
              <span className="w-7 text-center text-[14px] font-semibold text-foreground">
                {seats}
              </span>
              <StepButton
                label="Adicionar passageiro"
                disabled={seats >= MAX_SEATS}
                onClick={() => setSeats((value) => Math.min(MAX_SEATS, value + 1))}
                text="+"
              />
            </div>
          </div>
        </motion.section>
      </div>

      <div className="shrink-0 px-5 pb-5 pt-1">
        <button
          type="button"
          onClick={goToResults}
          disabled={!canSearch}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-brand py-3.5 text-[15px] font-semibold text-white shadow-[0_12px_28px_rgba(109,40,217,0.26)] transition active:scale-[0.98] disabled:opacity-40"
        >
          Encontrar carona
          <ArrowRight className="h-4 w-4" strokeWidth={2.4} />
        </button>
      </div>
    </div>
  );
}

function FieldLabel({ children }: { children: string }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </p>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  icon,
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  icon: ReactNode;
  className?: string;
}) {
  return (
    <label className={`flex items-center gap-2.5 rounded-2xl bg-secondary/60 px-3.5 py-3 ${className}`}>
      <span className="shrink-0 text-primary">{icon}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-[14px] font-medium text-foreground outline-none placeholder:text-muted-foreground/70"
      />
    </label>
  );
}

function QuickChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full px-3 py-1.5 text-[12px] font-semibold transition ${
        active ? "bg-foreground text-white" : "bg-secondary/70 text-muted-foreground"
      }`}
    >
      {label}
    </button>
  );
}

function StepButton({
  label,
  text,
  disabled,
  onClick,
}: {
  label: string;
  text: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="grid h-8 w-8 place-items-center rounded-full bg-surface text-[16px] font-semibold text-foreground shadow-sm transition active:scale-95 disabled:opacity-30"
    >
      {text}
    </button>
  );
}