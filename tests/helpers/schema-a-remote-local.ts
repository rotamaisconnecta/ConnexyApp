import { spawn } from "node:child_process";
import { join } from "node:path";

export type LocalSchemaAEnv = {
  url: string;
  anonKey: string;
  serviceRoleKey: string;
};

function parseEnvBlock(text: string): Record<string, string> {
  const env: Record<string, string> = {};
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const idx = line.indexOf("=");
    if (idx <= 0) continue;
    const key = line.slice(0, idx);
    let value = line.slice(idx + 1);
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

function fromProcess(): LocalSchemaAEnv | null {
  const url = process.env.SUPABASE_URL || process.env.API_URL;
  const anonKey = process.env.ANON_KEY || process.env.SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anonKey || !serviceRoleKey) return null;
  return { url, anonKey, serviceRoleKey };
}

async function fromCli(projectRoot: string): Promise<LocalSchemaAEnv | null> {
  const text = await new Promise<string>((resolve, reject) => {
    const child = spawn("npx", ["supabase", "status", "-o", "env"], {
      cwd: projectRoot,
      env: process.env,
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString("utf8");
    });
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString("utf8");
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve(stdout);
      else reject(new Error(stderr || `supabase status exited ${code}`));
    });
  });
  const env = parseEnvBlock(text);
  const url = env.API_URL || env.SUPABASE_URL;
  const anonKey = env.ANON_KEY || env.SUPABASE_ANON_KEY;
  const serviceRoleKey = env.SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anonKey || !serviceRoleKey) return null;
  return { url, anonKey, serviceRoleKey };
}

export async function loadLocalSchemaAEnv(
  projectRoot = join(import.meta.dir, "../.."),
): Promise<LocalSchemaAEnv | null> {
  const existing = fromProcess();
  if (existing) return existing;
  try {
    return await fromCli(projectRoot);
  } catch {
    return null;
  }
}

export async function isLocalSchemaAReachable(env: LocalSchemaAEnv): Promise<boolean> {
  try {
    const response = await fetch(`${env.url.replace(/\/$/, "")}/auth/v1/health`, {
      headers: { apikey: env.anonKey },
    });
    return response.ok;
  } catch {
    return false;
  }
}
