import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describeFiles, findLiteral, findPattern, scanSourceFiles } from "./helpers/source-scan";
import {
  DEFAULT_GEMINI_MODEL,
  GEMINI_CACHE_MAX_ENTRIES,
  GEMINI_CACHE_TTL_MS,
  GEMINI_CHAT_MESSAGE_WINDOW,
  GEMINI_USER_FALLBACK,
} from "../src/lib/gemini/gemini-config";
import {
  GeminiError,
  GeminiErrorCode,
  geminiUserMessage,
  mapGeminiHttpStatus,
} from "../src/lib/gemini/gemini-errors";
import {
  GEMINI_IMAGE_MAX_BYTES,
  GEMINI_IMAGE_MAX_COUNT,
  estimateBase64Bytes,
  fileToGeminiImage,
  normalizeGeminiImageMime,
  sanitizeGeminiImages,
  stripDataUrlPrefix,
} from "../src/lib/gemini/gemini-images";
import {
  composeAdDescription,
  composeMediaSuggestion,
  parseGeminiAd,
  parseGeminiCatalogAssist,
  parseGeminiChatTopic,
  parseGeminiIcebreaker,
  parseGeminiMedia,
} from "../src/lib/gemini/gemini-parse";
import {
  buildGeminiPrompt,
  clipChatTurns,
  recentTextMessagesForGemini,
  sanitizeAdInput,
} from "../src/lib/gemini/gemini-prompts";
import { runGeminiFeature } from "../src/lib/gemini/gemini-runtime";
import {
  readGeminiCache,
  resetGeminiUsageForTests,
  writeGeminiCache,
} from "../src/lib/gemini/gemini-usage";
import { GeminiFeature } from "../src/lib/gemini/gemini-types";
import type { GenerateTextFn } from "../src/lib/gemini/gemini-types";

const projectRoot = join(import.meta.dir, "..");

async function source(relativePath: string): Promise<string> {
  return readFile(join(projectRoot, relativePath), "utf8");
}

function jsonGenerate(payload: unknown): GenerateTextFn {
  return async () => JSON.stringify(payload);
}

beforeEach(() => {
  resetGeminiUsageForTests();
});

afterEach(() => {
  resetGeminiUsageForTests();
});

describe("gemini — cliente e fallback", () => {
  test("sucesso devolve JSON estruturado", async () => {
    const result = await runGeminiFeature(
      {
        feature: GeminiFeature.CHAT_TOPIC,
        actorId: "lucas",
        input: { peerName: "Ana", messages: [{ from: "them", text: "Oi" }] },
      },
      { generateText: jsonGenerate({ suggestion: "Qual café da região você mais gosta?" }) },
    );
    expect(result.ok).toBe(true);
    if (result.ok)
      expect(result.data).toEqual({ suggestion: "Qual café da região você mais gosta?" });
  });

  test("resposta vazia cai no fallback amigável", async () => {
    const result = await runGeminiFeature(
      { feature: GeminiFeature.CHAT_TOPIC, actorId: "lucas", input: { peerName: "Ana" } },
      { generateText: async () => "" },
    );
    expect(result).toMatchObject({ ok: false, code: GeminiErrorCode.EMPTY });
    expect(result.ok ? "" : result.error).toContain("Não foi possível gerar uma sugestão agora");
  });

  test("erro da API não vaza detalhes internos", async () => {
    const result = await runGeminiFeature(
      { feature: GeminiFeature.FIRST_CONTACT, actorId: "lucas", input: { name: "Mariana" } },
      {
        generateText: async () => {
          throw new Error("API key abc-secret failed at gateway");
        },
      },
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).not.toContain("abc-secret");
      expect(result.error).not.toContain("API key");
      expect(result.code).toBe(GeminiErrorCode.PROVIDER);
    }
  });

  test("timeout usa a mensagem amigável", async () => {
    const result = await runGeminiFeature(
      { feature: GeminiFeature.B2B_AD, actorId: "lucas", input: { businessName: "Café Central" } },
      {
        generateText: async () => {
          throw new GeminiError(GeminiErrorCode.TIMEOUT);
        },
      },
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe(GeminiErrorCode.TIMEOUT);
  });

  test("formato inválido não quebra a camada", async () => {
    const result = await runGeminiFeature(
      { feature: GeminiFeature.B2B_AD, actorId: "lucas", input: { businessName: "Café Central" } },
      { generateText: async () => "isto não é json" },
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe(GeminiErrorCode.INVALID);
  });

  test("cache evita segunda chamada Gemini para o mesmo contexto", async () => {
    let calls = 0;
    const generateText: GenerateTextFn = async () => {
      calls += 1;
      return JSON.stringify({ suggestion: "Bora marcar um café amanhã?" });
    };
    const request = {
      feature: GeminiFeature.CHAT_TOPIC,
      actorId: "lucas",
      input: { peerName: "Ana", messages: [{ from: "them", text: "Oi" }] },
    } as const;
    await runGeminiFeature(request, { generateText });
    await runGeminiFeature(request, { generateText });
    expect(calls).toBe(1);
  });

  test("rate limit impede rajada", async () => {
    const generateText = jsonGenerate({ message: "Oi, Mariana! Também curto música." });
    for (let index = 0; index < 8; index += 1) {
      const result = await runGeminiFeature(
        {
          feature: GeminiFeature.FIRST_CONTACT,
          actorId: "lucas",
          input: { name: "Mariana", notes: `n${index}` },
        },
        { generateText },
      );
      expect(result.ok).toBe(true);
    }
    const blocked = await runGeminiFeature(
      {
        feature: GeminiFeature.FIRST_CONTACT,
        actorId: "lucas",
        input: { name: "Mariana", notes: "n8" },
      },
      { generateText },
    );
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) expect(blocked.code).toBe(GeminiErrorCode.RATE_LIMIT);
  });
});

describe("gemini — B2B", () => {
  test("prompt proíbe inventar dados do negócio", () => {
    const prompt = buildGeminiPrompt(GeminiFeature.B2B_AD, {
      businessName: "Café Central",
      description: "Espresso e brunch",
    });
    expect(prompt.systemInstruction).toContain("Não invente");
    expect(prompt.systemInstruction).toContain("preços");
    expect(prompt.prompt).toContain("Café Central");
    expect(prompt.prompt).not.toContain("R$ 99");
  });

  test("sanitiza descrição longa", () => {
    const sanitized = sanitizeAdInput({ description: "x".repeat(800), extra: "y".repeat(400) });
    expect(sanitized.description?.length).toBeLessThanOrEqual(400);
    expect(sanitized.extra?.length).toBeLessThanOrEqual(200);
  });

  test("parse estruturado e composição do formulário", () => {
    const ad = parseGeminiAd(
      JSON.stringify({
        title: "Brunch no Central",
        shortDescription: "Espresso e pão de fermentação.",
        body: "Comece o fim de semana com brunch no Café Central.",
        callToAction: "Passe hoje à tarde.",
      }),
    );
    expect(ad.title).toBe("Brunch no Central");
    expect(composeAdDescription(ad)).toContain("Passe hoje à tarde.");
  });
});

describe("gemini — primeiro contato", () => {
  test("contexto mínimo e mensagem curta", async () => {
    const prompt = buildGeminiPrompt(GeminiFeature.FIRST_CONTACT, {
      name: "Mariana",
      interests: ["música", "gastronomia"],
      sharedInterests: ["música"],
    });
    expect(prompt.prompt).toContain("Mariana");
    expect(prompt.prompt).toContain("música");
    expect(prompt.systemInstruction).toContain("Não seja invasivo");
    const result = await runGeminiFeature(
      {
        feature: GeminiFeature.FIRST_CONTACT,
        actorId: "lucas",
        input: { name: "Mariana", sharedInterests: ["música"] },
      },
      {
        generateText: jsonGenerate({
          message:
            "Oi, Mariana! Vi que você também curte música. Qual estilo você mais tem ouvido?",
        }),
      },
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      const message = (result.data as { message: string }).message;
      expect(message.length).toBeLessThanOrEqual(240);
      expect(message.toLowerCase()).toContain("mariana");
    }
  });

  test("parse rejeita mensagem vazia", () => {
    expect(() => parseGeminiIcebreaker(JSON.stringify({ message: "   " }))).toThrow(GeminiError);
  });
});

describe("gemini — chat", () => {
  test("janela de mensagens é limitada", () => {
    const many = Array.from({ length: 20 }, (_, index) => ({
      kind: "text",
      from: index % 2 === 0 ? "me" : "them",
      text: `msg ${index} ${"a".repeat(200)}`,
    }));
    const clipped = recentTextMessagesForGemini(many);
    expect(clipped).toHaveLength(GEMINI_CHAT_MESSAGE_WINDOW);
    expect(clipped[0]?.text.length).toBeLessThanOrEqual(180);
    expect(clipChatTurns(clipped.concat(clipped)).length).toBe(GEMINI_CHAT_MESSAGE_WINDOW);
  });

  test("ignora mídia e devolve sugestão curta", async () => {
    const clipped = recentTextMessagesForGemini([
      { kind: "image", from: "them", text: "" },
      { kind: "text", from: "them", text: "Vamos no cinema?" },
    ]);
    expect(clipped).toEqual([{ from: "them", text: "Vamos no cinema?" }]);
    const result = await runGeminiFeature(
      {
        feature: GeminiFeature.CHAT_TOPIC,
        actorId: "lucas",
        input: { peerName: "Ana", messages: clipped },
      },
      { generateText: jsonGenerate({ suggestion: "Qual sessão te serve melhor?" }) },
    );
    expect(result.ok).toBe(true);
    if (result.ok)
      expect((result.data as { suggestion: string }).suggestion.length).toBeLessThanOrEqual(220);
  });

  test("intenção e frase a evitar entram no contexto mínimo", () => {
    const prompt = buildGeminiPrompt(GeminiFeature.CHAT_TOPIC, {
      peerName: "Ana",
      sharedInterests: ["música"],
      intent: "chamar para um café",
      avoid: "Qual café você mais gosta?",
      messages: [{ from: "them", text: "Adoro música ao vivo." }],
    });
    expect(prompt.prompt).toContain("chamar para um café");
    expect(prompt.prompt).toContain("música");
    expect(prompt.prompt).toContain("Qual café você mais gosta?");
    expect(prompt.prompt).not.toContain("senha");
    expect(prompt.systemInstruction).toContain("intenção");
    expect(prompt.systemInstruction).toContain("não o reinicie");
  });
});

describe("gemini — assistente de mídia", () => {
  test("intenção de mídia não inventa dados comerciais", () => {
    const prompt = buildGeminiPrompt(GeminiFeature.ASSISTANT_MEDIA, {
      intent: "Quero deixar essa foto mais profissional para divulgar meu restaurante.",
    });
    expect(prompt.prompt).toContain("restaurante");
    expect(prompt.systemInstruction).toContain("Não invente preços");
    expect(prompt.systemInstruction).toContain("Não envie a mídia");
  });

  test("parse devolve caption e direção", () => {
    const media = parseGeminiMedia(
      JSON.stringify({
        caption: "Jantar com luz baixa e prato em destaque.",
        direction: "Enquadre o prato de cima, com luz suave.",
      }),
    );
    expect(media.caption).toContain("prato");
    expect(composeMediaSuggestion(media)).toContain("luz suave");
  });
});

describe("gemini — invariantes de produto e segurança", () => {
  test("modelo fica centralizado e a chave não é VITE_", async () => {
    const config = await source("src/lib/gemini/gemini-config.ts");
    const client = await source("src/lib/gemini/gemini-client.server.ts");
    const envExample = await source(".env.example");
    const viteEnv = await source("src/vite-env.d.ts");
    expect(config).toContain(`"${DEFAULT_GEMINI_MODEL}"`);
    expect(client).toContain("process.env.GEMINI_API_KEY");
    expect(client).not.toContain("VITE_GEMINI");
    expect(envExample).toContain("GEMINI_API_KEY=");
    expect(envExample).not.toContain("VITE_GEMINI_API_KEY");
    expect(viteEnv).not.toContain("GEMINI_API_KEY");
  });

  test("UI sugere e o usuário continua no controle", async () => {
    const assistant = await source("src/components/ai/connexy-ai-assistant.tsx");
    const solicitacao = await source("src/routes/_app.solicitacao.$id.tsx");
    const catalog = await source("src/components/catalog/catalog-create-form.tsx");
    const chat = await source("src/components/chat/ConnexyChatScreen.tsx");
    const input = await source("src/components/chat/message-input.tsx");
    expect(assistant).toContain("Usar");
    expect(assistant).toContain("Descartar");
    expect(assistant).toContain("O que você deseja?");
    expect(assistant).toContain("Sugestão de conversa");
    expect(assistant).toContain("Criar mídia");
    expect(assistant).not.toContain("Pedido de conversa");
    expect(assistant).toContain("Usar sugestão");
    expect(assistant).toContain("Nova sugestão");
    expect(assistant).toContain("Tentar novamente");
    expect(assistant).toContain("generateConnexyAI");
    expect(assistant).toContain("CHAT_TOPIC");
    expect(assistant).toContain("ASSISTANT_MEDIA");
    expect(assistant).not.toContain("sendRequest(");
    expect(solicitacao).toContain("onInsertSuggestion");
    expect(solicitacao).toContain("Sugerir mensagem com IA");
    expect(catalog).toContain("Criar com IA");
    expect(catalog).toContain("handleGenerateAd");
    expect(catalog).toContain("createCatalogOffer");
    const generateBlock = catalog.slice(
      catalog.indexOf("async function handleGenerateAd"),
      catalog.indexOf("return (", catalog.indexOf("async function handleGenerateAd")),
    );
    expect(generateBlock).not.toContain("createCatalogOffer");
    expect(chat).toContain("Assistente Connexy");
    expect(chat).toContain("setComposerInsert");
    expect(chat).not.toContain("onCreateMedia");
    expect(input).toContain("onSendText(trimmed)");
    expect(geminiUserMessage(new Error("boom"))).toBe(
      "Não foi possível gerar uma sugestão agora. Tente novamente.",
    );
  });

  test("nenhum arquivo client-side do projeto carrega um segredo do Gemini", async () => {
    const srcFiles = await scanSourceFiles(join(projectRoot, "src"), { pathPrefix: "src" });
    expect(srcFiles.length).toBeGreaterThan(50);
    const clientFiles = srcFiles.filter((file) => file.kind === "client");
    expect(clientFiles.length).toBeGreaterThan(50);

    const secret = /GEMINI[A-Z_]*API_KEY|GEMINI_API_KEY|GOOGLE_API_KEY|GEMINI_API_KEY_BASE/;
    const leaked = findPattern(clientFiles, secret);
    expect(leaked.length === 0 ? "nenhum" : describeFiles(leaked)).toBe("nenhum");

    const rawKeys = findLiteral(clientFiles, "AIza");
    expect(rawKeys.length === 0 ? "nenhum" : describeFiles(rawKeys)).toBe("nenhum");

    const envPrefixed = findPattern(clientFiles, /import\.meta\.env\.[A-Z_]*GEMINI/);
    expect(envPrefixed.length === 0 ? "nenhum" : describeFiles(envPrefixed)).toBe("nenhum");
  });

  test("configuração de modelo no cliente não é confundida com segredo", async () => {
    const srcFiles = await scanSourceFiles(join(projectRoot, "src"), { pathPrefix: "src" });
    const modelReaders = findLiteral(srcFiles, "process.env.GEMINI_MODEL");

    expect(modelReaders.map((file) => file.relativePath)).toEqual(["src/lib/gemini/gemini-config.ts"]);
    expect(modelReaders[0]?.kind).toBe("client");
  });

  test("VITE_GEMINI_API_KEY não existe no código do projeto", async () => {
    const roots = ["src", "tests/helpers", "scripts"];
    for (const root of roots) {
      const files = await scanSourceFiles(join(projectRoot, root), { pathPrefix: root });
      const found = findLiteral(files, "VITE_GEMINI");
      expect(`${root}: ${describeFiles(found)}`).toBe(`${root}: nenhum arquivo`);
    }
    const envExample = await source(".env.example");
    const viteConfig = await source("vite.config.ts");
    for (const file of [envExample, viteConfig]) {
      expect(file).not.toContain("VITE_GEMINI");
    }
  });

  test("a chave é lida apenas no módulo server-only do Gemini", async () => {
    const srcFiles = await scanSourceFiles(join(projectRoot, "src"), { pathPrefix: "src" });
    const readers = findLiteral(srcFiles, "process.env.GEMINI_API_KEY");

    expect(readers.map((file) => file.relativePath)).toEqual([
      "src/lib/gemini/gemini-client.server.ts",
    ]);
    expect(readers[0]?.kind).toBe("server");

    const client = await source("src/lib/gemini/gemini-client.server.ts");
    expect(client).toContain("process.env.GEMINI_API_KEY");
    expect(client).toContain("inlineData");
  });

  test("GoogleGenAI só é instanciado no servidor, sem cliente duplicado", async () => {
    const srcFiles = await scanSourceFiles(join(projectRoot, "src"), { pathPrefix: "src" });
    const instantiations = findLiteral(srcFiles, "new GoogleGenAI");

    expect(instantiations.map((file) => file.relativePath)).toEqual([
      "src/lib/gemini/gemini-client.server.ts",
    ]);
    for (const file of instantiations) expect(file.kind).toBe("server");

    const imports = findLiteral(srcFiles, 'from "@google/genai"');
    expect(imports.map((file) => file.relativePath)).toEqual([
      "src/lib/gemini/gemini-client.server.ts",
    ]);
  });

  test("a documentação pode citar a chave e ainda assim não é código client", async () => {
    const srcFiles = await scanSourceFiles(join(projectRoot, "src"), { pathPrefix: "src" });
    const docs = findLiteral(srcFiles, "GEMINI_API_KEY").filter((file) => file.kind === "doc");
    const readme = docs.find((file) => file.relativePath.endsWith("gemini/README.md"));

    expect(readme).toBeDefined();
    expect(readme?.kind).toBe("doc");
    expect(findLiteral(srcFiles, "GEMINI_API_KEY").filter((file) => file.kind === "client")).toHaveLength(0);
  });

  test("o limite servidor é alcançado por createServerFn, não por import direto", async () => {
    const srcFiles = await scanSourceFiles(join(projectRoot, "src"), { pathPrefix: "src" });
    const generate = srcFiles.find((file) => file.relativePath === "src/lib/gemini/generate.ts");

    expect(generate?.kind).toBe("client");
    expect(generate?.contents).toContain("createServerFn");
    expect(generate?.contents).toContain('await import("./gemini-client.server")');
    expect(generate?.contents).not.toContain('from "./gemini-client.server"');

    const hook = srcFiles.find((file) => file.relativePath === "src/lib/gemini/use-gemini.ts");
    expect(hook?.kind).toBe("client");
    expect(hook?.contents).not.toContain("gemini-client.server");
  });
});

const TINY_PNG =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

describe("gemini — catálogo multimodal", () => {
  test("texto sem imagem não envia partes visuais", async () => {
    let images: unknown;
    await runGeminiFeature(
      {
        feature: GeminiFeature.CATALOG_ASSIST,
        actorId: "lucas",
        input: { kind: "event", title: "Festival de Música", intent: "destacar a data" },
      },
      {
        generateText: async (params) => {
          images = params.images;
          return JSON.stringify({
            suggestion: { title: "Festival de Música", description: "Música ao vivo no parque." },
          });
        },
      },
    );
    expect(images).toBeUndefined();
  });

  test("texto e uma imagem chegam juntos ao cliente", async () => {
    let count = 0;
    const result = await runGeminiFeature(
      {
        feature: GeminiFeature.CATALOG_ASSIST,
        actorId: "lucas",
        input: { kind: "business", name: "Café Central", description: "Café especializado" },
        images: [{ mimeType: "image/png", data: TINY_PNG }],
      },
      {
        generateText: async (params) => {
          count = params.images?.length ?? 0;
          return JSON.stringify({
            suggestion: {
              title: "Café Central",
              description: "Destaque o balcão e o nome já informado.",
              visualDirection: { composition: "Produto no primeiro plano." },
            },
          });
        },
      },
    );
    expect(count).toBe(1);
    expect(result.ok).toBe(true);
  });

  test("texto e várias imagens são aceitos", async () => {
    let count = 0;
    await runGeminiFeature(
      {
        feature: GeminiFeature.CATALOG_ASSIST,
        actorId: "lucas",
        input: { kind: "place", name: "Parque Municipal" },
        images: [
          { mimeType: "image/png", data: TINY_PNG },
          { mimeType: "image/jpeg", data: TINY_PNG },
        ],
      },
      {
        generateText: async (params) => {
          count = params.images?.length ?? 0;
          return JSON.stringify({
            suggestion: { description: "Área verde com ponto focal na alameda." },
          });
        },
      },
    );
    expect(count).toBe(2);
  });

  test("MIME inválido e tamanho excedido são rejeitados", async () => {
    const mime = await runGeminiFeature(
      {
        feature: GeminiFeature.CATALOG_ASSIST,
        actorId: "lucas",
        input: { kind: "event", title: "Festival" },
        images: [{ mimeType: "image/svg+xml", data: TINY_PNG }],
      },
      { generateText: jsonGenerate({ suggestion: { title: "Festival" } }) },
    );
    expect(mime.ok).toBe(false);
    if (!mime.ok) expect(mime.code).toBe(GeminiErrorCode.INVALID_IMAGE);

    expect(() =>
      sanitizeGeminiImages([
        {
          mimeType: "image/png",
          data: "A".repeat(Math.ceil((GEMINI_IMAGE_MAX_BYTES * 4) / 3) + 32),
        },
      ]),
    ).toThrow(GeminiError);
  });

  test("JSON válido, inválido e vazio", () => {
    const parsed = parseGeminiCatalogAssist(
      JSON.stringify({
        suggestion: {
          title: "Festival Y",
          description: "Música ao vivo.",
          divergence:
            "Há uma possível divergência entre o texto informado e o texto presente na imagem.",
          visualDirection: {
            composition: "Data em destaque.",
            imagePrompt: "Cartaz com a data legível.",
          },
        },
      }),
    );
    expect(parsed.suggestion.divergence).toContain("divergência");
    expect(() => parseGeminiCatalogAssist("não é json")).toThrow(GeminiError);
    expect(() => parseGeminiCatalogAssist(JSON.stringify({ suggestion: {} }))).toThrow(GeminiError);
  });

  test("timeout, 404 e 503 caem no fallback amigável", async () => {
    expect(mapGeminiHttpStatus(404)).toBe(GeminiErrorCode.NOT_FOUND);
    expect(mapGeminiHttpStatus(503)).toBe(GeminiErrorCode.UNAVAILABLE);
    const timeout = await runGeminiFeature(
      {
        feature: GeminiFeature.CATALOG_ASSIST,
        actorId: "lucas",
        input: { kind: "event", title: "Show" },
      },
      {
        generateText: async () => {
          throw new GeminiError(GeminiErrorCode.TIMEOUT);
        },
      },
    );
    const missing = await runGeminiFeature(
      {
        feature: GeminiFeature.CATALOG_ASSIST,
        actorId: "lucas",
        input: { kind: "event", title: "Show 2" },
      },
      {
        generateText: async () => {
          throw new GeminiError(GeminiErrorCode.NOT_FOUND);
        },
      },
    );
    const down = await runGeminiFeature(
      {
        feature: GeminiFeature.CATALOG_ASSIST,
        actorId: "lucas",
        input: { kind: "event", title: "Show 3" },
      },
      {
        generateText: async () => {
          throw new GeminiError(GeminiErrorCode.UNAVAILABLE);
        },
      },
    );
    for (const result of [timeout, missing, down]) {
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error).toContain("Não foi possível gerar uma sugestão agora");
    }
  });

  test("cache e rate limit continuam na camada Gemini", async () => {
    let calls = 0;
    const generateText: GenerateTextFn = async () => {
      calls += 1;
      return JSON.stringify({ suggestion: { description: "Texto estável." } });
    };
    const request = {
      feature: GeminiFeature.CATALOG_ASSIST,
      actorId: "lucas",
      input: { kind: "place" as const, name: "Parque" },
      images: [{ mimeType: "image/png", data: TINY_PNG }],
    };
    await runGeminiFeature(request, { generateText });
    await runGeminiFeature(request, { generateText });
    expect(calls).toBe(1);
    for (let index = 0; index < 7; index += 1) {
      await runGeminiFeature(
        {
          feature: GeminiFeature.CATALOG_ASSIST,
          actorId: "lucas",
          input: { kind: "place", name: `Parque ${index}` },
        },
        { generateText },
      );
    }
    const blocked = await runGeminiFeature(
      {
        feature: GeminiFeature.CATALOG_ASSIST,
        actorId: "lucas",
        input: { kind: "place", name: "Parque extra" },
      },
      { generateText },
    );
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) expect(blocked.code).toBe(GeminiErrorCode.RATE_LIMIT);
  });

  test("as telas de criação não tocam na chave nem no cliente Gemini", async () => {
    const files = [
      "src/components/catalog/event-create-form.tsx",
      "src/components/catalog/business-create-form.tsx",
      "src/components/catalog/place-create-form.tsx",
      "src/components/catalog/ai-content-assist.tsx",
      "src/routes/_app/marketplace.tsx",
    ];
    for (const file of files) {
      const contents = await source(file);
      expect(contents).not.toContain("GEMINI_API_KEY");
      expect(contents).not.toContain("VITE_GEMINI");
      expect(contents).not.toContain("gemini-client.server");
      expect(contents).not.toContain("@google/genai");
    }
  });
});

describe("gemini — validação de imagem", () => {
  test("quantidade acima do limite é rejeitada", async () => {
    const images = Array.from({ length: GEMINI_IMAGE_MAX_COUNT + 1 }, () => ({
      mimeType: "image/png",
      data: TINY_PNG,
    }));
    expect(() => sanitizeGeminiImages(images)).toThrow(GeminiError);
    const result = await runGeminiFeature(
      {
        feature: GeminiFeature.CATALOG_ASSIST,
        actorId: "lucas",
        input: { kind: "event", title: "Festival" },
        images,
      },
      { generateText: jsonGenerate({ suggestion: { title: "Festival" } }) },
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe(GeminiErrorCode.INVALID_IMAGE);
  });

  test("payload vazio ou fora do alfabeto base64 é rejeitado", () => {
    expect(() => sanitizeGeminiImages([{ mimeType: "image/png", data: "" }])).toThrow(GeminiError);
    expect(() =>
      sanitizeGeminiImages([{ mimeType: "image/png", data: "não é base64 ***" }]),
    ).toThrow(GeminiError);
  });

  test("MIME é normalizado e data URL é removida antes do envio", () => {
    expect(normalizeGeminiImageMime("image/jpg")).toBe("image/jpeg");
    expect(normalizeGeminiImageMime(" IMAGE/PNG ")).toBe("image/png");
    expect(stripDataUrlPrefix(`data:image/png;base64,${TINY_PNG}`)).toBe(TINY_PNG);
    expect(stripDataUrlPrefix(TINY_PNG)).toBe(TINY_PNG);
    expect(estimateBase64Bytes(TINY_PNG)).toBeGreaterThan(0);
    const [clean] = sanitizeGeminiImages([
      { mimeType: "image/jpg", data: `data:image/jpg;base64,${TINY_PNG}` },
    ]);
    expect(clean.mimeType).toBe("image/jpeg");
    expect(clean.data).toBe(TINY_PNG);
  });

  test("arquivo do navegador é recusado antes de chegar ao Gemini", async () => {
    const wrongType = new File([new Uint8Array([1, 2, 3])], "evento.svg", {
      type: "image/svg+xml",
    });
    await expect(fileToGeminiImage(wrongType)).rejects.toBeInstanceOf(GeminiError);
    const tooBig = new File([new Uint8Array(GEMINI_IMAGE_MAX_BYTES + 1)], "grande.png", {
      type: "image/png",
    });
    await expect(fileToGeminiImage(tooBig)).rejects.toBeInstanceOf(GeminiError);
  });
});

describe("gemini — erros, cache e limites", () => {
  test("429 vira limite de requisições e cada código tem mensagem própria", () => {
    expect(mapGeminiHttpStatus(429)).toBe(GeminiErrorCode.RATE_LIMIT);
    expect(geminiUserMessage(new GeminiError(GeminiErrorCode.RATE_LIMIT))).toContain(
      "Muitas sugestões",
    );
    expect(geminiUserMessage(new GeminiError(GeminiErrorCode.INVALID_IMAGE))).toContain(
      "JPEG, PNG, WebP ou GIF",
    );
    expect(geminiUserMessage(new GeminiError(GeminiErrorCode.NOT_CONFIGURED))).toContain(
      "não está configurada",
    );
    for (const code of [GeminiErrorCode.TIMEOUT, GeminiErrorCode.EMPTY, GeminiErrorCode.INVALID]) {
      expect(geminiUserMessage(new GeminiError(code))).toBe(GEMINI_USER_FALLBACK);
    }
  });

  test("a chave ausente vira not_configured sem vazar o valor", () => {
    const error = new GeminiError(GeminiErrorCode.NOT_CONFIGURED);
    expect(error.message).not.toContain("GEMINI_API_KEY");
    expect(error.toUserMessage()).toBe(geminiUserMessage(error));
  });

  test("cache expira depois do TTL e descarta a entrada mais antiga", () => {
    let clock = 1_000;
    const now = () => clock;
    writeGeminiCache("a", "primeira", now);
    expect(readGeminiCache("a", now)).toBe("primeira");
    clock += GEMINI_CACHE_TTL_MS - 1;
    expect(readGeminiCache("a", now)).toBe("primeira");
    clock += 2;
    expect(readGeminiCache("a", now)).toBeNull();

    for (let index = 0; index <= GEMINI_CACHE_MAX_ENTRIES; index += 1) {
      writeGeminiCache(`slot-${index}`, `valor-${index}`, now);
    }
    expect(readGeminiCache("slot-0", now)).toBeNull();
    expect(readGeminiCache(`slot-${GEMINI_CACHE_MAX_ENTRIES}`, now)).not.toBeNull();
  });

  test("o limite vale por usuário e por função", async () => {
    const generateText = jsonGenerate({ suggestion: { description: "Igual." } });
    const request = {
      feature: GeminiFeature.CATALOG_ASSIST,
      actorId: "lucas",
      input: { kind: "place" as const, name: "Praça" },
    };
    for (let index = 0; index < 8; index += 1) {
      const result = await runGeminiFeature(
        { ...request, input: { kind: "place", name: `Praça ${index}` } },
        { generateText },
      );
      expect(result.ok).toBe(true);
    }
    const blocked = await runGeminiFeature(
      { ...request, input: { kind: "place", name: "Praça 9" } },
      { generateText },
    );
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) expect(blocked.code).toBe(GeminiErrorCode.RATE_LIMIT);

    const other = await runGeminiFeature({ ...request, actorId: "doutora" }, { generateText });
    expect(other.ok).toBe(true);
  });
});
