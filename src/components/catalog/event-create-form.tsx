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
import { CatalogTagPicker } from "@/components/catalog/catalog-hours-editor";
import { LiveAdPreview, type LiveAdPreviewModel } from "@/components/catalog/live-ad-preview";
import { PublisherSubmitButton } from "@/components/publisher/PublisherSubmitButton";
import { applyCatalogAssistSuggestion } from "@/lib/catalog/apply-catalog-assist";
import {
  CATALOG_VISIBILITY_OPTIONS,
  CatalogVisibility,
  EVENT_CATEGORIES,
  EVENT_FEATURE_TAGS,
  type CatalogVisibilityValue,
} from "@/lib/catalog/catalog-options";
import {
  CatalogKind,
  LOCAL_CATALOG_DISCLAIMER,
  createCatalogEvent,
  listCatalogByKind,
} from "@/lib/catalog/local-catalog";
import { getAllBusinesses } from "@/lib/marketplace/mock-businesses";
import { places } from "@/lib/mock-data";
import type { MediaFile } from "@/lib/upload";

function dateValue(daysAhead: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function EventCreateForm() {
  const navigate = useNavigate();
  const [step, setStep] = useState<AdCreateStepId>(INITIAL_AD_CREATE_STEP);
  const [lastEditStep, setLastEditStep] = useState<AdCreateStepId>(INITIAL_AD_CREATE_STEP);
  const [template, setTemplate] = useState<AdTemplateId>(DEFAULT_AD_TEMPLATE);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>(EVENT_CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState(() => dateValue(7));
  const [endDate, setEndDate] = useState(() => dateValue(7));
  const [startTime, setStartTime] = useState("20:00");
  const [endTime, setEndTime] = useState("23:00");
  const [placeId, setPlaceId] = useState("");
  const [location, setLocation] = useState("");
  const [address, setAddress] = useState("");
  const [reference, setReference] = useState("");
  const [businessId, setBusinessId] = useState("");
  const [capacity, setCapacity] = useState("");
  const [free, setFree] = useState(true);
  const [price, setPrice] = useState("");
  const [rules, setRules] = useState("");
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [visibility, setVisibility] = useState<CatalogVisibilityValue>(CatalogVisibility.PUBLIC);
  const [cover, setCover] = useState<MediaFile[]>([]);
  const [gallery, setGallery] = useState<MediaFile[]>([]);
  const [saving, setSaving] = useState(false);

  const placeOptions = useMemo(
    () => [
      ...listCatalogByKind(CatalogKind.PLACE).map((item) => ({
        id: item.id,
        name: item.name,
        address: item.address,
        lat: item.lat,
        lng: item.lng,
      })),
      ...places.map((item) => ({
        id: item.id,
        name: item.name,
        address: item.address ?? item.name,
        lat: item.lat,
        lng: item.lng,
      })),
    ],
    [],
  );
  const businessOptions = useMemo(() => {
    const owned = listCatalogByKind(CatalogKind.BUSINESS).map((item) => ({
      id: item.id,
      name: item.name,
    }));
    const ownedIds = new Set(owned.map((item) => item.id));
    const fixtures = getAllBusinesses()
      .filter((item) => !ownedIds.has(item.id))
      .map((item) => ({ id: item.id, name: item.name }));
    return [...owned, ...fixtures];
  }, []);

  const previewModel = useMemo<LiveAdPreviewModel>(
    () => ({
      kind: "evento",
      template,
      title,
      category,
      description,
      imageUrl: cover[0]?.preview,
      location: (location || address).trim() || undefined,
      offer: free ? "Gratuito" : price ? `R$ ${price}` : undefined,
      offerPlaceholder: "Informe o valor da entrada",
      tags,
      date: startDate,
      time: startTime,
      endTime,
      ctaLabel: "Quero ir",
    }),
    [
      address,
      category,
      cover,
      description,
      endTime,
      free,
      location,
      price,
      startDate,
      startTime,
      tags,
      template,
      title,
    ],
  );

  function selectPlace(id: string) {
    setPlaceId(id);
    const place = placeOptions.find((item) => item.id === id);
    if (!place) return;
    setLocation(place.name);
    setAddress(place.address);
  }

  async function handlePublish() {
    setSaving(true);
    try {
      const photos = await mediaToDataUrls(cover, 1);
      const extra = await mediaToDataUrls(gallery, 4);
      const entity = createCatalogEvent({
        title,
        category,
        description,
        location: location || address,
        address,
        reference,
        placeId: placeId || undefined,
        businessId: businessId || undefined,
        startAt: `${startDate}T${startTime}`,
        endAt: `${endDate}T${endTime}`,
        capacity: capacity ? Number(capacity) : undefined,
        free,
        price: free ? undefined : price ? Number(price) : undefined,
        rules,
        notes,
        tags,
        visibility,
        photo: photos[0],
        gallery: extra,
        lat: placeOptions.find((item) => item.id === placeId)?.lat,
        lng: placeOptions.find((item) => item.id === placeId)?.lng,
      });
      toast.success("Evento salvo no catálogo local.");
      navigate({ to: "/event/$eventId", params: { eventId: entity.id } });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  }

  const checklist = [
    { label: "Nome", ready: title.trim().length > 0 },
    { label: "Categoria", ready: category.length > 0 },
    { label: "Descrição", ready: description.trim().length > 0 },
    { label: "Data e horário", ready: Boolean(startDate && startTime) },
    { label: "Local", ready: Boolean((location || address).trim()) },
    { label: "Imagem principal", ready: cover.length > 0 },
  ];

  // Mesmas obrigatoriedades de `createCatalogEvent`, sem inventar regra nova:
  // ele recusa título, local e data vazios.
  const canReview = Boolean(title.trim() && (location || address).trim() && startDate && startTime);

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
              title="Identidade"
              hint="Nome, categoria e a arte que apresenta o evento."
            >
              <CatalogField label="Nome">
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
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
                  {EVENT_CATEGORIES.map((item) => (
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

            <CatalogSection title="Informações adicionais">
              <CatalogField label="Regras">
                <textarea
                  value={rules}
                  onChange={(event) => setRules(event.target.value)}
                  data-catalog-field="rules"
                  rows={2}
                  className={catalogAreaClass}
                />
              </CatalogField>
              <CatalogField label="Observações">
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  data-catalog-field="notes"
                  rows={2}
                  className={catalogAreaClass}
                />
              </CatalogField>
              <CatalogTagPicker options={EVENT_FEATURE_TAGS} value={tags} onChange={setTags} />
            </CatalogSection>
          </div>
        </AdStepSection>

        <AdStepSection step="localizacao" activeStep={step}>
          <CatalogSection title="Local" hint="Use um local já cadastrado ou informe o endereço.">
            <CatalogField label="Local existente">
              <select
                value={placeId}
                onChange={(event) => selectPlace(event.target.value)}
                data-catalog-field="placeId"
                className={catalogInputClass}
              >
                <option value="">Informar local</option>
                {placeOptions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </CatalogField>
            <CatalogField label="Nome do local">
              <input
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                data-catalog-field="location"
                className={catalogInputClass}
              />
            </CatalogField>
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
            <CatalogField label="Negócio organizador">
              <select
                value={businessId}
                onChange={(event) => setBusinessId(event.target.value)}
                data-catalog-field="businessId"
                className={catalogInputClass}
              >
                <option value="">Nenhum</option>
                {businessOptions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </CatalogField>
          </CatalogSection>
        </AdStepSection>

        <AdStepSection step="ofertas" activeStep={step}>
          <div className="space-y-4">
            <CatalogSection
              title="Data e horário"
              hint="Serve para algumas horas, um dia ou vários dias."
            >
              <div className="grid grid-cols-2 gap-3">
                <CatalogField label="Início">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(event) => setStartDate(event.target.value)}
                    data-catalog-field="startDate"
                    className={catalogInputClass}
                  />
                </CatalogField>
                <CatalogField label="Término">
                  <input
                    type="date"
                    value={endDate}
                    onChange={(event) => setEndDate(event.target.value)}
                    data-catalog-field="endDate"
                    className={catalogInputClass}
                  />
                </CatalogField>
                <CatalogField label="Horário inicial">
                  <input
                    type="time"
                    value={startTime}
                    onChange={(event) => setStartTime(event.target.value)}
                    data-catalog-field="startTime"
                    className={catalogInputClass}
                  />
                </CatalogField>
                <CatalogField label="Horário final">
                  <input
                    type="time"
                    value={endTime}
                    onChange={(event) => setEndTime(event.target.value)}
                    data-catalog-field="endTime"
                    className={catalogInputClass}
                  />
                </CatalogField>
              </div>
            </CatalogSection>

            <CatalogSection title="Participação">
              <CatalogField label="Capacidade">
                <input
                  type="number"
                  min="1"
                  value={capacity}
                  onChange={(event) => setCapacity(event.target.value)}
                  data-catalog-field="capacity"
                  className={catalogInputClass}
                />
              </CatalogField>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={free}
                  onChange={(event) => setFree(event.target.checked)}
                  data-catalog-field="free"
                />
                Gratuito
              </label>
              {free ? null : (
                <CatalogField label="Preço">
                  <input
                    type="number"
                    min="0"
                    value={price}
                    onChange={(event) => setPrice(event.target.value)}
                    data-catalog-field="price"
                    className={catalogInputClass}
                  />
                </CatalogField>
              )}
            </CatalogSection>
          </div>
        </AdStepSection>

        <AdStepSection step="midia" activeStep={step}>
          <CatalogSection
            title="Mídia"
            hint="A imagem principal é a primeira coisa que aparece no anúncio."
          >
            <CatalogImageFields
              cover={cover}
              gallery={gallery}
              onCoverChange={setCover}
              onGalleryChange={setGallery}
              coverLabel="Imagem principal"
              galleryLabel="Galeria"
            />
          </CatalogSection>
        </AdStepSection>

        <AdStepSection step="modelos" activeStep={step}>
          <CatalogSection
            title="Modelo do anúncio"
            hint="Escolha como o seu evento aparece no Connexy."
          >
            <AdTemplateSelector value={template} onChange={setTemplate} />
          </CatalogSection>
        </AdStepSection>

        <AdStepSection step="preview" activeStep={step}>
          <div className="space-y-4">
            <CatalogSection
              title="Conferir evento"
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
                kind="event"
                context={{
                  title,
                  description,
                  category,
                  location: location || address,
                  extra: rules,
                }}
                onApply={(suggestion) => {
                  const next = applyCatalogAssistSuggestion({ title, description, tags }, suggestion);
                  setTitle(next.title ?? title);
                  setDescription(next.description ?? description);
                  if (next.tags)
                    setTags(
                      next.tags.filter((tag) =>
                        (EVENT_FEATURE_TAGS as readonly string[]).includes(tag),
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
