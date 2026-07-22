import {
  type Recommendation,
  type EngineUser,
  RecommendationType,
} from "./engine-types";

export function getChatSuggestions(
  recs: Recommendation[],
  user: EngineUser,
): Recommendation[] {
  return recs
    .filter(
      (r) =>
        r.type === RecommendationType.PERSON &&
        r.metadata.kind === "person" &&
        r.metadata.isOnline &&
        r.score.total >= 50,
    )
    .sort((a, b) => {
      const aMeta = a.metadata.kind === "person" ? a.metadata : null;
      const bMeta = b.metadata.kind === "person" ? b.metadata : null;
      if (!aMeta || !bMeta) return 0;
      return bMeta.compatibilityPercent - aMeta.compatibilityPercent;
    });
}

export function getConversationStarters(person: Recommendation): string[] {
  const meta = person.metadata.kind === "person" ? person.metadata : null;
  if (!meta) return [];

  const starters: string[] = [];

  starters.push(
    `Oi! Vi que você também curte um bom rolê. Topa trocar uma ideia?`,
  );

  if (meta.compatibilityPercent >= 80) {
    starters.push(
      `Nossa, temos um baita match! Curte os mesmos rolês, né?`,
    );
  }

  if (meta.mutualConnections > 0) {
    starters.push(
      `Temos ${meta.mutualConnections} conex(ões) em comum! Bora conversar?`,
    );
  }

  if (meta.profession) {
    starters.push(
      `Vi que você é ${meta.profession}. Massa! Me conta mais sobre isso.`,
    );
  }

  starters.push(
    `E aí, já foi em algum evento recentemente? Quero novidades!`,
  );

  return starters.slice(0, 5);
}

export function getSmartReplies(context: string): string[] {
  if (context.includes("evento") || context.includes("Evento")) {
    return [
      "Bora!",
      "Que demais! Horário?",
      "Tô dentro!",
      "Manda a localização",
      "Já fui lá, é show!",
    ];
  }

  if (context.includes("rolê") || context.includes("sair")) {
    return [
      "Topo!",
      "Bora sim!",
      "Onde é?",
      "Horário tá bom pra mim",
      "Leva mais gente!",
    ];
  }

  if (context.includes("oferta") || context.includes("desconto")) {
    return [
      "Show de bola!",
      "Vou aproveitar!",
      "Tem mais?",
      "Obrigado pela dica!",
      "Manda o link",
    ];
  }

  return [
    "Legal!",
    "Concordo!",
    "Valeu!",
    "Show!",
    "Bora!",
  ];
}

export function shouldSuggestChat(rec: Recommendation): boolean {
  if (rec.type !== RecommendationType.PERSON) return false;
  if (rec.metadata.kind !== "person") return false;

  return rec.score.total >= 70 && rec.metadata.isOnline;
}
