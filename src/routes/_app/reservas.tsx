import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { useEffect, useState } from "react";
import { StatusBar } from "@/components/phone-frame";
import { BackButton } from "@/components/navigation/back-button";
import {
  cancelReservation,
  listReservations,
  subscribeReservations,
  type Reservation,
} from "@/lib/reservations/reservation-store";
import { toast } from "sonner";

const searchSchema = z.object({
  highlight: z.string().optional(),
});

export const Route = createFileRoute("/_app/reservas")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Minhas reservas — Connexy" }] }),
  component: ReservasPage,
});

function statusLabel(status: Reservation["status"]): string {
  if (status === "confirmed") return "Confirmada";
  if (status === "cancelled") return "Cancelada";
  if (status === "completed") return "Concluída";
  return "Solicitada";
}

function ReservasPage() {
  const { highlight } = Route.useSearch();
  const [items, setItems] = useState(() => listReservations());
  useEffect(() => subscribeReservations(() => setItems(listReservations())), []);

  function onCancel(id: string) {
    const next = cancelReservation(id);
    if (next) toast.success("Reserva cancelada.");
    setItems(listReservations());
  }

  return (
    <div className="flex-1">
      <StatusBar />
      <header className="flex items-center gap-2 px-4 pt-1 pb-3">
        <BackButton
          fallbackTo="/home"
          className="h-9 w-9 grid place-items-center rounded-full bg-secondary"
        />
        <h1 className="font-display font-bold">Minhas reservas</h1>
      </header>
      <div className="space-y-3 px-5 pb-8">
        {items.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Você ainda não tem reservas neste dispositivo.
          </p>
        )}
        {items.map((item) => (
          <article
            key={item.id}
            className={`rounded-2xl border bg-surface p-4 shadow-soft ${
              item.id === highlight ? "border-primary" : "border-border"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-sm font-bold">{item.resourceName}</h2>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {item.date} · {item.time} · {item.partySize}{" "}
                  {item.partySize === 1 ? "pessoa" : "pessoas"}
                </p>
              </div>
              <span className="text-[10px] font-semibold text-primary">
                {statusLabel(item.status)}
              </span>
            </div>
            {item.status === "confirmed" && (
              <button
                type="button"
                onClick={() => onCancel(item.id)}
                className="mt-3 text-xs font-semibold text-muted-foreground"
              >
                Cancelar
              </button>
            )}
          </article>
        ))}
        <Link to="/marketplace" className="block text-center text-xs font-semibold text-primary">
          Reservar um negócio
        </Link>
      </div>
    </div>
  );
}
