import type { ReelCategoryValue, ReelActionTypeValue } from "./reel-types";
import { ReelActionType, ReelCategory } from "./reel-types";

const CATEGORY_ACTIONS: Record<ReelCategoryValue, ReelActionTypeValue[]> = {
  PERSON: [
    ReelActionType.LIKE,
    ReelActionType.COMMENT,
    ReelActionType.SHARE,
    ReelActionType.CONNECT,
    ReelActionType.FOLLOW,
    ReelActionType.OPEN_PROFILE,
  ],
  BUSINESS: [
    ReelActionType.LIKE,
    ReelActionType.COMMENT,
    ReelActionType.SHARE,
    ReelActionType.OPEN_BUSINESS,
    ReelActionType.VIEW_OFFERS,
    ReelActionType.CONNECT,
  ],
  EVENT: [
    ReelActionType.LIKE,
    ReelActionType.COMMENT,
    ReelActionType.SHARE,
    ReelActionType.OPEN_EVENT,
    ReelActionType.ATTENDING,
    ReelActionType.INTEREST,
  ],
  PLACE: [
    ReelActionType.LIKE,
    ReelActionType.COMMENT,
    ReelActionType.SHARE,
    ReelActionType.OPEN_PLACE,
    ReelActionType.CHECK_IN,
  ],
  OFFER: [
    ReelActionType.LIKE,
    ReelActionType.COMMENT,
    ReelActionType.SHARE,
    ReelActionType.SAVE,
    ReelActionType.VIEW_OFFERS,
  ],
  DRIVER: [
    ReelActionType.LIKE,
    ReelActionType.COMMENT,
    ReelActionType.SHARE,
    ReelActionType.REQUEST_RIDE,
    ReelActionType.OPEN_CHAT,
  ],
  NETWORKING: [
    ReelActionType.LIKE,
    ReelActionType.COMMENT,
    ReelActionType.SHARE,
    ReelActionType.CONNECT,
    ReelActionType.OPEN_CHAT,
    ReelActionType.OPEN_PROFILE,
  ],
  TRAVEL: [
    ReelActionType.LIKE,
    ReelActionType.COMMENT,
    ReelActionType.SHARE,
    ReelActionType.OPEN_PLACE,
    ReelActionType.CHECK_IN,
    ReelActionType.SAVE,
  ],
  MOMENT: [ReelActionType.LIKE, ReelActionType.COMMENT, ReelActionType.SHARE, ReelActionType.SAVE],
};

const ACTION_LABELS: Record<ReelActionTypeValue, string> = {
  [ReelActionType.LIKE]: "Curtir",
  [ReelActionType.COMMENT]: "Comentar",
  [ReelActionType.SHARE]: "Partilhar",
  [ReelActionType.SAVE]: "Guardar",
  [ReelActionType.FOLLOW]: "Seguir",
  [ReelActionType.CONNECT]: "Conectar",
  [ReelActionType.OPEN_CHAT]: "Abrir Chat",
  [ReelActionType.OPEN_PROFILE]: "Ver Perfil",
  [ReelActionType.OPEN_BUSINESS]: "Ver Empresa",
  [ReelActionType.OPEN_EVENT]: "Ver Evento",
  [ReelActionType.OPEN_PLACE]: "Ver Local",
  [ReelActionType.REQUEST_RIDE]: "Pedir Viagem",
  [ReelActionType.CHECK_IN]: "Check-in",
  [ReelActionType.INTEREST]: "Interessado",
  [ReelActionType.ATTENDING]: "Participar",
  [ReelActionType.VIEW_OFFERS]: "Ver Ofertas",
};

const ACTION_ICONS: Record<ReelActionTypeValue, string> = {
  [ReelActionType.LIKE]: "heart",
  [ReelActionType.COMMENT]: "message-circle",
  [ReelActionType.SHARE]: "share-2",
  [ReelActionType.SAVE]: "bookmark",
  [ReelActionType.FOLLOW]: "user-plus",
  [ReelActionType.CONNECT]: "link",
  [ReelActionType.OPEN_CHAT]: "message-square",
  [ReelActionType.OPEN_PROFILE]: "user",
  [ReelActionType.OPEN_BUSINESS]: "building",
  [ReelActionType.OPEN_EVENT]: "calendar",
  [ReelActionType.OPEN_PLACE]: "map-pin",
  [ReelActionType.REQUEST_RIDE]: "car",
  [ReelActionType.CHECK_IN]: "check-circle",
  [ReelActionType.INTEREST]: "star",
  [ReelActionType.ATTENDING]: "users",
  [ReelActionType.VIEW_OFFERS]: "tag",
};

const AUTH_REQUIRED: ReelActionTypeValue[] = [
  ReelActionType.LIKE,
  ReelActionType.COMMENT,
  ReelActionType.SAVE,
  ReelActionType.FOLLOW,
  ReelActionType.CONNECT,
  ReelActionType.OPEN_CHAT,
  ReelActionType.REQUEST_RIDE,
  ReelActionType.CHECK_IN,
  ReelActionType.INTEREST,
  ReelActionType.ATTENDING,
];

export function getCategoryActions(cat: ReelCategoryValue): ReelActionTypeValue[] {
  return CATEGORY_ACTIONS[cat] ?? CATEGORY_ACTIONS[ReelCategory.PERSON];
}

export function getActionLabel(action: ReelActionTypeValue): string {
  return ACTION_LABELS[action] ?? action;
}

export function getActionIcon(action: ReelActionTypeValue): string {
  return ACTION_ICONS[action] ?? "circle";
}

export function canPerformAction(action: ReelActionTypeValue, isLoggedIn: boolean): boolean {
  if (!isLoggedIn && AUTH_REQUIRED.includes(action)) return false;
  return true;
}
