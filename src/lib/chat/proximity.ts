/* =========================================================
   chat/proximity.ts — Location privacy for chat conversations
   Pure TypeScript. No React. No side effects. No Supabase.

   Privacy rule (Connexy): exact distance is hidden up to 2 km,
   replaced with smart proximity categories. Above 2 km the
   distance may be shown in kilometers.
   Ready for Supabase: just pass meters from DB, no UI changes.
========================================================= */

export function formatChatProximity(distanceMeters: number): string {
  if (distanceMeters <= 500) return "Muito perto";
  if (distanceMeters <= 1000) return "Na mesma região";
  if (distanceMeters <= 2000) return "Perto de você";
  const km = (distanceMeters / 1000).toFixed(1).replace(".", ",");
  return `${km} km de distância`;
}
