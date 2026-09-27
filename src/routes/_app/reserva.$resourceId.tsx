import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { useMemo, useState } from "react";
import { StatusBar } from "@/components/phone-frame";
import { BackButton } from "@/components/navigation/back-button";
import { getBusinessById } from "@/lib/marketplace/mock-businesses";
import { mergeCatalogPlaces } from "@/lib/catalog/local-catalog";
import { places } from "@/lib/mock-data";
import {
  isBusinessReservable,
  isPlaceReservable,
  RESERVATION_TIME_SLOTS,
} from "@/lib/reservations/reservable";
import {
  createReservation,
  ReservationResourceType,
  type ReservationResourceTypeValue,
} from "@/lib/reservations/reservation-store";
import { toast } from "sonner";

const searchSchema = z.object({
  type: z.enum(["business", "place"]).optional(),
});

export const Route = createFileRoute("/_app/reserva/$resourceId")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Reservar — Connexy" }] }),
  component: ReservaPage,
});

function tomorrow(): string {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}

function ReservaPage() {
  const navigate = useNavigate();
  const { resourceId } = Route.useParams();
  const search = Route.useSearch();
  const resourceType: ReservationResourceTypeValue =
    search.type === "place" ? ReservationResourceType.PLACE : ReservationResourceType.BUSINESS;

  const resource = useMemo(() => {
    if (resourceType === ReservationResourceType.PLACE) {
      const place = mergeCatalogPlaces(places).find((item) => item.id === resourceId);
      if (!place || !isPlaceReservable(place)) return null;
      return { name: place.name, reservable: true };
    }
    const business = getBusinessById(resourceId);
    if (!business || !isBusinessReservable(business)) return null;
    return { name: business.name, reservable: true };
  }, [resourceId, resourceType]);

  const [date, setDate] = useState(tomorrow);
  const [time, setTime] = useState<string>(RESERVATION_TIME_SLOTS[3]);
  const [partySize, setPartySize] = useState(2);
  const [saving, setSaving] = useState(false);

  if (!resource) {
    return (
      <div className="flex-1">
        <StatusBar />
        <header className="flex items-center gap-2 px-4 pt-1 pb-3">
          <BackButton
            fallbackTo="/marketplace"
            className="h-9 w-9 grid place-items-center rounded-full bg-secondary"
          />
          <h1 className="font-display font-bold">Reserva</h1>
        </header>
        <p className="px-5 text-sm text-muted-foreground">
          Este recurso não aceita reservas no MVP local.
        </p>
      </div>
    );
  }

  function confirm() {
    if (!resource) return;
    setSaving(true);
    try {
      const reservation = createReservation({
        resourceId,
        resourceType,
        resourceName: resource.name,
        date,
        time,
        partySize,
      });
      toast.success("Reserva confirmada neste dispositivo.");
      navigate({ to: "/reservas", search: { highlight: reservation.id } });
    } catch {
      toast.error("Não foi possível criar a reserva.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex-1">
      <StatusBar />
      <header className="flex items-center gap-2 px-4 pt-1 pb-3">
        <BackButton
          fallbackTo="/marketplace"
          className="h-9 w-9 grid place-items-center rounded-full bg-secondary"
        />
        <div>
          <h1 className="font-display font-bold">Reservar</h1>
          <p className="text-[11px] text-muted-foreground">{resource.name}</p>
        </div>
      </header>

      <div className="space-y-4 px-5 pb-8">
        <label className="block text-sm font-semibold">
          Data
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="mt-1.5 w-full rounded-2xl border border-border bg-surface px-3 py-2.5 text-sm"
          />
        </label>
        <fieldset>
          <legend className="text-sm font-semibold">Horário</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {RESERVATION_TIME_SLOTS.map((slot) => (
              <button
                key={slot}
                type="button"
                onClick={() => setTime(slot)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                  time === slot ? "bg-gradient-brand text-white" : "bg-secondary text-foreground"
                }`}
              >
                {slot}
              </button>
            ))}
          </div>
        </fieldset>
        <label className="block text-sm font-semibold">
          Pessoas
          <input
            type="number"
            min={1}
            max={20}
            value={partySize}
            onChange={(event) => setPartySize(Number(event.target.value) || 1)}
            className="mt-1.5 w-full rounded-2xl border border-border bg-surface px-3 py-2.5 text-sm"
          />
        </label>
        <button
          type="button"
          disabled={saving || !date || !time}
          onClick={confirm}
          className="flex w-full items-center justify-center rounded-full bg-gradient-brand py-3.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          Confirmar reserva
        </button>
        <Link to="/reservas" className="block text-center text-xs font-semibold text-primary">
          Ver minhas reservas
        </Link>
      </div>
    </div>
  );
}
