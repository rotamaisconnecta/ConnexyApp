export type AdCreateStepId =
  | "informacoes"
  | "localizacao"
  | "ofertas"
  | "midia"
  | "modelos"
  | "preview"
  | "publicar";

export type AdCreateStepMeta = {
  id: AdCreateStepId;
  label: string;
};

export const AD_CREATE_STEPS: readonly AdCreateStepMeta[] = [
  { id: "informacoes", label: "Informações" },
  { id: "localizacao", label: "Localização" },
  { id: "ofertas", label: "Ofertas" },
  { id: "midia", label: "Mídia" },
  { id: "modelos", label: "Modelos" },
  { id: "preview", label: "Conferir" },
  { id: "publicar", label: "Publicar" },
];

export const INITIAL_AD_CREATE_STEP: AdCreateStepId = "informacoes";

export function getAdCreateStepIndex(id: AdCreateStepId): number {
  return AD_CREATE_STEPS.findIndex((step) => step.id === id);
}

/**
 * Etapas de saída do preenchimento. A prévia é a conferência final: só é
 * liberada quando os campos obrigatórios já são válidos, e é onde a IA aparece.
 */
export function isReviewStep(id: AdCreateStepId): boolean {
  return id === "preview" || id === "publicar";
}
