import { readdir, readFile } from "node:fs/promises";
import { join, relative, sep } from "node:path";

/**
 * Varre arquivos do projeto classificando cada um como `server`, `doc` ou `client`.
 *
 * A distinção importa porque o Vite embarca no bundle do browser tudo que é
 * alcançável a partir do código do cliente. Um segredo lido em um módulo
 * `*.server.ts` nunca chega ao browser; o mesmo literal em um componente, rota
 * ou store vazaria.
 */

export type SourceFileKind = "client" | "server" | "doc";

export type ScannedFile = {
  path: string;
  relativePath: string;
  kind: SourceFileKind;
  contents: string;
};

const CODE_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"];
const DOC_EXTENSIONS = [".md", ".mdx"];
const SKIPPED_DIRECTORIES = new Set([
  "node_modules",
  "dist",
  ".output",
  ".vinxi",
  ".tanstack",
  ".wrangler",
  ".git",
  "coverage",
]);

const SERVER_FILE_PATTERN = /\.server\.[cm]?[jt]sx?$/;

export function classifySourcePath(relativePath: string): SourceFileKind | null {
  const normalized = relativePath.split(sep).join("/");
  if (DOC_EXTENSIONS.some((extension) => normalized.endsWith(extension))) return "doc";
  if (!CODE_EXTENSIONS.some((extension) => normalized.endsWith(extension))) return null;
  const name = normalized.slice(normalized.lastIndexOf("/") + 1);
  return SERVER_FILE_PATTERN.test(name) ? "server" : "client";
}

export function isServerOnlyPath(relativePath: string): boolean {
  return classifySourcePath(relativePath) === "server";
}

async function walk(current: string, acc: string[]): Promise<string[]> {
  const entries = await readdir(current, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(current, entry.name);
    if (entry.isDirectory()) {
      if (SKIPPED_DIRECTORIES.has(entry.name)) continue;
      await walk(full, acc);
      continue;
    }
    if (entry.isFile()) acc.push(full);
  }
  return acc;
}

export type ScanOptions = {
  /** Prefixo usado nos `relativePath`, para que eles sejam legíveis a partir da raiz do projeto. */
  pathPrefix?: string;
};

export async function scanSourceFiles(rootDir: string, options: ScanOptions = {}): Promise<ScannedFile[]> {
  const prefix = (options.pathPrefix ?? "").replace(/^\/+|\/+$/g, "");
  const paths = await walk(rootDir, []);
  const files: ScannedFile[] = [];
  for (const path of paths.sort()) {
    const scoped = relative(rootDir, path).split(sep).join("/");
    const kind = classifySourcePath(scoped);
    if (!kind) continue;
    files.push({
      path,
      relativePath: prefix ? `${prefix}/${scoped}` : scoped,
      kind,
      contents: await readFile(path, "utf8"),
    });
  }
  return files;
}

export function findLiteral(files: ScannedFile[], literal: string): ScannedFile[] {
  return files.filter((file) => file.contents.includes(literal));
}

export function findPattern(files: ScannedFile[], pattern: RegExp): ScannedFile[] {
  return files.filter((file) => pattern.test(file.contents));
}

export function describeFiles(files: ScannedFile[]): string {
  return files.map((file) => `${file.relativePath} (${file.kind})`).join(", ") || "nenhum arquivo";
}