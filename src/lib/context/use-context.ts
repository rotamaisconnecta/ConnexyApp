/* ============================================================
   CONNEXY
   Phase 8.3
   Context AI Engine — Hook
============================================================ */

import { useContext } from "react";
import { ContextEngineContext, type ContextEngineValue } from "./context-provider";

export function useContextEngine(): ContextEngineValue {
  const ctx = useContext(ContextEngineContext);
  if (!ctx) {
    throw new Error("useContextEngine must be used within a ContextEngineProvider");
  }
  return ctx;
}
