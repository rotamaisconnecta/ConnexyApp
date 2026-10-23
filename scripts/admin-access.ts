import { createClient } from "@supabase/supabase-js";
import { createInterface } from "node:readline/promises";
import { grantPlatformAdmin, revokePlatformAdmin } from "../src/lib/admin/admin-provisioning";

const USER_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function run() {
  const [operation, userId, ...extra] = process.argv.slice(2);
  if (extra.length || !["grant", "revoke"].includes(operation) || !USER_ID_PATTERN.test(userId ?? "")) {
    console.error("Uso: bun scripts/admin-access.ts <grant|revoke> <auth-user-uuid>");
    process.exitCode = 2;
    return;
  }

  const supabaseUrl = process.env.APP_SUPABASE_URL;
  const serviceRoleKey = process.env.APP_SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Defina APP_SUPABASE_URL e APP_SUPABASE_SERVICE_ROLE_KEY no ambiente confiável.");
    process.exitCode = 2;
    return;
  }

  const prompt = createInterface({ input: process.stdin, output: process.stderr });
  try {
    const confirmation = await prompt.question(
      `Confirme ${operation.toUpperCase()} para Auth user ${userId}, digitando exatamente: ${operation.toUpperCase()} ${userId}\n> `,
    );
    if (confirmation !== `${operation.toUpperCase()} ${userId}`) {
      console.error("Operação cancelada; a confirmação não correspondeu.");
      process.exitCode = 1;
      return;
    }
  } finally {
    prompt.close();
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: current, error: lookupError } = await supabase.auth.admin.getUserById(userId);
  if (lookupError || !current.user) {
    console.error("Não foi possível localizar a conta Auth informada; nenhuma alteração foi aplicada.");
    process.exitCode = 1;
    return;
  }

  const nextMetadata = operation === "grant"
    ? grantPlatformAdmin(current.user.app_metadata ?? {})
    : revokePlatformAdmin(current.user.app_metadata ?? {});
  const { data: updated, error: updateError } = await supabase.auth.admin.updateUserById(userId, {
    app_metadata: nextMetadata,
  });
  if (updateError || !updated.user) {
    console.error("A operação não foi confirmada pelo Auth; verifique o estado da conta antes de repetir.");
    process.exitCode = 1;
    return;
  }

  const hasRole = updated.user.app_metadata?.platform_role === "admin";
  if (hasRole !== (operation === "grant")) {
    console.error("O Auth retornou metadados diferentes do solicitado; confirme o estado no painel do provedor.");
    process.exitCode = 1;
    return;
  }
  console.log(`Acesso administrativo ${operation === "grant" ? "concedido" : "revogado"}.`);
}

run().catch(() => {
  console.error("Falha segura na operação administrativa; nenhum detalhe de credencial foi registrado.");
  process.exitCode = 1;
});
