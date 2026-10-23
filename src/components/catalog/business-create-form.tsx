import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { PublisherHeader } from "@/components/publisher/PublisherHeader";
import { PublisherLayout } from "@/components/publisher/PublisherLayout";
import { PublisherSubmitButton } from "@/components/publisher/PublisherSubmitButton";
import { AIContentAssist } from "@/components/catalog/ai-content-assist";
import { CatalogImageFields, mediaToDataUrls } from "@/components/catalog/catalog-image-fields";
import { CatalogField, CatalogSection, catalogAreaClass, catalogInputClass } from "@/components/catalog/catalog-form-ui";
import { CatalogHoursEditor, CatalogTagPicker } from "@/components/catalog/catalog-hours-editor";
import { applyCatalogAssistSuggestion } from "@/lib/catalog/apply-catalog-assist";
import { createDefaultBusinessHours } from "@/lib/catalog/catalog-hours";
import {
  BUSINESS_FEATURE_TAGS,
  CATALOG_VISIBILITY_OPTIONS,
  CatalogVisibility,
  type CatalogVisibilityValue,
} from "@/lib/catalog/catalog-options";
import { LOCAL_CATALOG_DISCLAIMER, createCatalogBusiness } from "@/lib/catalog/local-catalog";
import {
  BUSINESS_CATEGORY_OPTIONS,
  PRICE_RANGE_OPTIONS,
  PriceRange,
  type BusinessCategoryValue,
  type BusinessHoursSlot,
  type PriceRangeValue,
} from "@/lib/marketplace/business-types";
import type { MediaFile } from "@/lib/upload";

export function BusinessCreateForm() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [category, setCategory] = useState<BusinessCategoryValue>(BUSINESS_CATEGORY_OPTIONS[0].value);
  const [subcategory, setSubcategory] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [address, setAddress] = useState("");
  const [reference, setReference] = useState("");
  const [hours, setHours] = useState<BusinessHoursSlot[]>(() => createDefaultBusinessHours());
  const [priceRange, setPriceRange] = useState<PriceRangeValue>(PriceRange.MODERATE);
  const [tags, setTags] = useState<string[]>([]);
  const [visibility, setVisibility] = useState<CatalogVisibilityValue>(CatalogVisibility.PUBLIC);
  const [cover, setCover] = useState<MediaFile[]>([]);
  const [gallery, setGallery] = useState<MediaFile[]>([]);
  const [saving, setSaving] = useState(false);

  async function handlePublish() {
    setSaving(true);
    try {
      const photos = await mediaToDataUrls(cover, 1);
      const extra = await mediaToDataUrls(gallery, 4);
      const entity = createCatalogBusiness({
        name,
        category,
        subcategory,
        description,
        phone,
        website,
        address,
        reference,
        hours,
        priceRange,
        tags,
        visibility,
        cover: photos[0],
        gallery: extra,
      });
      toast.success("Negócio salvo no catálogo local.");
      navigate({ to: "/business/$businessId", params: { businessId: entity.id } });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <PublisherLayout>
      <PublisherHeader title="Criar negócio" onPublish={() => void handlePublish()} publishing={saving} />
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
        <CatalogSection title="Identidade" hint="Como o negócio aparece na ficha.">
          <CatalogImageFields
            cover={cover}
            gallery={gallery}
            onCoverChange={setCover}
            onGalleryChange={setGallery}
            coverLabel="Foto principal"
            galleryLabel="Galeria"
          />
          <CatalogField label="Nome">
            <input value={name} onChange={(event) => setName(event.target.value)} data-catalog-field="name" className={catalogInputClass} />
          </CatalogField>
          <CatalogField label="Categoria">
            <select value={category} onChange={(event) => setCategory(event.target.value as BusinessCategoryValue)} data-catalog-field="category" className={catalogInputClass}>
              {BUSINESS_CATEGORY_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </CatalogField>
          <CatalogField label="Subcategoria">
            <input value={subcategory} onChange={(event) => setSubcategory(event.target.value)} data-catalog-field="subcategory" placeholder="Ex.: Restaurante francês" className={catalogInputClass} />
          </CatalogField>
          <CatalogField label="Descrição">
            <textarea value={description} onChange={(event) => setDescription(event.target.value)} data-catalog-field="description" rows={4} className={catalogAreaClass} />
          </CatalogField>
        </CatalogSection>

        <CatalogSection title="Contato">
          <CatalogField label="Telefone">
            <input value={phone} onChange={(event) => setPhone(event.target.value)} data-catalog-field="phone" className={catalogInputClass} />
          </CatalogField>
          <CatalogField label="Website">
            <input value={website} onChange={(event) => setWebsite(event.target.value)} data-catalog-field="website" className={catalogInputClass} />
          </CatalogField>
        </CatalogSection>

        <CatalogSection title="Localização">
          <CatalogField label="Endereço">
            <input value={address} onChange={(event) => setAddress(event.target.value)} data-catalog-field="address" className={catalogInputClass} />
          </CatalogField>
          <CatalogField label="Referência">
            <input value={reference} onChange={(event) => setReference(event.target.value)} data-catalog-field="reference" className={catalogInputClass} />
          </CatalogField>
        </CatalogSection>

        <CatalogSection title="Horário de funcionamento" hint="Cada dia pode ficar fechado ou ter abertura e fechamento.">
          <CatalogHoursEditor value={hours} onChange={setHours} />
        </CatalogSection>

        <CatalogSection title="Faixa de preço">
          <CatalogField label="Preço">
            <select value={priceRange} onChange={(event) => setPriceRange(event.target.value as PriceRangeValue)} data-catalog-field="priceRange" className={catalogInputClass}>
              {PRICE_RANGE_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>{item.symbol} {item.label}</option>
              ))}
            </select>
          </CatalogField>
        </CatalogSection>

        <CatalogSection title="Características">
          <CatalogTagPicker options={BUSINESS_FEATURE_TAGS} value={tags} onChange={setTags} />
        </CatalogSection>

        <CatalogSection title="Visibilidade">
          <CatalogField label="Quem pode ver">
            <select value={visibility} onChange={(event) => setVisibility(event.target.value as CatalogVisibilityValue)} data-catalog-field="visibility" className={catalogInputClass}>
              {CATALOG_VISIBILITY_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </CatalogField>
        </CatalogSection>

        <AIContentAssist
          kind="business"
          context={{ name, title: name, description, category, location: address }}
          onApply={(suggestion) => {
            const next = applyCatalogAssistSuggestion({ name, description, tags }, suggestion);
            setName(next.name ?? name);
            setDescription(next.description ?? description);
            if (next.tags) setTags(next.tags.filter((tag) => (BUSINESS_FEATURE_TAGS as readonly string[]).includes(tag)));
          }}
        />
        <p className="text-xs leading-relaxed text-muted-foreground">{LOCAL_CATALOG_DISCLAIMER}</p>
        <p className="text-xs leading-relaxed text-muted-foreground">Ofertas, cupons e eventos continuam em cadastros separados.</p>
        <PublisherSubmitButton onClick={() => void handlePublish()} publishing={saving} label="Salvar no catálogo local" />
      </div>
    </PublisherLayout>
  );
}
