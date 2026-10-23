import { DAY_LABELS, DAY_ORDER } from "@/lib/catalog/catalog-hours";
import type { BusinessHoursSlot } from "@/lib/marketplace/business-types";
import { catalogInputClass } from "./catalog-form-ui";

export function CatalogHoursEditor({
  value,
  onChange,
}: {
  value: BusinessHoursSlot[];
  onChange: (next: BusinessHoursSlot[]) => void;
}) {
  function patch(day: BusinessHoursSlot["day"], next: Partial<BusinessHoursSlot>) {
    onChange(value.map((slot) => (slot.day === day ? { ...slot, ...next } : slot)));
  }

  return (
    <div className="space-y-2" data-catalog-field="hours">
      {DAY_ORDER.map((day) => {
        const slot = value.find((item) => item.day === day) ?? {
          day,
          open: "09:00",
          close: "18:00",
          closed: true,
        };
        return (
          <div key={day} className="grid grid-cols-[4.5rem_1fr] items-center gap-2">
            <span className="text-xs font-medium text-foreground">{DAY_LABELS[day]}</span>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <input
                  type="checkbox"
                  checked={Boolean(slot.closed)}
                  onChange={(event) =>
                    patch(day, {
                      closed: event.target.checked,
                      open: event.target.checked ? "" : slot.open || "09:00",
                      close: event.target.checked ? "" : slot.close || "18:00",
                    })
                  }
                />
                Fechado
              </label>
              {slot.closed ? null : (
                <>
                  <input
                    type="time"
                    aria-label={`${DAY_LABELS[day]} abre`}
                    value={slot.open}
                    onChange={(event) => patch(day, { open: event.target.value, closed: false })}
                    className={`${catalogInputClass} mt-0 h-9`}
                  />
                  <input
                    type="time"
                    aria-label={`${DAY_LABELS[day]} fecha`}
                    value={slot.close}
                    onChange={(event) => patch(day, { close: event.target.value, closed: false })}
                    className={`${catalogInputClass} mt-0 h-9`}
                  />
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function CatalogTagPicker({
  options,
  value,
  onChange,
}: {
  options: readonly string[];
  value: string[];
  onChange: (next: string[]) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2" data-catalog-field="tags">
      {options.map((tag) => {
        const selected = value.includes(tag);
        return (
          <button
            key={tag}
            type="button"
            onClick={() =>
              onChange(selected ? value.filter((item) => item !== tag) : [...value, tag])
            }
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${
              selected ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
            }`}
          >
            {tag}
          </button>
        );
      })}
    </div>
  );
}
