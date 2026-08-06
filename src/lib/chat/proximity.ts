/* =========================================================
   chat/proximity.ts — Location privacy for chat conversations
   Pure TypeScript. No React. No side effects. No Supabase.

   Privacy rule (Connexy): exact distance is hidden up to 2 km,
   replaced with smart proximity categories. Above 2 km the
   distance may be shown in kilometers.
   Delegates to the shared formatProtectedProximity rule.
   Ready for Supabase: just pass meters from DB, no UI changes.
========================================================= */

import { formatProtectedProximity } from "@/lib/proximity";

export function formatChatProximity(distanceMeters: number): string {
  return formatProtectedProximity(distanceMeters);
}
