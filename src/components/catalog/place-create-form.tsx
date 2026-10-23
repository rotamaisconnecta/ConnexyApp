import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { AIContentAssist } from "@/components/catalog/ai-content-assist";
import { AdCreateShell, AdStepSection } from "@/components/catalog/ad-create-shell";
import { INITIAL_AD_CREATE_STEP, isReviewStep, type AdCreateStepId } from "@/components/catalog/ad-create-steps";
import { AdTemplateSelector } from "@/components/catalog/ad-template-selector";
import { DEFAULT_AD_TEMPLATE, type AdTemplateId } from "@/components/catalog/ad-template";
import { CatalogImageFields, mediaToDataUrls } from "@/components/catalog/catalog-image-fields";
import {
  CatalogField,
  CatalogSection,
  catalogAreaClass,
  catalogInputClass,
} from "@/components/catalog/catalog-form-ui";
import { CatalogHoursEditor, CatalogTagPicker } from "@/components/catalog/catalog-hours-editor";
import { LiveAdPreview, type LiveAdPreviewModel } from "@/components/catalog/live-ad-preview";
import { PublisherSubmitButton } from "@/components/publisher/PublisherSubmitButton";
import { applyCatalogAssistSuggestion } from "@/lib/catalog/apply-catalog-assist";
import { createEmptyHours, formatHoursSummary } from "@/lib/catalog/catalog-hours";
import {
  CATALOG_VISIBILITY_OPTIONS,
  CatalogVisibility,
  PLACE_CATEGORIES,
  PLACE_FEATURE_TAGS,
  type CatalogVisibilityValue,
} from "@/lib/catalog/catalog-options";
import { LOCAL_CATALOG_DISCLAIMER, createCatalogPlace } from "@/lib/catalog/local-catalog";
import type { BusinessHoursSlot } from "@/lib/marketplace/business-types";
import type { MediaFile } from "@/lib/upload";

export function PlaceCreateForm() {
  const navigate = useNavigate();
  const [step, setStep] = useState<AdCreateStepId>(INITIAL_AD_CREATE_STEP);
  const [lastEditStep, setLastEditStep] = useState<AdCreateStepId>(INITIAL_AD_CREATE_STEP);
  const [template, setTemplate] = useState<AdTemplateId>(DEFAULT_AD_TEMPLATE);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>(PLACE_CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [reference, setReference] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [visibility, setVisibility] = useState<CatalogVisibilityValue>(CatalogVisibility.PUBLIC);
  const [hasHours, setHasHours] = useState(false);
  const [hoursSlots, setHoursSlots] = useState<BusinessHoursSlot[]>(() => createEmptyHours(true));
  const [cover, setCover] = useState<MediaFile[]>([]);
  const [gallery, setGallery] = useState<MediaFile[]>([]);
  const [saving, setSaving] = useState(false);

  const hoursSummary = useMemo(
    () => (hasHours ? formatHoursSummary(hoursSlots, true) : ""),
    [hasHours, hoursSlots],
  );

  const previewModel = useMemo<LiveAdPreviewModel>(
    () => ({
      kind: "local",
      template,
      title: name,
      category,
      description,
      imageUrl: cover[0]?.preview,
      location: [address.trim(), reference.trim()].filter(Boolean).join(" · ") || undefined,
      offer: hoursSummary || undefined,
      offerPlaceholder: "Horário não informado",
      tags,
      ctaLabel: "Ver local",
    }),
    [address, category, cover, description, hoursSummary, name, reference, tags, template],
  );

  async function handlePublish() {
    setSaving(true);
    try {
      const photos = await mediaToDataUrls(cover, 1);
      const extra = await mediaToDataUrls(gallery, 4);
      const entity = createCatalogPlace({
        name,
        category,
        description,
        address,
        reference,
        phone,
        website,
        tags,
        visibility,
        hasHours,
        hoursSlots: hasHours ? hoursSlots : undefined,
        hours: hasHours ? formatHoursSummary(hoursSlots, true) : "Horário não informado",
        cover: photos[0],
        gallery: extra,
      });
      toast.success("Local salvo no catálogo local.");
      navigate({ to: "/local/$id", params: { id: entity.id } });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  }

  const checklist = [
    { label: "Nome", ready: name.trim().length > 0 },
    { label: "Categoria", ready: category.length > 0 },
    { label: "Descrição", ready: description.trim().length > 0 },
    { label: "Endereço", ready: address.trim().length > 0 },
    { label: "Foto principal", ready: cover.length > 0 },
    { label: "Horário", ready: hasHours },
  ];

  // Mesmas obrigatoriedades de `createCatalogPlace`, sem inventar regra nova:
  // ele recusa nome e endereço vazios.
  const canReview = Boolean(name.trim() && address.trim());

  function handleStepChange(next: AdCreateStepId) {
    if (!isReviewStep(next)) setLastEditStep(next);
    setStep(next);
  }

  return (
    <AdCreateShell
      title="Cadastre seu local ou evento"
      step={step}
      onStepChange={handleStepChange}
      canReview={canReview}
    >
      <div className="space-y-4">
        <AdStepSection step="informacoes" activeStep={step}>
          <div className="space-y-4">
            <CatalogSection
              title="O lugar"
              hint="Praça, parque, praia, museu ou outro ponto de interesse."
            >
              <CatalogField label="Nome">
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  data-catalog-field="name"
                  className={catalogInputClass}
                />
              </CatalogField>
              <CatalogField label="Categoria">
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  data-catalog-field="category"
                  className={catalogInputClass}
                >
                  {PLACE_CATEGORIES.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </CatalogField>
              <CatalogField label="Descrição">
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  data-catalog-field="description"
                  rows={4}
                  className={catalogAreaClass}
                />
              </CatalogField>
            </CatalogSection>
          </div>
        </AdStepSection>

        <AdStepSection step="localizacao" activeStep={step}>
          <div className="space-y-4">
            <CatalogSection
              title="Localização"
              hint="Onde o lugar fica. Aparece na prévia e no anúncio."
            >
              <CatalogField label="Endereço">
                <input
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  data-catalog-field="address"
                  className={catalogInputClass}
                />
              </CatalogField>
              <CatalogField label="Referência">
                <input
                  value={reference}
                  onChange={(event) => setReference(event.target.value)}
                  data-catalog-field="reference"
                  className={catalogInputClass}
                />
              </CatalogField>
            </CatalogSection>

            <CatalogSection title="Contato" hint="Somente quando o local tiver telefone ou site.">
              <CatalogField label="Telefone">
                <input
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  data-catalog-field="phone"
                  className={catalogInputClass}
                />
              </CatalogField>
              <CatalogField label="Website">
                <input
                  value={website}
                  onChange={(event) => setWebsite(event.target.value)}
                  data-catalog-field="website"
                  className={catalogInputClass}
                />
              </CatalogField>
            </CatalogSection>
          </div>
        </AdStepSection>

        <AdStepSection step="ofertas" activeStep={step}>
          <div className="space-y-4">
            <CatalogSection title="Características" hint="Marque o que o local oferece.">
              <CatalogTagPicker options={PLACE_FEATURE_TAGS} value={tags} onChange={setTags} />
            </CatalogSection>

            <CatalogSection title="Horário">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={hasHours}
                  data-catalog-field="hasHours"
                  onChange={(event) => setHasHours(event.target.checked)}
                />
                Possui horário de funcionamento
              </label>
              {hasHours ? (
                <CatalogHoursEditor value={hoursSlots} onChange={setHoursSlots} />
              ) : (
                <p className="text-xs text-muted-foreground">Horário não informado</p>
              )}
            </CatalogSection>
          </div>
        </AdStepSection>

        <AdStepSection step="midia" activeStep={step}>
          <CatalogSection
            title="Mídia"
            hint="A foto principal é a primeira coisa que aparece no anúncio."
          >
            <CatalogImageFields
              cover={cover}
              gallery={gallery}
              onCoverChange={setCover}
              onGalleryChange={setGallery}
              coverLabel="Foto principal"
              galleryLabel="Galeria"
            />
          </CatalogSection>
        </AdStepSection>

        <AdStepSection step="modelos" activeStep={step}>
          <CatalogSection
            title="Modelo do anúncio"
            hint="Escolha como o seu local aparece no Connexy."
          >
            <AdTemplateSelector value={template} onChange={setTemplate} />
          </CatalogSection>
        </AdStepSection>

        <AdStepSection step="preview" activeStep={step}>
          <div className="space-y-4">
            <CatalogSection
              title="Conferir local"
              hint="É assim que o anúncio aparece para quem está por perto."
            >
              <div className="mx-auto w-full max-w-sm">
                <LiveAdPreview model={previewModel} />
              </div>
              <button
                type="button"
                onClick={() => setStep(lastEditStep)}
                data-catalog-action="voltar-e-editar"
                className="h-10 w-full rounded-full bg-secondary text-xs font-semibold text-foreground"
              >
                Voltar e editar
              </button>
            </CatalogSection>

            <CatalogSection
              title="Melhorar com IA"
              hint="Opcional. A IA sugere, você decide se usa."
            >
              <AIContentAssist
                kind="place"
                context={{ name, title: name, description, category, location: address }}
                onApply={(suggestion) => {
                  const next = applyCatalogAssistSuggestion({ name, description, tags }, suggestion);
                  setName(next.name ?? name);
                  setDescription(next.description ?? description);
                  if (next.tags)
                    setTags(
                      next.tags.filter((tag) =>
                        (PLACE_FEATURE_TAGS as readonly string[]).includes(tag),
                      ),
                    );
                }}
              />
            </CatalogSection>
          </div>
        </AdStepSection>

        <AdStepSection step="publicar" activeStep={step}>
          <div className="space-y-4">
            <CatalogSection
              title="Revise antes de salvar"
              hint="Tudo que você preencheu aparece no anúncio."
            >
              <ul className="grid grid-cols-2 gap-2">
                {checklist.map((item) => (
                  <li
                    key={item.label}
                    className={`flex items-center gap-2 rounded-2xl px-3 py-2 text-xs ${
                      item.ready
                        ? "bg-primary/10 text-primary"
                        : "bg-secondary/60 text-muted-foreground"
                    }`}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    {item.label}
                  </li>
                ))}
              </ul>
            </CatalogSection>

            <CatalogSection title="Visibilidade">
              <CatalogField label="Quem pode ver">
                <select
                  value={visibility}
                  onChange={(event) => setVisibility(event.target.value as CatalogVisibilityValue)}
                  data-catalog-field="visibility"
                  className={catalogInputClass}
                >
                  {CATALOG_VISIBILITY_OPTIONS.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </CatalogField>
            </CatalogSection>

            <p className="text-xs leading-relaxed text-muted-foreground">
              {LOCAL_CATALOG_DISCLAIMER}
            </p>
            <PublisherSubmitButton
              onClick={() => void handlePublish()}
              publishing={saving}
              label="Salvar no catálogo local"
            />
          </div>
        </AdStepSection>
      </div>
    </AdCreateShell>
  );
}
