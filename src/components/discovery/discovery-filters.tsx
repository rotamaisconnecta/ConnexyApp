import { useState } from "react";
import { motion } from "framer-motion";
import { SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { chipContainer, chipItem } from "@/components/profile/animations";
import {
  type DiscoveryFilters,
  AVAILABLE_INTERESTS,
  INITIAL_FILTERS,
} from "@/lib/discovery/discovery-types";

interface DiscoveryFiltersProps {
  filters: DiscoveryFilters;
  onChange: (filters: DiscoveryFilters) => void;
}

export function DiscoveryFiltersPanel({ filters, onChange }: DiscoveryFiltersProps) {
  const [open, setOpen] = useState(false);
  const activeCount = countActiveFilters(filters);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
          open || activeCount > 0
            ? "bg-primary/15 text-primary"
            : "bg-secondary text-muted-foreground",
        )}
      >
        <SlidersHorizontal className="h-3.5 w-3.5" />
        Filtros
        {activeCount > 0 && (
          <span className="h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] grid place-items-center">
            {activeCount}
          </span>
        )}
      </button>

      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="mt-3 rounded-2xl border border-border bg-surface p-4 space-y-4 overflow-hidden"
        >
          {/* Interests */}
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              Interesses
            </div>
            <motion.div
              variants={chipContainer}
              initial="hidden"
              animate="visible"
              className="flex flex-wrap gap-1.5"
            >
              {AVAILABLE_INTERESTS.map((interest) => {
                const active = filters.interests.includes(interest);
                return (
                  <motion.button
                    key={interest}
                    type="button"
                    variants={chipItem}
                    onClick={() => toggleInterest(filters, onChange, interest)}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors",
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-surface text-foreground hover:border-primary/40",
                    )}
                    aria-pressed={active}
                  >
                    {interest}
                  </motion.button>
                );
              })}
            </motion.div>
          </div>

          {/* Age */}
          <FilterRange
            label="Idade"
            min={18}
            max={60}
            value={filters.ageRange[1]}
            onChange={(v) => onChange({ ...filters, ageRange: [18, v] })}
            format={(v) => `${v} anos`}
          />

          {/* Distance */}
          <FilterRange
            label="Distância"
            min={100}
            max={50000}
            step={100}
            value={filters.maxDistance}
            onChange={(v) => onChange({ ...filters, maxDistance: v })}
            format={(v) => (v >= 1000 ? `${v / 1000}km` : `${v}m`)}
          />

          {/* Toggles */}
          <div className="space-y-2">
            <ToggleFilter
              label="Somente online"
              active={filters.onlineOnly}
              onChange={() => onChange({ ...filters, onlineOnly: !filters.onlineOnly })}
            />
            <ToggleFilter
              label="Com momento ativo"
              active={filters.withMoment}
              onChange={() => onChange({ ...filters, withMoment: !filters.withMoment })}
            />
          </div>

          {/* Compatibility */}
          <FilterRange
            label="Compatibilidade mínima"
            min={0}
            max={99}
            value={filters.minCompatibility}
            onChange={(v) => onChange({ ...filters, minCompatibility: v })}
            format={(v) => `${v}%`}
          />

          {/* Clear */}
          {activeCount > 0 && (
            <button
              type="button"
              onClick={() => onChange(INITIAL_FILTERS)}
              className="w-full text-xs font-semibold text-primary hover:underline"
            >
              Limpar filtros
            </button>
          )}
        </motion.div>
      )}
    </div>
  );
}

function ToggleFilter({
  label,
  active,
  onChange,
}: {
  label: string;
  active: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={cn(
        "w-full flex items-center justify-between rounded-xl border px-3 py-2.5 text-sm transition-colors",
        active
          ? "border-primary bg-accent text-primary"
          : "border-border bg-surface text-foreground",
      )}
    >
      <span className="font-medium">{label}</span>
      <span
        className={cn(
          "h-5 w-9 rounded-full relative transition-colors",
          active ? "bg-primary" : "bg-muted",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform",
            active ? "left-[18px]" : "left-0.5",
          )}
        />
      </span>
    </button>
  );
}

function FilterRange({
  label,
  min,
  max,
  step = 1,
  value,
  onChange,
  format,
}: {
  label: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (v: number) => void;
  format: (v: number) => string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] font-semibold text-muted-foreground">{label}</span>
        <span className="text-xs font-semibold text-primary">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-primary h-1.5 rounded-full bg-muted appearance-none cursor-pointer"
        aria-label={label}
      />
    </div>
  );
}

function countActiveFilters(f: DiscoveryFilters): number {
  let count = 0;
  if (f.interests.length > 0) count++;
  if (f.ageRange[0] !== 18 || f.ageRange[1] !== 60) count++;
  if (f.maxDistance !== 50000) count++;
  if (f.onlineOnly) count++;
  if (f.withMoment) count++;
  if (f.minCompatibility > 0) count++;
  return count;
}

function toggleInterest(
  filters: DiscoveryFilters,
  onChange: (f: DiscoveryFilters) => void,
  interest: string,
) {
  const exists = filters.interests.includes(interest);
  onChange({
    ...filters,
    interests: exists
      ? filters.interests.filter((i) => i !== interest)
      : [...filters.interests, interest],
  });
}
