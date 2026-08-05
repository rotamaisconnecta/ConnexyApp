import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase as generatedClient } from "@/integrations/supabase/client";

/**
 * Loosely-typed alias of the generated client.
 * The repository layer targets tables that are not part of the generated
 * database types yet, so it opts out of the strict table-name typing.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase = generatedClient as unknown as SupabaseClient<any, "public", any>;
