import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PublisherLayout } from "@/components/publisher/PublisherLayout";
import { PublisherHeader } from "@/components/publisher/PublisherHeader";
import { PublisherFooter } from "@/components/publisher/PublisherFooter";
import { UploadMedia } from "@/components/ui/UploadMedia";
import { PublisherLocationPicker } from "@/components/publisher/PublisherLocationPicker";
import { PublisherVisibility } from "@/components/publisher/PublisherVisibility";
import { PublisherCategory } from "@/components/publisher/PublisherCategory";
import { usePublisherForm } from "@/components/publisher/usePublisherForm";
import { BrandInput } from "@/components/ui/brand-input";
import { Calendar, Users } from "lucide-react";

const EVENT_CATEGORIES = [
  "Música",
  "Esporte",
  "Gastronomia",
  "Tecnologia",
  "Arte",
  "Networking",
  "Outro",
];

export const Route = createFileRoute("/_app/create/event")({
  head: () => ({ meta: [{ title: "Criar evento" }] }),
  component: EventForm,
});

function EventForm() {
  const { publishing, publish } = usePublisherForm();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [eventCategory, setEventCategory] = useState("");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [location, setLocation] = useState("");
  const [maxAttendees, setMaxAttendees] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private" | "followers">("public");

  return (
    <PublisherLayout>
      <PublisherHeader title="Criar evento" />
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        <PublisherCategory emoji="🎉" label="Evento" />
        <UploadMedia accept="image/*" label="Banner do evento" />
        <BrandInput
          label="Nome do evento"
          placeholder="Ex: Fest Junina"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <div className="space-y-2">
          <p className="text-sm font-medium">Categoria</p>
          <div className="flex flex-wrap gap-2">
            {EVENT_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setEventCategory(eventCategory === cat ? "" : cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  eventCategory === cat
                    ? "bg-primary text-white"
                    : "bg-secondary/50 hover:bg-secondary"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium">Descrição</p>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descreva o evento..."
            rows={3}
            className="w-full px-4 py-3 rounded-xl bg-secondary/50 text-sm outline-none focus:ring-2 focus:ring-primary/30 resize-none placeholder:text-muted-foreground"
          />
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            Data e horário
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Início</label>
              <input
                type="datetime-local"
                value={dateStart}
                onChange={(e) => setDateStart(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-secondary/50 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Fim</label>
              <input
                type="datetime-local"
                value={dateEnd}
                onChange={(e) => setDateEnd(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-secondary/50 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
        </div>
        <PublisherLocationPicker value={location} onChange={setLocation} />
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            <Users className="h-3.5 w-3.5" />
            Vagas
          </div>
          <BrandInput
            placeholder="Máximo de participantes (opcional)"
            type="number"
            value={maxAttendees}
            onChange={(e) => setMaxAttendees(e.target.value)}
          />
        </div>
        <PublisherVisibility value={visibility} onChange={setVisibility} />
      </div>
      <PublisherFooter publishing={publishing} onSubmit={publish} />
    </PublisherLayout>
  );
}
