import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { GEMINI_IMAGE_MAX_COUNT } from "./gemini-images";
import { GeminiFeature, type GeminiGenerateRequest, type GeminiGenerateResult } from "./gemini-types";

const adInputSchema = z.object({
  businessName: z.string().max(80).optional(),
  category: z.string().max(40).optional(),
  product: z.string().max(120).optional(),
  description: z.string().max(400).optional(),
  offer: z.string().max(160).optional(),
  audience: z.string().max(80).optional(),
  tone: z.string().max(40).optional(),
  extra: z.string().max(200).optional(),
});

const icebreakerInputSchema = z.object({
  name: z.string().max(80).optional(),
  headline: z.string().max(120).optional(),
  interests: z.array(z.string().max(40)).max(6).optional(),
  sharedInterests: z.array(z.string().max(40)).max(6).optional(),
  notes: z.string().max(200).optional(),
});

const chatInputSchema = z.object({
  peerName: z.string().max(80).optional(),
  interests: z.array(z.string().max(40)).max(6).optional(),
  sharedInterests: z.array(z.string().max(40)).max(6).optional(),
  intent: z.string().max(200).optional(),
  avoid: z.string().max(220).optional(),
  notes: z.string().max(200).optional(),
  messages: z
    .array(
      z.object({
        from: z.enum(["me", "them"]),
        text: z.string().max(180),
      }),
    )
    .max(8)
    .optional(),
});

const mediaInputSchema = z.object({
  intent: z.string().max(200).optional(),
  avoid: z.string().max(220).optional(),
  notes: z.string().max(200).optional(),
});

const catalogAssistInputSchema = z.object({
  kind: z.enum(["event", "business", "place"]),
  intent: z.string().max(200).optional(),
  title: z.string().max(80).optional(),
  name: z.string().max(80).optional(),
  description: z.string().max(400).optional(),
  category: z.string().max(40).optional(),
  location: z.string().max(120).optional(),
  extra: z.string().max(200).optional(),
});

const imagesSchema = z
  .array(
    z.object({
      mimeType: z.string().max(40),
      data: z.string().min(1).max(6_000_000),
    }),
  )
  .max(GEMINI_IMAGE_MAX_COUNT)
  .optional();

const generateSchema = z.discriminatedUnion("feature", [
  z.object({
    feature: z.literal(GeminiFeature.B2B_AD),
    actorId: z.string().max(64).optional(),
    input: adInputSchema,
    images: imagesSchema,
  }),
  z.object({
    feature: z.literal(GeminiFeature.FIRST_CONTACT),
    actorId: z.string().max(64).optional(),
    input: icebreakerInputSchema,
    images: imagesSchema,
  }),
  z.object({
    feature: z.literal(GeminiFeature.ASSISTANT_MEDIA),
    actorId: z.string().max(64).optional(),
    input: mediaInputSchema,
    images: imagesSchema,
  }),
  z.object({
    feature: z.literal(GeminiFeature.CHAT_TOPIC),
    actorId: z.string().max(64).optional(),
    input: chatInputSchema,
    images: imagesSchema,
  }),
  z.object({
    feature: z.literal(GeminiFeature.CATALOG_ASSIST),
    actorId: z.string().max(64).optional(),
    input: catalogAssistInputSchema,
    images: imagesSchema,
  }),
]);

export const generateConnexyAI = createServerFn({ method: "POST" })
  .validator((input: unknown) => generateSchema.parse(input) as GeminiGenerateRequest)
  .handler(async ({ data }): Promise<GeminiGenerateResult> => {
    const { runGeminiFeature } = await import("./gemini-runtime");
    const { generateGeminiText } = await import("./gemini-client.server");
    return runGeminiFeature(data, { generateText: generateGeminiText });
  });
