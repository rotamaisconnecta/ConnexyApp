import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PublisherLayout } from "@/components/publisher/PublisherLayout";
import { PublisherHeader } from "@/components/publisher/PublisherHeader";
import { PublisherFooter } from "@/components/publisher/PublisherFooter";
import { UploadMedia } from "@/components/upload";
import { PublisherLocationPicker } from "@/components/publisher/PublisherLocationPicker";
import { PublisherVisibility } from "@/components/publisher/PublisherVisibility";
import { PublisherCategory } from "@/components/publisher/PublisherCategory";
import { usePublisherForm } from "@/components/publisher/usePublisherForm";
import { BrandInput } from "@/components/ui/brand-input";
import { Tag } from "lucide-react";

export const Route = createFileRoute("/_app/create/offer")({
  head: () => ({ meta: [{ title: "Criar oferta" }] }),
  component: OfferForm,
});

function OfferForm() {
  const { publishing, publish } = usePublisherForm();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [discount, setDiscount] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [location, setLocation] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private" | "followers">("public");

  return (
    <PublisherLayout>
      <PublisherHeader title="Criar oferta" />
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        <PublisherCategory emoji="🏷️" label="Oferta" />
        <UploadMedia mode="photo" label="Imagem da oferta" />
        <BrandInput
          label="Título"
          placeholder="Ex: 2x1 em todas as cervejas"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <div className="space-y-1">
          <p className="text-sm font-medium">Descrição</p>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descreva a oferta..."
            rows={3}
            className="w-full px-4 py-3 rounded-xl bg-secondary/50 text-sm outline-none focus:ring-2 focus:ring-primary/30 resize-none placeholder:text-muted-foreground"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <BrandInput
            label="Preço original"
            placeholder="R$ 0,00"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
          <BrandInput
            label="Desconto"
            placeholder="Ex: 50% ou R$10"
            value={discount}
            onChange={(e) => setDiscount(e.target.value)}
          />
        </div>
        <BrandInput
          label="Válido até"
          type="date"
          value={validUntil}
          onChange={(e) => setValidUntil(e.target.value)}
        />
        <BrandInput
          label="Estabelecimento"
          placeholder="Nome do estabelecimento"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
        />
        <PublisherLocationPicker value={location} onChange={setLocation} />
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            <Tag className="h-3.5 w-3.5" />
            Cupom
          </div>
          <BrandInput
            placeholder="Código do cupom (opcional)"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
          />
        </div>
        <PublisherVisibility value={visibility} onChange={setVisibility} />
      </div>
      <PublisherFooter publishing={publishing} onSubmit={publish} />
    </PublisherLayout>
  );
}
