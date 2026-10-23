/* =========================================================
   splash-permissions.ts — Gate de permissão para gestão da
   splash, reutilizando o guard canManageCampaigns existente.
   Nenhuma permissão é concedida artificialmente.
========================================================= */

import { UserRole } from "@/lib/roles/roles-types";
import { canManageCampaigns } from "@/lib/roles/roles-guards";

/** Usuario pode gerenciar a splash (campaigns) com os papeis atuais. */
export function canManageSplash(roles: UserRole[]): boolean {
  return canManageCampaigns(roles);
}