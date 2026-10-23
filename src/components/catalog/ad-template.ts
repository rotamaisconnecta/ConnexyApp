export type AdTemplateId = "padrao" | "destaque" | "moderno" | "minimalista";

export type AdTemplateMeta = {
  id: AdTemplateId;
  label: string;
  hint: string;
};

export const AD_TEMPLATES: readonly AdTemplateMeta[] = [
  { id: "padrao", label: "Padrão", hint: "Clássico do Connexy" },
  { id: "destaque", label: "Destaque", hint: "Foto grande e premium" },
  { id: "moderno", label: "Moderno", hint: "Arte colorida ao lado" },
  { id: "minimalista", label: "Minimalista", hint: "Tipografia e espaço" },
];

export const DEFAULT_AD_TEMPLATE: AdTemplateId = "padrao";

export function getAdTemplateMeta(id: AdTemplateId): AdTemplateMeta {
  return AD_TEMPLATES.find((item) => item.id === id) ?? AD_TEMPLATES[0];
}
