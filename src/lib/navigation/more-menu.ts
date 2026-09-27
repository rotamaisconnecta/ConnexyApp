export const MORE_MENU_ITEMS = [
  { id: "locais", label: "Locais", to: "/locais" },
  { id: "eventos", label: "Eventos", to: "/events" },
  { id: "negocios", label: "Negócios", to: "/marketplace" },
  { id: "reel", label: "Agora", to: "/reels" },
  { id: "ofertas", label: "Ofertas", to: "/marketplace" },
  { id: "gerenciar", label: "Gerenciar", to: "/gerenciar" },
] as const;

export type MoreMenuItem = (typeof MORE_MENU_ITEMS)[number];

export const MORE_MENU_LABELS: readonly MoreMenuItem["label"][] = MORE_MENU_ITEMS.map(
  (item) => item.label,
);
