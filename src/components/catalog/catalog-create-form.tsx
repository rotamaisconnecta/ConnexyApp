import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { PublisherHeader } from "@/components/publisher/PublisherHeader";
import { PublisherLayout } from "@/components/publisher/PublisherLayout";
import { PublisherSubmitButton } from "@/components/publisher/PublisherSubmitButton";
import {
  CatalogKind,
  createCatalogBusiness,
  createCatalogEvent,
  createCatalogOffer,
  createCatalogPlace,
  listCatalogByKind,
  LOCAL_CATALOG_DISCLAIMER,
  type CatalogKindValue,
} from "@/lib/catalog/local-catalog";
import { getAllBusinesses } from "@/lib/marketplace/mock-businesses";
import { BUSINESS_CATEGORY_OPTIONS } from "@/lib/marketplace/business-types";

const PLACE_CATEGORIES = ["Restaurantes", "Cafés", "Eventos", "Lojas"] as const;

interface CatalogCreateFormProps {
  kind: CatalogKindValue;
  title: string;
}

function defaultDateTimeValue(daysAhead: number, hour: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  date.setHours(hour, 0, 0, 0);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function defaultDateValue(daysAhead: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function CatalogCreateForm({ kind, title }: CatalogCreateFormProps) {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState<string>(
    kind === CatalogKind.PLACE ? PLACE_CATEGORIES[0] : BUSINESS_CATEGORY_OPTIONS[0].value,
  );
  const [startAt, setStartAt] = useState(() => defaultDateTimeValue(7, 20));
  const [capacity, setCapacity] = useState("");
  const [price, setPrice] = useState("");
  const [hours, setHours] = useState("");
  const [discountValue, setDiscountValue] = useState("10");
  const [validUntil, setValidUntil] = useState(() => defaultDateValue(30));
  const [businessId, setBusinessId] = useState(() => getAllBusinesses()[0]?.id ?? "");
  const [saving, setSaving] = useState(false);

  const businessOptions = useMemo(() => {
    const owned = listCatalogByKind(CatalogKind.BUSINESS);
    const fixtures = getAllBusinesses().filter(
      (business) => !owned.some((item) => item.id === business.id),
    );
    return [
      ...owned.map((item) => ({ id: item.id, name: item.name })),
      ...fixtures.map((item) => ({ id: item.id, name: item.name })),
    ];
  }, []);

  async function handlePublish() {
    setSaving(true);
    try {
      if (kind === CatalogKind.EVENT) {
        const entity = createCatalogEvent({
          title: name,
          description,
          location,
          startAt,
          endAt: startAt,
          capacity: capacity ? Number(capacity) : undefined,
          price: price ? Number(price) : undefined,
        });
        toast.success("Evento salvo no catálogo local.");
        navigate({ to: "/event/$eventId", params: { eventId: entity.id } });
        return;
      }
      if (kind === CatalogKind.PLACE) {
        const entity = createCatalogPlace({
          name,
          category,
          address: location,
          description,
          hours,
        });
        toast.success("Local salvo no catálogo local.");
        navigate({ to: "/local/$id", params: { id: entity.id } });
        return;
      }
      if (kind === CatalogKind.BUSINESS) {
        const entity = createCatalogBusiness({
          name,
          category: category as (typeof BUSINESS_CATEGORY_OPTIONS)[number]["value"],
          address: location,
          description,
        });
        toast.success("Negócio salvo no catálogo local.");
        navigate({ to: "/business/$businessId", params: { businessId: entity.id } });
        return;
      }
      const hostId = businessId || businessOptions[0]?.id;
      if (!hostId) {
        toast.error("Cadastre um negócio antes de criar a oferta.");
        return;
      }
      createCatalogOffer({
        businessId: hostId,
        title: name,
        description,
        discountValue: Number(discountValue),
        validUntil: `${validUntil}T23:59:00`,
      });
      toast.success("Oferta salva no catálogo local.");
      navigate({ to: "/marketplace" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  }

  const nameLabel = kind === CatalogKind.EVENT || kind === CatalogKind.OFFER ? "Título" : "Nome";
  const locationLabel = kind === CatalogKind.EVENT ? "Local" : "Endereço";

  return (
    <PublisherLayout>
      <PublisherHeader title={title} onPublish={() => void handlePublish()} publishing={saving} />
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 space-y-3">
        <label className="block text-xs font-semibold text-muted-foreground">
          {nameLabel}
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            data-catalog-field="name"
            className="mt-1 h-11 w-full rounded-2xl border border-border bg-surface px-3 text-sm"
          />
        </label>
        <label className="block text-xs font-semibold text-muted-foreground">
          Descrição
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            data-catalog-field="description"
            rows={3}
            className="mt-1 w-full rounded-2xl border border-border bg-surface px-3 py-2 text-sm"
          />
        </label>
        {kind !== CatalogKind.OFFER && (
          <label className="block text-xs font-semibold text-muted-foreground">
            {locationLabel}
            <input
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              data-catalog-field="location"
              className="mt-1 h-11 w-full rounded-2xl border border-border bg-surface px-3 text-sm"
            />
          </label>
        )}
        {kind === CatalogKind.PLACE && (
          <label className="block text-xs font-semibold text-muted-foreground">
            Categoria
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              data-catalog-field="category"
              className="mt-1 h-11 w-full rounded-2xl border border-border bg-surface px-3 text-sm"
            >
              {PLACE_CATEGORIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
        )}
        {kind === CatalogKind.BUSINESS && (
          <label className="block text-xs font-semibold text-muted-foreground">
            Categoria
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              data-catalog-field="category"
              className="mt-1 h-11 w-full rounded-2xl border border-border bg-surface px-3 text-sm"
            >
              {BUSINESS_CATEGORY_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
        )}
        {kind === CatalogKind.PLACE && (
          <label className="block text-xs font-semibold text-muted-foreground">
            Horário
            <input
              value={hours}
              onChange={(event) => setHours(event.target.value)}
              data-catalog-field="hours"
              placeholder="Aberto até 22:00"
              className="mt-1 h-11 w-full rounded-2xl border border-border bg-surface px-3 text-sm"
            />
          </label>
        )}
        {kind === CatalogKind.EVENT && (
          <>
            <label className="block text-xs font-semibold text-muted-foreground">
              Data e hora
              <input
                type="datetime-local"
                value={startAt}
                onChange={(event) => setStartAt(event.target.value)}
                data-catalog-field="startAt"
                className="mt-1 h-11 w-full rounded-2xl border border-border bg-surface px-3 text-sm"
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-xs font-semibold text-muted-foreground">
                Capacidade
                <input
                  type="number"
                  min="1"
                  value={capacity}
                  onChange={(event) => setCapacity(event.target.value)}
                  data-catalog-field="capacity"
                  className="mt-1 h-11 w-full rounded-2xl border border-border bg-surface px-3 text-sm"
                />
              </label>
              <label className="block text-xs font-semibold text-muted-foreground">
                Preço
                <input
                  type="number"
                  min="0"
                  value={price}
                  onChange={(event) => setPrice(event.target.value)}
                  data-catalog-field="price"
                  className="mt-1 h-11 w-full rounded-2xl border border-border bg-surface px-3 text-sm"
                />
              </label>
            </div>
          </>
        )}
        {kind === CatalogKind.OFFER && (
          <>
            <label className="block text-xs font-semibold text-muted-foreground">
              Negócio
              <select
                value={businessId}
                onChange={(event) => setBusinessId(event.target.value)}
                data-catalog-field="businessId"
                className="mt-1 h-11 w-full rounded-2xl border border-border bg-surface px-3 text-sm"
              >
                {businessOptions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-semibold text-muted-foreground">
              Desconto (%)
              <input
                type="number"
                min="1"
                max="90"
                value={discountValue}
                onChange={(event) => setDiscountValue(event.target.value)}
                data-catalog-field="discount"
                className="mt-1 h-11 w-full rounded-2xl border border-border bg-surface px-3 text-sm"
              />
            </label>
            <label className="block text-xs font-semibold text-muted-foreground">
              Válida até
              <input
                type="date"
                value={validUntil}
                onChange={(event) => setValidUntil(event.target.value)}
                data-catalog-field="validUntil"
                className="mt-1 h-11 w-full rounded-2xl border border-border bg-surface px-3 text-sm"
              />
            </label>
          </>
        )}
        <p className="text-xs leading-relaxed text-muted-foreground">{LOCAL_CATALOG_DISCLAIMER}</p>
        <PublisherSubmitButton
          onClick={() => void handlePublish()}
          publishing={saving}
          label="Salvar no catálogo local"
        />
      </div>
    </PublisherLayout>
  );
}
