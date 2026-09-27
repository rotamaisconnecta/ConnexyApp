/* =========================================================
   local-reel-persistence.ts — Migração controlada de Reels
   (Fases 1C-3C-A até 1C-3C-C).

   Fase A: carregar com segurança `connexy:reels:published:v1` no
   `ReelRepository` (store `reels`).
   Fase B0: representar separadamente o progresso de Reels,
   likes e comments.
   Fase B: migrar `connexy:reels:likes:v1` (somente `true`) no
   `ReelLikeRepository`, sem conectar o Feed.
   Fase C: migrar comentários e replies de
   `connexy:reels:comments:v1` no `ReelCommentRepository`.

   Garantias:
     - one-time, marcada em `connexy:reels:migration-status:v1`
       (flags por etapa `stages.{reels,likes,comments}`);
     - idempotente (get/exists antes de put; ids determinísticos);
     - retomável (falha por registro não duplica nem aborta os demais);
     - fonte antiga NUNCA é removida/sobrescrita (rollback/auditoria);
     - Like legado é atribuído à identidade ativa da migração;
     - Likes órfãos permanecem na fonte e impedem conclusão da etapa;
     - mídia segue no media DB (não tocada);
     - usa apenas a infraestrutura 1C-1/1C-3B (sem sistema de erros paralelo).

   O Feed NÃO é conectado aqui — a chamada lazy fica para a fase
   1C-3C-D; este módulo garante as migrações A+B+C.
   ========================================================= */

import { IndexedDbAdapter } from "@/lib/persistence/local/indexed-db";
import { reelsPersistenceSchema } from "@/lib/persistence/domain/reels-schema";
import type {
  StoredReel,
  StoredReelAuthor,
  StoredReelCategoryValue,
  StoredReelContextRef,
  StoredReelContextType,
  StoredReelComment,
  StoredReelPersistence,
} from "@/lib/persistence/domain/reels-entities";
import { reelLikeId, type StoredReelLike } from "@/lib/persistence/domain/reels-entities";
import { ReelRepository } from "@/repositories/reel.repository";
import { ReelLikeRepository } from "@/repositories/reel-like.repository";
import { ReelCommentRepository } from "@/repositories/reel-comment.repository";
import type { StorageAdapter } from "@/lib/persistence/types";
import { COMMENTS_KEY, LIKES_KEY, PUBLISHED_KEY } from "./reel-local-storage";
import { currentUser } from "@/lib/mock-data";

export const REELS_MIGRATION_MARKER_KEY = "connexy:reels:migration-status:v1";

export type ReelsMigrationStage = "reels" | "likes" | "comments";
export type ReelsMigrationStageStatus = "pending" | "completed";

const REEL_CATEGORIES: readonly string[] = [
  "PERSON",
  "BUSINESS",
  "EVENT",
  "PLACE",
  "OFFER",
  "DRIVER",
  "NETWORKING",
  "TRAVEL",
  "MOMENT",
];

const REEL_CONTEXT_TYPES: readonly string[] = ["local", "negocio", "oferta", "evento"];

/* ─── Marcador de migração (one-time) ──────────────────── */

/**
 * Progresso de cada etapa da migração. Um marcador v1 escrito pela
 * Fase 1C-3C-A (sem `stages`) significa apenas "reels concluído" —
 * likes/comments permanecem pendentes (regra §11 da Fase B: nunca
 * marcar a migração geral como concluída antes de todas as etapas).
 */
export interface ReelsMigrationStages {
  reels: ReelsMigrationStageStatus;
  likes: ReelsMigrationStageStatus;
  comments: ReelsMigrationStageStatus;
}

export interface ReelsMigrationMarker {
  version: 1;
  ranAt: string;
  counts: { reels: number; likes: number; comments: number };
  /** Opcional (back-compat): ausente ⇒ escrito pela Fase A (só reels). */
  stages?: ReelsMigrationStages;
}

const PENDING_MIGRATION_STAGES: ReelsMigrationStages = {
  reels: "pending",
  likes: "pending",
  comments: "pending",
};

/* ─── Acesso a dados (injetável para testes) ───────────── */

export interface LocalReelsMigrationIO {
  /** JSON bruto de `connexy:reels:published:v1` (null = chave inexistente). */
  readLegacy(): string | null;
  /** JSON bruto de `connexy:reels:likes:v1` (null = chave inexistente). */
  readLikes?(): string | null;
  /** JSON bruto de `connexy:reels:comments:v1` (null = chave inexistente). */
  readComments?(): string | null;
  /** JSON bruto do marcador (null = chave inexistente). */
  readMarker(): string | null;
  writeMarker(value: string): boolean;
}

/* ─── Resultado da migração ────────────────────────────── */

export interface LegacyReelsMigrationResult {
  /** true quando não há mais trabalho pendente nem inconsistências. */
  completed: boolean;
  migrated: number;
  skippedAlreadyPresent: number;
  failed: number;
  invalid: number;
  error?: string;
}

export interface LegacyLikesMigrationResult {
  /** true somente quando todas as entradas `true` foram migradas/justificadas. */
  completed: boolean;
  found: number;
  migrated: number;
  skippedAlreadyPresent: number;
  ignoredFalse: number;
  orphaned: number;
  invalid: number;
  failed: number;
  migrationTimestamp: string | null;
  error?: string;
}

export interface LegacyCommentsMigrationResult {
  completed: boolean;
  found: number;
  migrated: number;
  skippedAlreadyPresent: number;
  orphaned: number;
  invalid: number;
  failed: number;
  synthesizedCreatedAt: number;
  maxDepth: number;
  migrationTimestamp: string;
  error?: string;
}

/* ─── Transformação / validação (1C-3B → StoredReel) ───── */

function isStoredReelAuthor(value: unknown): value is StoredReelAuthor {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const author = value as Record<string, unknown>;
  return (
    typeof author.id === "string" &&
    typeof author.name === "string" &&
    typeof author.handle === "string" &&
    typeof author.photoUrl === "string"
  );
}

function toStoredReelAuthor(value: unknown): StoredReelAuthor | null {
  if (!isStoredReelAuthor(value)) return null;
  return {
    id: value.id,
    name: value.name,
    handle: value.handle,
    photoUrl: value.photoUrl,
    verified: typeof value.verified === "boolean" ? value.verified : false,
    profession:
      typeof value.profession === "string" || value.profession === null ? value.profession : null,
    isFollowing: typeof value.isFollowing === "boolean" ? value.isFollowing : false,
  };
}

function toStoredReelContext(value: unknown): StoredReelContextRef | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== "object" || Array.isArray(value)) return null;
  const context = value as Record<string, unknown>;
  if (typeof context.tipo !== "string" || !REEL_CONTEXT_TYPES.includes(context.tipo)) return null;
  if (typeof context.id !== "string" || typeof context.titulo !== "string") return null;
  return { tipo: context.tipo as StoredReelContextType, id: context.id, titulo: context.titulo };
}

function isReelPersistence(value: unknown): value is StoredReelPersistence {
  return value === "supabase" || value === "local";
}

/**
 * Transforma um item bruto de `published:v1` em `StoredReel`.
 * Retorna null para registro inválido (nunca descarta dados por
 * aproximação: contexto/autor malformados inviabilizam representação
 * fiel e mantêm o registro na fonte antiga).
 */
export function toStoredReel(value: unknown): StoredReel | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const item = value as Record<string, unknown>;
  if (typeof item.id !== "string" || item.id.length === 0) return null;
  if (typeof item.caption !== "string") return null;
  if (typeof item.category !== "string" || !REEL_CATEGORIES.includes(item.category)) return null;
  if (!isReelPersistence(item.persistence)) return null;
  if (typeof item.durationS !== "number" || !Number.isFinite(item.durationS)) return null;
  if (typeof item.createdAt !== "string" || item.createdAt.length === 0) return null;
  const author = toStoredReelAuthor(item.author);
  if (!author) return null;
  const context = toStoredReelContext(item.context);
  if (item.context !== null && item.context !== undefined && context === null) return null;

  return {
    id: item.id,
    caption: item.caption,
    category: item.category as StoredReelCategoryValue,
    author,
    context,
    durationS: item.durationS,
    createdAt: item.createdAt,
    persistence: item.persistence,
  };
}

/* ─── Marcador ─────────────────────────────────────────── */

export function parseReelsMigrationMarker(raw: string | null): ReelsMigrationMarker | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    const marker = parsed as Partial<ReelsMigrationMarker>;
    if (
      marker.version !== 1 ||
      typeof marker.ranAt !== "string" ||
      !marker.counts ||
      !["reels", "likes", "comments"].every((stage) => {
        const count = marker.counts?.[stage as ReelsMigrationStage];
        return typeof count === "number" && Number.isFinite(count) && count >= 0;
      })
    ) {
      return null;
    }
    if (
      marker.stages &&
      !["reels", "likes", "comments"].every((stage) => {
        const status = marker.stages?.[stage as ReelsMigrationStage];
        return status === "pending" || status === "completed";
      })
    ) {
      return null;
    }
    return marker as ReelsMigrationMarker;
  } catch {
    return null;
  }
}

/**
 * Marcadores escritos na Fase A não possuem `stages`: eles representam
 * exclusivamente a conclusão de reels, nunca de likes/comments.
 */
export function getReelsMigrationStages(marker: ReelsMigrationMarker | null): ReelsMigrationStages {
  if (!marker) return { ...PENDING_MIGRATION_STAGES };
  if (marker.stages) return { ...marker.stages };
  return { reels: "completed", likes: "pending", comments: "pending" };
}

export function isReelsMigrationStageCompleted(
  marker: ReelsMigrationMarker | null,
  stage: ReelsMigrationStage,
): boolean {
  return getReelsMigrationStages(marker)[stage] === "completed";
}

/** A migração v1 só terminou quando as três etapas independentes terminaram. */
export function isReelsMigrationCompleted(marker: ReelsMigrationMarker | null): boolean {
  const stages = getReelsMigrationStages(marker);
  return Object.values(stages).every((status) => status === "completed");
}

/** Resolve `auth.user?.id ?? currentUser.id`, recusando identidade vazia. */
export function resolveReelsMigrationUserId(
  authenticatedUserId: string | null | undefined,
  fallbackUserId: string | null | undefined = currentUser.id,
): string | null {
  const candidate = authenticatedUserId ?? fallbackUserId;
  return typeof candidate === "string" && candidate.trim().length > 0 ? candidate.trim() : null;
}

/**
 * Atualiza exclusivamente uma etapa, preservando o resultado e os contadores
 * das demais. B e C usarão esta função sem reexecutar A.
 */
export function completeReelsMigrationStage(
  io: LocalReelsMigrationIO,
  stage: ReelsMigrationStage,
  count: number,
): boolean {
  if (!Number.isFinite(count) || count < 0) return false;
  const marker = parseReelsMigrationMarker(io.readMarker());
  const stages = getReelsMigrationStages(marker);
  const counts = {
    reels: marker?.counts.reels ?? 0,
    likes: marker?.counts.likes ?? 0,
    comments: marker?.counts.comments ?? 0,
    [stage]: count,
  };

  return io.writeMarker(
    JSON.stringify({
      version: 1,
      ranAt: new Date().toISOString(),
      counts,
      stages: { ...stages, [stage]: "completed" },
    } satisfies ReelsMigrationMarker),
  );
}

function writeCompletedMarker(io: LocalReelsMigrationIO, reelsMigrated: number): void {
  if (!completeReelsMigrationStage(io, "reels", reelsMigrated)) {
    console.warn(
      "[reels-migration] marcador não pôde ser gravado; migração será retomada (idempotente) na próxima execução.",
    );
  }
}

/* ─── Migração (núcleo, testável) ──────────────────────── */

export async function migrateLegacyPublishedReels(
  repo: ReelRepository,
  io: LocalReelsMigrationIO,
): Promise<LegacyReelsMigrationResult> {
  if (isReelsMigrationStageCompleted(parseReelsMigrationMarker(io.readMarker()), "reels")) {
    return { completed: true, migrated: 0, skippedAlreadyPresent: 0, failed: 0, invalid: 0 };
  }

  const raw = io.readLegacy();
  if (raw === null) {
    writeCompletedMarker(io, 0);
    return { completed: true, migrated: 0, skippedAlreadyPresent: 0, failed: 0, invalid: 0 };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    console.warn(
      "[reels-migration] " +
        PUBLISHED_KEY +
        " contém JSON inválido; fonte preservada e migração não finalizada.",
    );
    return {
      completed: false,
      migrated: 0,
      skippedAlreadyPresent: 0,
      failed: 0,
      invalid: 1,
      error: "invalid-json",
    };
  }

  let items: unknown[];
  if (Array.isArray(parsed)) {
    items = parsed;
  } else if (
    parsed &&
    typeof parsed === "object" &&
    !Array.isArray(parsed) &&
    Array.isArray((parsed as { items?: unknown[] }).items)
  ) {
    items = (parsed as { items: unknown[] }).items;
  } else {
    console.warn(
      "[reels-migration] " +
        PUBLISHED_KEY +
        " tem estrutura inesperada; fonte preservada e migração não finalizada.",
    );
    return {
      completed: false,
      migrated: 0,
      skippedAlreadyPresent: 0,
      failed: 0,
      invalid: 1,
      error: "invalid-structure",
    };
  }

  let migrated = 0;
  let skippedAlreadyPresent = 0;
  let failed = 0;
  let invalid = 0;

  for (const item of items) {
    const stored = toStoredReel(item);
    if (!stored) {
      invalid += 1;
      const rawId = (item as { id?: unknown } | null)?.id;
      console.warn(
        `[reels-migration] registro inválido não migrado (id=${
          typeof rawId === "string" ? JSON.stringify(rawId) : "(sem id)"
        }); mantido na fonte para auditoria.`,
      );
      continue;
    }
    try {
      if (await repo.exists(stored.id)) {
        skippedAlreadyPresent += 1;
        continue;
      }
      await repo.put(stored);
      migrated += 1;
    } catch (error) {
      failed += 1;
      console.warn(
        `[reels-migration] falha ao gravar "${stored.id}" (retomável na próxima execução).`,
        error,
      );
    }
  }

  if (failed > 0 || invalid > 0) {
    return { completed: false, migrated, skippedAlreadyPresent, failed, invalid };
  }

  writeCompletedMarker(io, migrated);
  return { completed: true, migrated, skippedAlreadyPresent, failed: 0, invalid: 0 };
}

/* ─── Migração de Likes legados (Fase 1C-3C-B) ───────── */

export async function migrateLegacyReelLikes(
  reels: ReelRepository,
  likes: ReelLikeRepository,
  io: LocalReelsMigrationIO,
  userId: string | null,
  migrationTimestamp = new Date().toISOString(),
): Promise<LegacyLikesMigrationResult> {
  const emptyResult = {
    found: 0,
    migrated: 0,
    skippedAlreadyPresent: 0,
    ignoredFalse: 0,
    orphaned: 0,
    invalid: 0,
    failed: 0,
    migrationTimestamp: userId ? migrationTimestamp : null,
  };
  const marker = parseReelsMigrationMarker(io.readMarker());

  if (isReelsMigrationStageCompleted(marker, "likes")) {
    return { ...emptyResult, completed: true };
  }
  if (!isReelsMigrationStageCompleted(marker, "reels")) {
    return { ...emptyResult, completed: false, error: "reels-migration-pending" };
  }
  if (!userId || userId.trim().length === 0) {
    return {
      ...emptyResult,
      completed: false,
      migrationTimestamp: null,
      error: "missing-identity",
    };
  }

  if (!io.readLikes) {
    return { ...emptyResult, completed: false, error: "likes-source-unavailable" };
  }
  const raw = io.readLikes();
  if (raw === null) {
    const completed = completeReelsMigrationStage(io, "likes", 0);
    return {
      ...emptyResult,
      completed,
      error: completed ? undefined : "marker-write-failed",
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ...emptyResult, completed: false, invalid: 1, error: "invalid-json" };
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { ...emptyResult, completed: false, invalid: 1, error: "invalid-structure" };
  }

  let found = 0;
  let migrated = 0;
  let skippedAlreadyPresent = 0;
  let ignoredFalse = 0;
  let orphaned = 0;
  let invalid = 0;
  let failed = 0;

  for (const [reelId, value] of Object.entries(parsed)) {
    if (!reelId.trim() || typeof value !== "boolean") {
      invalid += 1;
      continue;
    }
    if (!value) {
      ignoredFalse += 1;
      continue;
    }
    found += 1;

    try {
      if (!(await reels.exists(reelId))) {
        orphaned += 1;
        console.warn(
          `[reels-migration] Like órfão não migrado (reelId=${JSON.stringify(reelId)}).`,
        );
        continue;
      }
      if (await likes.getByReelAndUser(reelId, userId)) {
        skippedAlreadyPresent += 1;
        continue;
      }
      const like: StoredReelLike = {
        id: reelLikeId(reelId, userId),
        reelId,
        userId,
        createdAt: migrationTimestamp,
      };
      await likes.put(like);
      migrated += 1;
    } catch (error) {
      failed += 1;
      console.warn(`[reels-migration] falha ao migrar Like de "${reelId}" (retomável).`, error);
    }
  }

  const canComplete = orphaned === 0 && invalid === 0 && failed === 0;
  const accountedLikes = migrated + skippedAlreadyPresent;
  const completed = canComplete && completeReelsMigrationStage(io, "likes", accountedLikes);

  return {
    completed,
    found,
    migrated,
    skippedAlreadyPresent,
    ignoredFalse,
    orphaned,
    invalid,
    failed,
    migrationTimestamp,
    error: canComplete && !completed ? "marker-write-failed" : undefined,
  };
}

/* ─── Migração de Comments legados (Fase 1C-3C-C) ────── */

interface LegacyCommentCandidate {
  stored: StoredReelComment;
  synthesizedCreatedAt: boolean;
}

interface ParsedLegacyComments {
  candidates: LegacyCommentCandidate[];
  found: number;
  invalid: number;
  synthesizedCreatedAt: number;
  maxDepth: number;
}

function isValidDateString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && Number.isFinite(Date.parse(value));
}

function countInvalidCommentSubtree(
  value: unknown,
  depth: number,
  result: ParsedLegacyComments,
): void {
  result.found += 1;
  result.invalid += 1;
  result.maxDepth = Math.max(result.maxDepth, depth);
  if (!value || typeof value !== "object" || Array.isArray(value)) return;
  const replies = (value as Record<string, unknown>).replies;
  if (!Array.isArray(replies)) return;
  for (const reply of replies) countInvalidCommentSubtree(reply, depth + 1, result);
}

function collectLegacyComment(
  value: unknown,
  reelId: string,
  nestedParentId: string | null,
  depth: number,
  migrationTimestamp: string,
  result: ParsedLegacyComments,
): void {
  result.found += 1;
  result.maxDepth = Math.max(result.maxDepth, depth);
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    result.invalid += 1;
    return;
  }

  const item = value as Record<string, unknown>;
  const replies = item.replies;
  const id = typeof item.id === "string" && item.id.length > 0 ? item.id : null;
  const explicitParentId = Object.hasOwn(item, "parentId") ? item.parentId : undefined;
  const validExplicitParent =
    explicitParentId === undefined ||
    explicitParentId === null ||
    (typeof explicitParentId === "string" && explicitParentId.length > 0);
  const explicitOrder = Object.hasOwn(item, "siblingOrder") ? item.siblingOrder : undefined;
  const validOrder =
    explicitOrder === undefined ||
    explicitOrder === null ||
    (typeof explicitOrder === "number" && Number.isInteger(explicitOrder) && explicitOrder >= 0);
  const nestedParentMatches =
    nestedParentId === null ||
    explicitParentId === undefined ||
    explicitParentId === nestedParentId;
  const validShape =
    id !== null &&
    typeof item.text === "string" &&
    typeof item.authorId === "string" &&
    item.authorId.length > 0 &&
    typeof item.authorName === "string" &&
    item.authorName.length > 0 &&
    typeof item.authorPhoto === "string" &&
    typeof item.likes === "number" &&
    Number.isFinite(item.likes) &&
    item.likes >= 0 &&
    typeof item.likedByMe === "boolean" &&
    (replies === undefined || Array.isArray(replies)) &&
    validExplicitParent &&
    nestedParentMatches &&
    validOrder;

  if (!validShape) {
    result.invalid += 1;
    if (Array.isArray(replies)) {
      for (const reply of replies) {
        countInvalidCommentSubtree(reply, depth + 1, result);
      }
    }
    return;
  }

  const createdAtIsHistorical = isValidDateString(item.createdAt);
  const stored: StoredReelComment = {
    id,
    reelId,
    parentId: nestedParentId ?? (typeof explicitParentId === "string" ? explicitParentId : null),
    ...(explicitOrder !== undefined ? { siblingOrder: explicitOrder as number | null } : {}),
    text: item.text as string,
    authorId: item.authorId as string,
    authorName: item.authorName as string,
    authorPhoto: item.authorPhoto as string,
    createdAt: createdAtIsHistorical ? (item.createdAt as string) : migrationTimestamp,
    likes: item.likes as number,
    likedByMe: item.likedByMe as boolean,
  };
  result.candidates.push({
    stored,
    synthesizedCreatedAt: !createdAtIsHistorical,
  });
  if (!createdAtIsHistorical) result.synthesizedCreatedAt += 1;

  if (Array.isArray(replies)) {
    for (const reply of replies) {
      collectLegacyComment(reply, reelId, id, depth + 1, migrationTimestamp, result);
    }
  }
}

function parseLegacyComments(
  parsed: Record<string, unknown>,
  migrationTimestamp: string,
): ParsedLegacyComments {
  const result: ParsedLegacyComments = {
    candidates: [],
    found: 0,
    invalid: 0,
    synthesizedCreatedAt: 0,
    maxDepth: 0,
  };

  for (const [reelId, value] of Object.entries(parsed)) {
    if (!reelId || !Array.isArray(value)) {
      if (Array.isArray(value)) {
        for (const item of value) countInvalidCommentSubtree(item, 1, result);
      } else {
        result.invalid += 1;
      }
      continue;
    }
    for (const item of value) {
      collectLegacyComment(item, reelId, null, 1, migrationTimestamp, result);
    }
  }

  const idCounts = new Map<string, number>();
  for (const candidate of result.candidates) {
    idCounts.set(candidate.stored.id, (idCounts.get(candidate.stored.id) ?? 0) + 1);
  }
  const duplicateCount = result.candidates.reduce(
    (count, candidate) => ((idCounts.get(candidate.stored.id) ?? 0) > 1 ? count + 1 : count),
    0,
  );
  if (duplicateCount > 0) {
    result.invalid += duplicateCount;
    result.candidates = result.candidates.filter(
      (candidate) => idCounts.get(candidate.stored.id) === 1,
    );
  }

  return result;
}

function storedCommentMatches(
  existing: StoredReelComment,
  candidate: LegacyCommentCandidate,
): boolean {
  const expected = candidate.stored;
  return (
    existing.reelId === expected.reelId &&
    (existing.parentId ?? null) === (expected.parentId ?? null) &&
    (existing.siblingOrder ?? null) === (expected.siblingOrder ?? null) &&
    existing.text === expected.text &&
    existing.authorId === expected.authorId &&
    existing.authorName === expected.authorName &&
    existing.authorPhoto === expected.authorPhoto &&
    (candidate.synthesizedCreatedAt || existing.createdAt === expected.createdAt) &&
    existing.likes === expected.likes &&
    existing.likedByMe === expected.likedByMe
  );
}

function dependsOnFailedComment(
  candidate: LegacyCommentCandidate,
  pendingById: Map<string, LegacyCommentCandidate>,
  failedIds: Set<string>,
): boolean {
  const visited = new Set<string>();
  let parentId = candidate.stored.parentId ?? null;
  while (parentId) {
    if (failedIds.has(parentId)) return true;
    if (visited.has(parentId)) return false;
    visited.add(parentId);
    parentId = pendingById.get(parentId)?.stored.parentId ?? null;
  }
  return false;
}

export async function migrateLegacyReelComments(
  reels: ReelRepository,
  comments: ReelCommentRepository,
  io: LocalReelsMigrationIO,
  migrationTimestamp = new Date().toISOString(),
): Promise<LegacyCommentsMigrationResult> {
  const emptyResult = {
    found: 0,
    migrated: 0,
    skippedAlreadyPresent: 0,
    orphaned: 0,
    invalid: 0,
    failed: 0,
    synthesizedCreatedAt: 0,
    maxDepth: 0,
    migrationTimestamp,
  };
  const marker = parseReelsMigrationMarker(io.readMarker());
  if (isReelsMigrationStageCompleted(marker, "comments")) {
    return { ...emptyResult, completed: true };
  }
  if (!isReelsMigrationStageCompleted(marker, "reels")) {
    return { ...emptyResult, completed: false, error: "reels-migration-pending" };
  }
  if (!isReelsMigrationStageCompleted(marker, "likes")) {
    return { ...emptyResult, completed: false, error: "likes-migration-pending" };
  }
  if (!io.readComments) {
    return { ...emptyResult, completed: false, error: "comments-source-unavailable" };
  }

  const raw = io.readComments();
  if (raw === null) {
    const completed = completeReelsMigrationStage(io, "comments", 0);
    return {
      ...emptyResult,
      completed,
      error: completed ? undefined : "marker-write-failed",
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ...emptyResult, completed: false, invalid: 1, error: "invalid-json" };
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { ...emptyResult, completed: false, invalid: 1, error: "invalid-structure" };
  }

  const normalized = parseLegacyComments(parsed as Record<string, unknown>, migrationTimestamp);
  let migrated = 0;
  let skippedAlreadyPresent = 0;
  let orphaned = 0;
  let invalid = normalized.invalid;
  let failed = 0;
  const pending: LegacyCommentCandidate[] = [];

  const byReel = new Map<string, LegacyCommentCandidate[]>();
  for (const candidate of normalized.candidates) {
    const list = byReel.get(candidate.stored.reelId) ?? [];
    list.push(candidate);
    byReel.set(candidate.stored.reelId, list);
  }
  for (const [reelId, candidates] of byReel) {
    try {
      if (!(await reels.exists(reelId))) {
        orphaned += candidates.length;
        console.warn(
          `[reels-migration] ${candidates.length} comentário(s) órfão(s) não migrado(s) (reelId=${JSON.stringify(reelId)}).`,
        );
        continue;
      }
      pending.push(...candidates);
    } catch (error) {
      failed += candidates.length;
      console.warn(
        `[reels-migration] falha ao validar Reel "${reelId}" para Comments (retomável).`,
        error,
      );
    }
  }

  const failedIds = new Set<string>();
  const invalidIds = new Set<string>();
  let madeProgress = true;
  while (pending.length > 0 && madeProgress) {
    madeProgress = false;
    for (let index = pending.length - 1; index >= 0; index -= 1) {
      const candidate = pending[index];
      const stored = candidate.stored;
      try {
        const existing = await comments.get(stored.id);
        if (existing) {
          if (storedCommentMatches(existing, candidate)) {
            skippedAlreadyPresent += 1;
          } else {
            invalid += 1;
            invalidIds.add(stored.id);
            console.warn(
              `[reels-migration] conflito no comentário "${stored.id}"; registro existente preservado.`,
            );
          }
          pending.splice(index, 1);
          madeProgress = true;
          continue;
        }

        const parentId = stored.parentId ?? null;
        if (parentId) {
          if (invalidIds.has(parentId)) {
            invalid += 1;
            invalidIds.add(stored.id);
            pending.splice(index, 1);
            madeProgress = true;
            continue;
          }
          if (failedIds.has(parentId)) {
            failed += 1;
            failedIds.add(stored.id);
            pending.splice(index, 1);
            madeProgress = true;
            continue;
          }
          if (pending.some((item) => item.stored.id === parentId)) continue;
          const parent = await comments.get(parentId);
          if (!parent) continue;
          if (parent.reelId !== stored.reelId) {
            invalid += 1;
            invalidIds.add(stored.id);
            pending.splice(index, 1);
            madeProgress = true;
            console.warn(
              `[reels-migration] pai de outro Reel para Comment "${stored.id}"; fonte preservada.`,
            );
            continue;
          }
        }
        await comments.put(stored);
        migrated += 1;
        pending.splice(index, 1);
        madeProgress = true;
      } catch (error) {
        failed += 1;
        failedIds.add(stored.id);
        pending.splice(index, 1);
        madeProgress = true;
        console.warn(
          `[reels-migration] falha ao migrar Comment "${stored.id}" (retomável).`,
          error,
        );
      }
    }
  }

  if (pending.length > 0) {
    const pendingById = new Map(pending.map((candidate) => [candidate.stored.id, candidate]));
    for (const candidate of pending) {
      if (dependsOnFailedComment(candidate, pendingById, failedIds)) {
        failed += 1;
      } else {
        invalid += 1;
      }
      console.warn(
        `[reels-migration] hierarquia não resolvida para Comment "${candidate.stored.id}"; fonte preservada.`,
      );
    }
  }

  const canComplete = orphaned === 0 && invalid === 0 && failed === 0;
  const accountedComments = migrated + skippedAlreadyPresent;
  const completed = canComplete && completeReelsMigrationStage(io, "comments", accountedComments);

  return {
    completed,
    found: normalized.found,
    migrated,
    skippedAlreadyPresent,
    orphaned,
    invalid,
    failed,
    synthesizedCreatedAt: normalized.synthesizedCreatedAt,
    maxDepth: normalized.maxDepth,
    migrationTimestamp,
    error: canComplete && !completed ? "marker-write-failed" : undefined,
  };
}

/* ─── Interface de execução (lazy, supraída pelo app) ─── */

let migrationAdapter: StorageAdapter | null = null;
let migrationRepository: ReelRepository | null = null;
let likeMigrationRepository: ReelLikeRepository | null = null;
let commentMigrationRepository: ReelCommentRepository | null = null;

function getMigrationRepository(): ReelRepository {
  if (!migrationRepository) {
    migrationAdapter = new IndexedDbAdapter(reelsPersistenceSchema);
    migrationRepository = new ReelRepository(migrationAdapter);
  }
  return migrationRepository;
}

function getLikeMigrationRepository(): ReelLikeRepository {
  if (!migrationAdapter) migrationAdapter = new IndexedDbAdapter(reelsPersistenceSchema);
  if (!likeMigrationRepository) {
    likeMigrationRepository = new ReelLikeRepository(migrationAdapter);
  }
  return likeMigrationRepository;
}

function getCommentMigrationRepository(): ReelCommentRepository {
  if (!migrationAdapter) migrationAdapter = new IndexedDbAdapter(reelsPersistenceSchema);
  if (!commentMigrationRepository) {
    commentMigrationRepository = new ReelCommentRepository(migrationAdapter);
  }
  return commentMigrationRepository;
}

function defaultMigrationIO(): LocalReelsMigrationIO {
  return {
    readLegacy: () =>
      typeof localStorage !== "undefined" ? localStorage.getItem(PUBLISHED_KEY) : null,
    readLikes: () => (typeof localStorage !== "undefined" ? localStorage.getItem(LIKES_KEY) : null),
    readComments: () =>
      typeof localStorage !== "undefined" ? localStorage.getItem(COMMENTS_KEY) : null,
    readMarker: () =>
      typeof localStorage !== "undefined" ? localStorage.getItem(REELS_MIGRATION_MARKER_KEY) : null,
    writeMarker: (value) => {
      try {
        if (typeof localStorage !== "undefined") {
          localStorage.setItem(REELS_MIGRATION_MARKER_KEY, value);
          return true;
        }
      } catch {
        // localStorage indisponível/cheio — retomada na próxima execução.
      }
      return false;
    },
  };
}

/**
 * Migração one-time, idempotente e retomável de `published:v1` →
 * `ReelRepository`. NÃO lança exceções para dados legados; falhas são
 * registradas e a migração permanece não-finalizada até resolver.
 * Ponto de chamada lazy recomendado: início do carregamento do Feed na
 * fase 1C-3C-D (Feed passa a ler `ReelRepository`) — ver doc 1C-3C-A §"Quando executar".
 */
export async function ensureLocalReelsLoaded(authenticatedUserId?: string | null): Promise<void> {
  const io = defaultMigrationIO();
  const reels = getMigrationRepository();
  const reelsResult = await migrateLegacyPublishedReels(reels, io);
  if (!reelsResult.completed) {
    console.warn("[reels-migration] execução não finalizada (retomável).", {
      migrated: reelsResult.migrated,
      skippedAlreadyPresent: reelsResult.skippedAlreadyPresent,
      failed: reelsResult.failed,
      invalid: reelsResult.invalid,
    });
    return;
  }

  const userId = resolveReelsMigrationUserId(authenticatedUserId);
  const likesResult = await migrateLegacyReelLikes(reels, getLikeMigrationRepository(), io, userId);
  if (!likesResult.completed) {
    console.warn("[reels-migration] migração de Likes não finalizada (retomável).", {
      migrated: likesResult.migrated,
      skippedAlreadyPresent: likesResult.skippedAlreadyPresent,
      orphaned: likesResult.orphaned,
      invalid: likesResult.invalid,
      failed: likesResult.failed,
      error: likesResult.error,
    });
    return;
  }

  const commentsResult = await migrateLegacyReelComments(
    reels,
    getCommentMigrationRepository(),
    io,
  );
  if (!commentsResult.completed) {
    console.warn("[reels-migration] migração de Comments não finalizada (retomável).", {
      migrated: commentsResult.migrated,
      skippedAlreadyPresent: commentsResult.skippedAlreadyPresent,
      orphaned: commentsResult.orphaned,
      invalid: commentsResult.invalid,
      failed: commentsResult.failed,
      error: commentsResult.error,
    });
  }
}
