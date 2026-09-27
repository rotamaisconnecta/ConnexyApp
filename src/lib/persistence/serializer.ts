/* =========================================================
   serializer.ts — Serialização padrão da camada de persistência
   local (Fase 1C-1).

   O armazenamento padrão é JSON puro: valores são reduzidos a
   representações parseáveis de JSON, garantindo que funções,
   referências React, objetos de UI, Maps/Sets e valores em
   falta sejam descartados ou convertidos. Isso torna qualquer
   valor gravado previsível e legível por outras camadas.

   Limitações documentadas (prompt §7): Blob, File, Buffer, Map,
   Set, Date (vira string ISO), BigInt e referências circulares
   NÃO são suportados pelo serializador padrão. Dados binários
   (ex.: mídia de Reels) continuam na store própria de mídia e
   NÃO passam por esta camada nesta fase.
   ========================================================= */

import { PersistenceError, PersistenceErrorCode } from "./errors";
import type { Serializer } from "./types";

export function jsonSerializer<T>(): Serializer<T> {
  return {
    encode(value: T): T {
      try {
        return JSON.parse(JSON.stringify(value)) as T;
      } catch (error) {
        throw new PersistenceError(
          `Dado não serializável para JSON (${error instanceof Error ? error.message : String(error)})`,
          PersistenceErrorCode.SERIALIZATION,
          { cause: error },
        );
      }
    },
    decode(value: T): T {
      return value;
    },
  };
}
