import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PublisherLayout } from "@/components/publisher/PublisherLayout";
import { PublisherHeader } from "@/components/publisher/PublisherHeader";
import { PublisherFooter } from "@/components/publisher/PublisherFooter";
import { UploadMedia } from "@/components/upload";
import { PublisherVisibility } from "@/components/publisher/PublisherVisibility";
import { PublisherCategory } from "@/components/publisher/PublisherCategory";
import { usePublisherForm } from "@/components/publisher/usePublisherForm";
import { BrandInput } from "@/components/ui/brand-input";
import { MapPin } from "lucide-react";

const PLACE_CATEGORIES = [
  "Restaurante",
  "Bar",
  "Café",
  "Loja",
  "Parque",
  "Praia",
  "Museu",
  "Outro",
];

export const Route = createFileRoute("/_app/create/place")({
  head: () => ({ meta: [{ title: "Cadastrar local" }] }),
  component: PlaceForm,
});

function PlaceForm() {
  const { publishing, publish } = usePublisherForm();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [placeCategory, setPlaceCategory] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private" | "followers">("public");

  return (
    <PublisherLayout>
      <PublisherHeader title="Cadastrar local" />
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        <PublisherCategory emoji="📍" label="Local" />
        <BrandInput
          label="Nome do local"
          placeholder="Ex: Bar do Zé"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <div className="space-y-2">
          <p className="text-sm font-medium">Categoria</p>
          <div className="flex flex-wrap gap-2">
            {PLACE_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setPlaceCategory(placeCategory === cat ? "" : cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  placeCategory === cat
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
            placeholder="Descreva o local..."
            rows={3}
            className="w-full px-4 py-3 rounded-xl bg-secondary/50 text-sm outline-none focus:ring-2 focus:ring-primary/30 resize-none placeholder:text-muted-foreground"
          />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            <MapPin className="h-3.5 w-3.5" />
            Endereço
          </div>
          <BrandInput
            placeholder="Endereço completo"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>
        <BrandInput
          label="Telefone"
          placeholder="(11) 99999-9999"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <BrandInput
          label="Website"
          placeholder="https://..."
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
        <UploadMedia mode="photo" multiple maxFiles={5} label="Adicionar fotos" />
        <PublisherVisibility value={visibility} onChange={setVisibility} />
      </div>
      <PublisherFooter publishing={publishing} onSubmit={publish} label="Cadastrar local" />
    </PublisherLayout>
  );
}
