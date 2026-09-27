import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { StatusBar } from "@/components/phone-frame";
import { BackButton } from "@/components/navigation/back-button";
import { createCaronaOffer } from "@/lib/carona/carona-store";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/carona/nova")({
  head: () => ({ meta: [{ title: "Oferecer carona — Connexy" }] }),
  component: NovaCaronaPage,
});

function tomorrow(): string {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}

function NovaCaronaPage() {
  const navigate = useNavigate();
  const [origin, setOrigin] = useState("Av. Paulista");
  const [destination, setDestination] = useState("Ibirapuera");
  const [meetup, setMeetup] = useState("Metrô Trianon");
  const [date, setDate] = useState(tomorrow);
  const [time, setTime] = useState("19:30");
  const [seats, setSeats] = useState(2);

  function publish() {
    try {
      const offer = createCaronaOffer({
        origin,
        destination,
        meetup,
        date,
        time,
        availableSeats: seats,
      });
      toast.success("Carona publicada neste dispositivo.");
      navigate({ to: "/carona/$offerId", params: { offerId: offer.id } });
    } catch {
      toast.error("Não foi possível publicar a carona.");
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
        <h1 className="font-display font-bold">Oferecer carona</h1>
      </header>
      <div className="space-y-3 px-5 pb-8">
        <Field label="Região de origem" value={origin} onChange={setOrigin} />
        <Field label="Destino aproximado" value={destination} onChange={setDestination} />
        <Field label="Ponto de encontro" value={meetup} onChange={setMeetup} />
        <label className="block text-sm font-semibold">
          Data
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="mt-1.5 w-full rounded-2xl border border-border bg-surface px-3 py-2.5 text-sm"
          />
        </label>
        <label className="block text-sm font-semibold">
          Horário
          <input
            type="time"
            value={time}
            onChange={(event) => setTime(event.target.value)}
            className="mt-1.5 w-full rounded-2xl border border-border bg-surface px-3 py-2.5 text-sm"
          />
        </label>
        <label className="block text-sm font-semibold">
          Vagas
          <input
            type="number"
            min={1}
            max={6}
            value={seats}
            onChange={(event) => setSeats(Number(event.target.value) || 1)}
            className="mt-1.5 w-full rounded-2xl border border-border bg-surface px-3 py-2.5 text-sm"
          />
        </label>
        <p className="text-[11px] text-muted-foreground">
          Endereços residenciais não são exibidos. Use um ponto de encontro aproximado.
        </p>
        <button
          type="button"
          onClick={publish}
          className="flex w-full items-center justify-center rounded-full bg-gradient-brand py-3.5 text-sm font-semibold text-white"
        >
          Publicar carona
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-sm font-semibold">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1.5 w-full rounded-2xl border border-border bg-surface px-3 py-2.5 text-sm font-normal"
      />
    </label>
  );
}
