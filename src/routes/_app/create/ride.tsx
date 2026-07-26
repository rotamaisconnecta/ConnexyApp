import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PublisherLayout } from "@/components/publisher/PublisherLayout";
import { PublisherHeader } from "@/components/publisher/PublisherHeader";
import { PublisherFooter } from "@/components/publisher/PublisherFooter";
import { PublisherVisibility } from "@/components/publisher/PublisherVisibility";
import { PublisherCategory } from "@/components/publisher/PublisherCategory";
import { usePublisherForm } from "@/components/publisher/usePublisherForm";
import { BrandInput } from "@/components/ui/brand-input";
import { Navigation, PawPrint, Luggage, Snowflake } from "lucide-react";

export const Route = createFileRoute("/_app/create/ride")({
  head: () => ({ meta: [{ title: "Criar carona" }] }),
  component: RideForm,
});

function RideForm() {
  const { publishing, publish } = usePublisherForm();
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [dateTime, setDateTime] = useState("");
  const [seats, setSeats] = useState("1");
  const [price, setPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [allowPets, setAllowPets] = useState(false);
  const [allowLuggage, setAllowLuggage] = useState(false);
  const [hasAc, setHasAc] = useState(false);
  const [visibility, setVisibility] = useState<"public" | "private" | "followers">("public");

  return (
    <PublisherLayout>
      <PublisherHeader title="Criar carona" />
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        <PublisherCategory emoji="🚗" label="Carona" />
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Navigation className="h-3.5 w-3.5" />
            Rota
          </div>
          <BrandInput
            placeholder="De onde?"
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
          />
          <BrandInput
            placeholder="Para onde?"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Data e hora</label>
            <input
              type="datetime-local"
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-secondary/50 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <BrandInput
            label="Vagas"
            type="number"
            min={1}
            max={6}
            value={seats}
            onChange={(e) => setSeats(e.target.value)}
          />
        </div>
        <BrandInput
          label="Preço por pessoa"
          placeholder="Grátis ou R$ 0,00"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Preferências
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setAllowPets(!allowPets)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                allowPets
                  ? "bg-primary/10 text-primary ring-1 ring-primary/30"
                  : "bg-secondary/50 hover:bg-secondary"
              }`}
            >
              <PawPrint className="h-3.5 w-3.5" />
              Pets
            </button>
            <button
              type="button"
              onClick={() => setAllowLuggage(!allowLuggage)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                allowLuggage
                  ? "bg-primary/10 text-primary ring-1 ring-primary/30"
                  : "bg-secondary/50 hover:bg-secondary"
              }`}
            >
              <Luggage className="h-3.5 w-3.5" />
              Bagagem
            </button>
            <button
              type="button"
              onClick={() => setHasAc(!hasAc)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                hasAc
                  ? "bg-primary/10 text-primary ring-1 ring-primary/30"
                  : "bg-secondary/50 hover:bg-secondary"
              }`}
            >
              <Snowflake className="h-3.5 w-3.5" />
              Ar condicionado
            </button>
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium">Observações</p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Alguma observação para os passageiros..."
            rows={3}
            className="w-full px-4 py-3 rounded-xl bg-secondary/50 text-sm outline-none focus:ring-2 focus:ring-primary/30 resize-none placeholder:text-muted-foreground"
          />
        </div>
        <PublisherVisibility value={visibility} onChange={setVisibility} />
      </div>
      <PublisherFooter publishing={publishing} onSubmit={publish} label="Publicar carona" />
    </PublisherLayout>
  );
}
