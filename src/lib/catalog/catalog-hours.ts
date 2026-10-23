import { DayOfWeek, type BusinessHoursSlot, type DayOfWeekValue } from "@/lib/marketplace/business-types";

export const DAY_ORDER: DayOfWeekValue[] = [
  DayOfWeek.MON,
  DayOfWeek.TUE,
  DayOfWeek.WED,
  DayOfWeek.THU,
  DayOfWeek.FRI,
  DayOfWeek.SAT,
  DayOfWeek.SUN,
];

export const DAY_LABELS: Record<DayOfWeekValue, string> = {
  [DayOfWeek.MON]: "Segunda",
  [DayOfWeek.TUE]: "Terça",
  [DayOfWeek.WED]: "Quarta",
  [DayOfWeek.THU]: "Quinta",
  [DayOfWeek.FRI]: "Sexta",
  [DayOfWeek.SAT]: "Sábado",
  [DayOfWeek.SUN]: "Domingo",
};

const DAY_SHORT: Record<DayOfWeekValue, string> = {
  [DayOfWeek.MON]: "Seg",
  [DayOfWeek.TUE]: "Ter",
  [DayOfWeek.WED]: "Qua",
  [DayOfWeek.THU]: "Qui",
  [DayOfWeek.FRI]: "Sex",
  [DayOfWeek.SAT]: "Sáb",
  [DayOfWeek.SUN]: "Dom",
};

export function createEmptyHours(closed = true): BusinessHoursSlot[] {
  return DAY_ORDER.map((day) => ({
    day,
    open: closed ? "" : "09:00",
    close: closed ? "" : "18:00",
    closed,
  }));
}

export function createDefaultBusinessHours(): BusinessHoursSlot[] {
  return DAY_ORDER.map((day) => {
    if (day === DayOfWeek.SUN) {
      return { day, open: "10:00", close: "20:00" };
    }
    if (day === DayOfWeek.SAT) {
      return { day, open: "10:00", close: "23:00" };
    }
    if (day === DayOfWeek.FRI) {
      return { day, open: "08:00", close: "23:00" };
    }
    return { day, open: "08:00", close: "22:00" };
  });
}

export function normalizeHoursSlots(slots: BusinessHoursSlot[] | undefined): BusinessHoursSlot[] {
  const byDay = new Map((slots ?? []).map((slot) => [slot.day, slot]));
  return DAY_ORDER.map((day) => {
    const slot = byDay.get(day);
    if (!slot) return { day, open: "", close: "", closed: true };
    const closed = Boolean(slot.closed) || !slot.open || !slot.close;
    return {
      day,
      open: closed ? "" : slot.open,
      close: closed ? "" : slot.close,
      closed,
    };
  });
}

export function formatHoursSummary(
  slots: BusinessHoursSlot[] | undefined,
  hasHours = true,
): string {
  if (!hasHours) return "Horário não informado";
  const open = normalizeHoursSlots(slots).filter((slot) => !slot.closed && slot.open && slot.close);
  if (open.length === 0) return "Horário não informado";
  const first = open[0];
  if (open.length === 7 && open.every((slot) => slot.open === first.open && slot.close === first.close)) {
    return `Todos os dias ${first.open}–${first.close}`;
  }
  return open.map((slot) => `${DAY_SHORT[slot.day]} ${slot.open}–${slot.close}`).join(" · ");
}

export function isHoursOpenNow(slots: BusinessHoursSlot[] | undefined): boolean {
  const normalized = normalizeHoursSlots(slots);
  if (normalized.every((slot) => slot.closed)) return false;
  const weekday = new Date().getDay();
  const today = DAY_ORDER[weekday === 0 ? 6 : weekday - 1];
  const slot = normalized.find((item) => item.day === today);
  return Boolean(slot && !slot.closed);
}
