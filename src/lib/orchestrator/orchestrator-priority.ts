/* ============================================================
   CONNEXY
   Phase 9.0
   Orchestrator — Priority Levels
   Pure TypeScript. No React. No side effects.
========================================================== */

export const OrchestratorPriority = {
  CRITICAL: 0,
  HIGH: 1,
  NORMAL: 2,
  LOW: 3,
  BACKGROUND: 4,
} as const;

export type OrchestratorPriorityValue =
  (typeof OrchestratorPriority)[keyof typeof OrchestratorPriority];

export interface PrioritizedTask {
  id: string;
  priority: OrchestratorPriorityValue;
  module: string;
  timestamp: number;
  execute: () => void | Promise<void>;
}

export function comparePriority(
  a: OrchestratorPriorityValue,
  b: OrchestratorPriorityValue,
): number {
  return a - b;
}

export function isHigherPriority(
  a: OrchestratorPriorityValue,
  b: OrchestratorPriorityValue,
): boolean {
  return a < b;
}

const PRIORITY_LABELS: Record<OrchestratorPriorityValue, string> = {
  [OrchestratorPriority.CRITICAL]: "CRITICAL",
  [OrchestratorPriority.HIGH]: "HIGH",
  [OrchestratorPriority.NORMAL]: "NORMAL",
  [OrchestratorPriority.LOW]: "LOW",
  [OrchestratorPriority.BACKGROUND]: "BACKGROUND",
};

export function getPriorityLabel(priority: OrchestratorPriorityValue): string {
  return PRIORITY_LABELS[priority] ?? "UNKNOWN";
}
