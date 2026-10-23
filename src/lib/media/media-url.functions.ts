import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAppSupabaseAuth } from "@/lib/supabase/auth-middleware";
import { createSchemaAClient } from "@/integrations/supabase/remote";
import { resolveServerSupabasePublicConfig } from "@/lib/supabase/external-env";
import type { MediaLocator } from "@/lib/media/media-authorization";

/**
 * G4 — server function de midia.
 *
 * Fluxo: valida a sessao real no servidor (`requireAppSupabaseAuth` verifica a
 * assinatura do JWT em `auth.getClaims`), carrega a publicacao com RLS usando a
 * identidade verificada, autoriza a partir da LINHA e so entao assina com a
 * credencial privilegiada (server-only). O cliente envia apenas `postId` e um
 * LOCALIZADOR; `bucket`/`path` nunca sao prova de autorizacao.
 *
 * A flag de midia permanece OFF por padrao; sem flag, o resultado e
 * `unavailable` e nenhuma assinatura e emitida.
 */

const locatorSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("identity"),
    bucket: z.string().min(1).max(40),
    path: z.string().min(1).max(1024),
  }),
  z.object({
    kind: z.literal("index"),
    index: z.number().int().min(0).max(99),
  }),
]);

const inputSchema = z.object({
  postId: z.string().uuid(),
  locator: locatorSchema,
});

function readExternalSupabaseConfig(): { url: string; key: string } {
  return resolveServerSupabasePublicConfig();
}

function bearerTokenFromRequest(headers: Headers): string | null {
  const header = headers.get("authorization");
  if (!header || !header.startsWith("Bearer ")) return null;
  const token = header.slice("Bearer ".length).trim();
  return token.length > 0 ? token : null;
}

export const getPostMediaUrl = createServerFn({ method: "POST" })
  .middleware([requireAppSupabaseAuth])
  .validator((input: unknown) => inputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { getRequest } = await import("@tanstack/react-start/server");
    const request = getRequest();
    const token = request?.headers ? bearerTokenFromRequest(request.headers) : null;
    if (!token) throw new Error("Unauthorized: No token provided");

    const { createServerMediaUrlService } =
      await import("@/lib/media/media-server-authorization.server");

    const { url, key } = readExternalSupabaseConfig();
    const supabase = createSchemaAClient(url, key, { accessToken: token });
    const service = createServerMediaUrlService({ supabase, viewerId: context.userId });
    return service.getMediaUrl(data.postId, data.locator as MediaLocator);
  });
