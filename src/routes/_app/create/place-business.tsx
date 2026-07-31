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
import { MapPin, Clock } from "lucide-react";

const BUSINESS_CATEGORIES = ["Restaurante", "Bar", "Café", "Loja", "Serviço", "Comércio", "Outro"];

export const Route = createFileRoute("/_app/create/place-business")({
  head: () => ({ meta: [{ title: "Criar negócio" }] }),
  component: BusinessForm,
});

function BusinessForm() {
  const { publishing, publish } = usePublisherForm();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [businessCategory, setBusinessCategory] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [hours, setHours] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private" | "followers">("public");

  return (
    <PublisherLayout>
      <PublisherHeader title="Criar negócio" />
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        <PublisherCategory emoji="🏪" label="Negócio" />
        <BrandInput
          label="Nome do negócio"
          placeholder="Ex: Café Central"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <div className="space-y-2">
          <p className="text-sm font-medium">Categoria</p>
          <div className="flex flex-wrap gap-2">
            {BUSINESS_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setBusinessCategory(businessCategory === cat ? "" : cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  businessCategory === cat
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
            placeholder="Descreva seu negócio..."
            rows={3}
            className="w-full px-4 py-3 rounded-xl bg-secondary/50 text-sm outline-none focus:ring-2 focus:ring-primary/30 resize-none placeholder:text-muted-foreground"
          />
        </div>
        <UploadMedia mode="photo" multiple maxFiles={5} label="Fotos do negócio" />
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            <MapPin className="h-3.5 w-3.5" />
            Endereço
          </div>
          <BrandInput
            placeholder="Rua, número, bairro"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            <Clock className="h-3.5 w-3.5" />
            Horário de funcionamento
          </div>
          <BrandInput
            placeholder="Ex: Seg-Sex 09:00-18:00"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
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
        <PublisherVisibility value={visibility} onChange={setVisibility} />
      </div>
      <PublisherFooter publishing={publishing} onSubmit={publish} label="Cadastrar negócio" />
    </PublisherLayout>
  );
}
