export type PaymentOption = "pix" | "dinheiro";

export type FlowState =
  | "solicitar"
  | "rota"
  | "embarque"
  | "categoria"
  | "buscando"
  | "encontrado"
  | "chegando"
  | "chegou"
  | "emviagem"
  | "parada"
  | "chegada"
  | "avaliacao"
  | "conclusao";
