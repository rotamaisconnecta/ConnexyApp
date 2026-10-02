import { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  cloneNearbyFilters,
  countNearbyFilters,
  formatNearbyDistanceFilter,
  NEARBY_DISTANCE_STEPS,
  NEARBY_INTEREST_OPTIONS,
  type NearbyExploreFilterState,
  type NearbyExploreKind,
  type NearbyEventWhen,
} from "@/lib/discover/nearby-explore-filters";

export function NearbyExploreFilterButton({
  kind,
  filters,
  onApply,
  placeCategories,
  eventCategories,
  businessCategories,
}: {
  kind: NearbyExploreKind;
  filters: NearbyExploreFilterState;
  onApply: (next: NearbyExploreFilterState) => void;
  placeCategories: string[];
  eventCategories: string[];
  businessCategories: string[];
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(filters);
  const count = countNearbyFilters(filters, kind);

  function openSheet() {
    setDraft(cloneNearbyFilters(filters));
    setOpen(true);
  }

  return (
    <>
      <button
        type="button"
        onClick={openSheet}
        className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-semibold"
        aria-label="Filtro"
      >
        <SlidersHorizontal className="h-3.5 w-3.5" />
        {count > 0 ? `Filtro · ${count}` : "Filtro"}
      </button>
      {open ? (
        <div className="fixed inset-0 z-[80] flex items-end bg-black/40 p-3 sm:items-center sm:justify-center">
          <div className="max-h-[82vh] w-full max-w-md overflow-y-auto rounded-[28px] bg-surface p-4 shadow-elegant">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-base font-semibold">Filtro</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-full bg-secondary"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <DistanceControl
              value={draft.maxDistanceMeters}
              onChange={(maxDistanceMeters) => setDraft({ ...draft, maxDistanceMeters })}
            />
            {kind === "pessoas" ? (
              <PeopleFilters draft={draft} setDraft={setDraft} />
            ) : null}
            {kind === "locais" ? (
              <PlaceFilters
                draft={draft}
                setDraft={setDraft}
                categories={placeCategories}
              />
            ) : null}
            {kind === "eventos" ? (
              <EventFilters
                draft={draft}
                setDraft={setDraft}
                categories={eventCategories}
              />
            ) : null}
            {kind === "negocios" ? (
              <BusinessFilters
                draft={draft}
                setDraft={setDraft}
                categories={businessCategories}
              />
            ) : null}
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setDraft(cloneNearbyFilters())}
                className="h-11 flex-1 rounded-full border border-border text-sm font-semibold"
              >
                Limpar
              </button>
              <button
                type="button"
                onClick={() => {
                  onApply(cloneNearbyFilters(draft));
                  setOpen(false);
                }}
                className="h-11 flex-1 rounded-full bg-gradient-brand text-sm font-semibold text-white"
              >
                Aplicar filtros
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function DistanceControl({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  const index = Math.max(
    0,
    NEARBY_DISTANCE_STEPS.findIndex((step) => step >= value),
  );
  return (
    <label className="mb-4 block">
      <span className="text-xs font-semibold text-muted-foreground">Distância</span>
      <input
        type="range"
        min={0}
        max={NEARBY_DISTANCE_STEPS.length - 1}
        value={index}
        onChange={(event) => onChange(NEARBY_DISTANCE_STEPS[Number(event.target.value)] ?? 50000)}
        className="mt-2 w-full"
      />
      <span className="mt-1 block text-sm font-medium">{formatNearbyDistanceFilter(value)}</span>
    </label>
  );
}

function PeopleFilters({
  draft,
  setDraft,
}: {
  draft: NearbyExploreFilterState;
  setDraft: (next: NearbyExploreFilterState) => void;
}) {
  return (
    <div className="space-y-3">
      <label className="block">
        <span className="text-xs font-semibold text-muted-foreground">
          Idade · {draft.ageMin}–{draft.ageMax}
        </span>
        <div className="mt-2 flex gap-2">
          <input
            type="range"
            min={18}
            max={60}
            value={draft.ageMin}
            onChange={(event) =>
              setDraft({ ...draft, ageMin: Math.min(Number(event.target.value), draft.ageMax) })
            }
            className="w-full"
          />
          <input
            type="range"
            min={18}
            max={60}
            value={draft.ageMax}
            onChange={(event) =>
              setDraft({ ...draft, ageMax: Math.max(Number(event.target.value), draft.ageMin) })
            }
            className="w-full"
          />
        </div>
      </label>
      <div>
        <p className="text-xs font-semibold text-muted-foreground">Interesses</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {NEARBY_INTEREST_OPTIONS.map((interest) => {
            const active = draft.interests.includes(interest);
            return (
              <button
                key={interest}
                type="button"
                onClick={() =>
                  setDraft({
                    ...draft,
                    interests: active
                      ? draft.interests.filter((item) => item !== interest)
                      : [...draft.interests, interest],
                  })
                }
                className={cn(
                  "rounded-full px-2.5 py-1 text-[11px] font-semibold",
                  active ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground",
                )}
              >
                {interest}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function PlaceFilters({
  draft,
  setDraft,
  categories,
}: {
  draft: NearbyExploreFilterState;
  setDraft: (next: NearbyExploreFilterState) => void;
  categories: string[];
}) {
  return (
    <div className="space-y-3">
      <ChipRow
        label="Categoria"
        options={categories}
        value={draft.placeCategory}
        onChange={(placeCategory) => setDraft({ ...draft, placeCategory })}
      />
      <Toggle
        label="Aberto agora"
        active={draft.openNow}
        onClick={() => setDraft({ ...draft, openNow: !draft.openNow })}
      />
    </div>
  );
}

function EventFilters({
  draft,
  setDraft,
  categories,
}: {
  draft: NearbyExploreFilterState;
  setDraft: (next: NearbyExploreFilterState) => void;
  categories: string[];
}) {
  const options: { id: NearbyEventWhen; label: string }[] = [
    { id: "today", label: "Hoje" },
    { id: "tomorrow", label: "Amanhã" },
    { id: "now", label: "Acontecendo agora" },
  ];
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() =>
              setDraft({
                ...draft,
                eventWhen: draft.eventWhen === option.id ? "any" : option.id,
              })
            }
            className={cn(
              "rounded-full px-2.5 py-1 text-[11px] font-semibold",
              draft.eventWhen === option.id
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
      <ChipRow
        label="Categoria"
        options={categories}
        value={draft.eventCategory}
        onChange={(eventCategory) => setDraft({ ...draft, eventCategory })}
      />
    </div>
  );
}

function BusinessFilters({
  draft,
  setDraft,
  categories,
}: {
  draft: NearbyExploreFilterState;
  setDraft: (next: NearbyExploreFilterState) => void;
  categories: string[];
}) {
  return (
    <div className="space-y-3">
      <ChipRow
        label="Categoria"
        options={categories}
        value={draft.businessCategory}
        onChange={(businessCategory) => setDraft({ ...draft, businessCategory })}
      />
      <Toggle
        label="Aberto agora"
        active={draft.openNow}
        onClick={() => setDraft({ ...draft, openNow: !draft.openNow })}
      />
      <Toggle
        label="Oferta ativa"
        active={draft.hasOffer}
        onClick={() => setDraft({ ...draft, hasOffer: !draft.hasOffer })}
      />
    </div>
  );
}

function ChipRow({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  if (options.length === 0) return null;
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(value === option ? "" : option)}
            className={cn(
              "rounded-full px-2.5 py-1 text-[11px] font-semibold",
              value === option ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground",
            )}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function Toggle({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-3 py-1.5 text-xs font-semibold",
        active ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground",
      )}
    >
      {label}
    </button>
  );
}
