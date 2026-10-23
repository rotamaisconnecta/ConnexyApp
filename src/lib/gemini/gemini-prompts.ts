import {
  GEMINI_CHAT_MESSAGE_CHARS,
  GEMINI_CHAT_MESSAGE_WINDOW,
  GEMINI_TEXT_LIMITS,
} from "./gemini-config";
import type {
  GeminiAdInput,
  GeminiCatalogAssistInput,
  GeminiChatTopicInput,
  GeminiChatTurn,
  GeminiIcebreakerInput,
  GeminiMediaInput,
} from "./gemini-types";
import { GeminiFeature } from "./gemini-types";

const SHARED_PERSONALITY = `Você escreve pelo Connexy, um app de proximidade e encontros reais.
Tom: natural, humano, curto, contextual, respeitoso, não invasivo, útil.
Evite formalidade excessiva, frases robóticas, textos longos, clichês e elogios exagerados.
Responda somente JSON válido. Não invente fatos.`;

export function clipText(value: string | undefined, max: number): string {
  if (!value) return "";
  const trimmed = value.replace(/\s+/g, " ").trim();
  if (trimmed.length <= max) return trimmed;
  return trimmed.slice(0, max).trim();
}

export function clipStringList(values: string[] | undefined, maxItems: number, maxChars: number): string[] {
  if (!values) return [];
  const seen = new Set<string>();
  const next: string[] = [];
  for (const value of values) {
    const clipped = clipText(value, maxChars);
    if (!clipped || seen.has(clipped.toLowerCase())) continue;
    seen.add(clipped.toLowerCase());
    next.push(clipped);
    if (next.length >= maxItems) break;
  }
  return next;
}

export function clipChatTurns(messages: GeminiChatTurn[] | undefined): GeminiChatTurn[] {
  if (!messages?.length) return [];
  const windowed = messages.slice(-GEMINI_CHAT_MESSAGE_WINDOW);
  return windowed
    .map((item) => {
      const from: GeminiChatTurn["from"] = item.from === "them" ? "them" : "me";
      return {
        from,
        text: clipText(item.text, GEMINI_CHAT_MESSAGE_CHARS),
      };
    })
    .filter((item) => item.text.length > 0);
}

export function recentTextMessagesForGemini(
  messages: Array<{ kind?: string; from?: string; text?: string }>,
): GeminiChatTurn[] {
  const texts: GeminiChatTurn[] = [];
  for (let index = messages.length - 1; index >= 0 && texts.length < GEMINI_CHAT_MESSAGE_WINDOW; index -= 1) {
    const item = messages[index];
    if (item.kind && item.kind !== "text") continue;
    const text = clipText(item.text, GEMINI_CHAT_MESSAGE_CHARS);
    if (!text) continue;
    const from: GeminiChatTurn["from"] = item.from === "them" ? "them" : "me";
    texts.unshift({
      from,
      text,
    });
  }
  return texts;
}

export function sanitizeAdInput(input: GeminiAdInput): GeminiAdInput {
  return {
    businessName: clipText(input.businessName, GEMINI_TEXT_LIMITS.name) || undefined,
    category: clipText(input.category, GEMINI_TEXT_LIMITS.category) || undefined,
    product: clipText(input.product, GEMINI_TEXT_LIMITS.product) || undefined,
    description: clipText(input.description, GEMINI_TEXT_LIMITS.description) || undefined,
    offer: clipText(input.offer, GEMINI_TEXT_LIMITS.offer) || undefined,
    audience: clipText(input.audience, GEMINI_TEXT_LIMITS.audience) || undefined,
    tone: clipText(input.tone, GEMINI_TEXT_LIMITS.tone) || undefined,
    extra: clipText(input.extra, GEMINI_TEXT_LIMITS.extra) || undefined,
  };
}

export function sanitizeIcebreakerInput(input: GeminiIcebreakerInput): GeminiIcebreakerInput {
  return {
    name: clipText(input.name, GEMINI_TEXT_LIMITS.name) || undefined,
    headline: clipText(input.headline, GEMINI_TEXT_LIMITS.headline) || undefined,
    interests: clipStringList(input.interests, GEMINI_TEXT_LIMITS.interests, GEMINI_TEXT_LIMITS.interest),
    sharedInterests: clipStringList(
      input.sharedInterests,
      GEMINI_TEXT_LIMITS.interests,
      GEMINI_TEXT_LIMITS.interest,
    ),
    notes: clipText(input.notes, GEMINI_TEXT_LIMITS.extra) || undefined,
  };
}

export function sanitizeChatTopicInput(input: GeminiChatTopicInput): GeminiChatTopicInput {
  return {
    peerName: clipText(input.peerName, GEMINI_TEXT_LIMITS.name) || undefined,
    interests: clipStringList(input.interests, GEMINI_TEXT_LIMITS.interests, GEMINI_TEXT_LIMITS.interest),
    sharedInterests: clipStringList(
      input.sharedInterests,
      GEMINI_TEXT_LIMITS.interests,
      GEMINI_TEXT_LIMITS.interest,
    ),
    intent: clipText(input.intent, GEMINI_TEXT_LIMITS.intent) || undefined,
    avoid: clipText(input.avoid, GEMINI_TEXT_LIMITS.avoid) || undefined,
    notes: clipText(input.notes, GEMINI_TEXT_LIMITS.extra) || undefined,
    messages: clipChatTurns(input.messages),
  };
}

export function sanitizeMediaInput(input: GeminiMediaInput): GeminiMediaInput {
  return {
    intent: clipText(input.intent, GEMINI_TEXT_LIMITS.intent) || undefined,
    avoid: clipText(input.avoid, GEMINI_TEXT_LIMITS.avoid) || undefined,
    notes: clipText(input.notes, GEMINI_TEXT_LIMITS.extra) || undefined,
  };
}

export function sanitizeCatalogAssistInput(input: GeminiCatalogAssistInput): GeminiCatalogAssistInput {
  const kind = input.kind === "business" || input.kind === "place" ? input.kind : "event";
  return {
    kind,
    intent: clipText(input.intent, GEMINI_TEXT_LIMITS.intent) || undefined,
    title: clipText(input.title, GEMINI_TEXT_LIMITS.name) || undefined,
    name: clipText(input.name, GEMINI_TEXT_LIMITS.name) || undefined,
    description: clipText(input.description, GEMINI_TEXT_LIMITS.description) || undefined,
    category: clipText(input.category, GEMINI_TEXT_LIMITS.category) || undefined,
    location: clipText(input.location, 120) || undefined,
    extra: clipText(input.extra, GEMINI_TEXT_LIMITS.extra) || undefined,
  };
}

function compactContext(entries: Array<[string, string | string[] | undefined]>): string {
  return entries
    .map(([key, value]) => {
      if (!value || (Array.isArray(value) && value.length === 0)) return "";
      return `${key}: ${Array.isArray(value) ? value.join(", ") : value}`;
    })
    .filter(Boolean)
    .join("\n");
}

export function buildGeminiPrompt(feature: typeof GeminiFeature.B2B_AD, input: GeminiAdInput): {
  systemInstruction: string;
  prompt: string;
};
export function buildGeminiPrompt(
  feature: typeof GeminiFeature.FIRST_CONTACT,
  input: GeminiIcebreakerInput,
): { systemInstruction: string; prompt: string };
export function buildGeminiPrompt(
  feature: typeof GeminiFeature.CHAT_TOPIC,
  input: GeminiChatTopicInput,
): { systemInstruction: string; prompt: string };
export function buildGeminiPrompt(
  feature: typeof GeminiFeature.ASSISTANT_MEDIA,
  input: GeminiMediaInput,
): { systemInstruction: string; prompt: string };
export function buildGeminiPrompt(
  feature: typeof GeminiFeature.CATALOG_ASSIST,
  input: GeminiCatalogAssistInput,
  imageCount?: number,
): { systemInstruction: string; prompt: string };
export function buildGeminiPrompt(
  feature: (typeof GeminiFeature)[keyof typeof GeminiFeature],
  input:
    | GeminiAdInput
    | GeminiIcebreakerInput
    | GeminiChatTopicInput
    | GeminiMediaInput
    | GeminiCatalogAssistInput,
  imageCount = 0,
): { systemInstruction: string; prompt: string } {
  if (feature === GeminiFeature.B2B_AD) {
    const ad = sanitizeAdInput(input as GeminiAdInput);
    return {
      systemInstruction: `${SHARED_PERSONALITY}
Tarefa: criar ou aprimorar um anúncio de estabelecimento parceiro.
Não invente preços, descontos, horários, endereço, telefone, características, disponibilidade, promoções ou benefícios que não estejam no contexto.
Se faltar informação, omita. Não publique nada.
JSON: {"title":"","shortDescription":"","body":"","callToAction":""}`,
      prompt: compactContext([
        ["Estabelecimento", ad.businessName],
        ["Categoria", ad.category],
        ["Produto/serviço", ad.product],
        ["Descrição", ad.description],
        ["Oferta informada", ad.offer],
        ["Público", ad.audience],
        ["Tom", ad.tone],
        ["Notas", ad.extra],
      ]),
    };
  }

  if (feature === GeminiFeature.FIRST_CONTACT) {
    const ice = sanitizeIcebreakerInput(input as GeminiIcebreakerInput);
    return {
      systemInstruction: `${SHARED_PERSONALITY}
Tarefa: sugerir uma primeira mensagem curta (máx. 2 frases) para um pedido de conexão.
Não seja invasivo, sexualizado, manipulativo ou ofensivo. Não finja intimidade. Não afirme fatos não informados.
A IA não envia a mensagem.
JSON: {"message":""}`,
      prompt: compactContext([
        ["Nome", ice.name],
        ["Headline", ice.headline],
        ["Interesses", ice.interests],
        ["Interesses em comum", ice.sharedInterests],
        ["Notas do usuário", ice.notes],
      ]),
    };
  }

  if (feature === GeminiFeature.ASSISTANT_MEDIA) {
    const media = sanitizeMediaInput(input as GeminiMediaInput);
    const body = compactContext([
      ["Intenção do usuário", media.intent],
      ["Notas", media.notes],
      ["Não repetir esta orientação", media.avoid],
    ]);
    return {
      systemInstruction: `${SHARED_PERSONALITY}
Tarefa: orientar a criação ou melhoria de uma mídia no Connexy.
Produza uma direção visual curta e uma legenda curta. Não invente preços, endereço, horário, promoção ou fatos não informados.
Não envie a mídia. Não publique nada. Não peça upload automático de imagem.
JSON: {"caption":"","direction":""}`,
      prompt: body || "Sugira uma direção visual e uma legenda curtas, sem inventar fatos.",
    };
  }

  if (feature === GeminiFeature.CATALOG_ASSIST) {
    const catalog = sanitizeCatalogAssistInput(input as GeminiCatalogAssistInput);
    const entity =
      catalog.kind === "business" ? "negócio" : catalog.kind === "place" ? "local" : "evento";
    const imageHint = imageCount > 0
      ? `Há ${imageCount} imagem(ns) anexada(s). Analise composição, hierarquia, legibilidade, identidade e adequação ao ${entity}.`
      : "Não há imagem anexada. Sugira apenas texto e direção visual a partir dos dados informados.";
    return {
      systemInstruction: `${SHARED_PERSONALITY}
Tarefa: ajudar a criar ou melhorar um ${entity} no Connexy. ${imageHint}
Gere sugestões úteis. Não elogie a imagem. Não gere uma nova imagem. Não publique nada.
Não invente preços, horários, endereço, telefone, capacidade, disponibilidade ou benefícios que não estejam no formulário ou visíveis na imagem.
Se o texto do formulário divergir do texto visível na imagem, não escolha silenciosamente. Informe a divergência no campo divergence.
JSON: {"suggestion":{"title":"","subtitle":"","description":"","highlights":[],"tags":[],"visualDirection":{"style":"","composition":"","typography":"","elementsToHighlight":[],"currentAssessment":"","improvements":[],"hierarchy":"","imagePrompt":""},"divergence":""}}`,
      prompt: compactContext([
        ["Tipo", entity],
        ["Intenção do usuário", catalog.intent],
        ["Título/nome informado", catalog.title || catalog.name],
        ["Descrição informada", catalog.description],
        ["Categoria", catalog.category],
        ["Local", catalog.location],
        ["Notas", catalog.extra],
        ["Imagens anexadas", imageCount > 0 ? String(imageCount) : undefined],
      ]) || "Sugira melhorias curtas sem inventar fatos.",
    };
  }

  const chat = sanitizeChatTopicInput(input as GeminiChatTopicInput);
  const transcript = (chat.messages ?? [])
    .map((item) => `${item.from === "me" ? "Eu" : chat.peerName || "Outra pessoa"}: ${item.text}`)
    .join("\n");
  const intentTask = chat.intent
    ? "O usuário informou uma intenção. Crie UMA mensagem curta que realize essa intenção."
    : "Analise só o contexto recente e crie UMA continuação natural da conversa já iniciada.";
  const body = compactContext([
    ["Intenção do usuário", chat.intent],
    ["Nome da outra pessoa", chat.peerName],
    ["Interesses públicos", chat.interests],
    ["Interesses em comum", chat.sharedInterests],
    ["Notas", chat.notes],
    ["Não repetir esta frase", chat.avoid],
    ["Mensagens recentes", transcript || undefined],
  ]);
  return {
    systemInstruction: `${SHARED_PERSONALITY}
Tarefa: ajudar o usuário a continuar uma conversa já existente. ${intentTask}
Continue o diálogo; não o reinicie com cumprimento genérico. Não invente fatos, intimidade, eventos ou interesses.
Não seja invasivo, sexualizado, manipulativo ou excessivamente formal. Não use frases prontas.
Não impersonar o usuário. Não explique a resposta. Não envie a mensagem. A sugestão deve ser editável.
JSON: {"suggestion":""}`,
    prompt: body || "Conversa já iniciada. Sugira uma mensagem curta sem inventar fatos.",
  };
}
