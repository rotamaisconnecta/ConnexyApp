import {
  Coffee,
  Footprints,
  Ticket,
  Music,
  Plane,
  Briefcase,
  Clapperboard,
  TreePine,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { NextGestureValue, ThreadIconValue } from "@/lib/chat/mock-conversations";

export const THREAD_ICONS: Record<ThreadIconValue, LucideIcon> = {
  coffee: Coffee,
  run: Footprints,
  event: Ticket,
  music: Music,
  travel: Plane,
  work: Briefcase,
  cinema: Clapperboard,
  nature: TreePine,
};

export const GESTURE_LABELS: Record<NextGestureValue, string> = {
  reply: "Responder",
  confirm: "Confirmar",
  listen: "Ouvir",
  view_event: "Ver evento",
  resume: "Retomar",
};
