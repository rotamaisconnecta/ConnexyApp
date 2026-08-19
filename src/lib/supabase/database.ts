import { supabase } from "@/lib/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export const DatabaseHelper = {
  from<K extends keyof Database["public"]["Tables"]>(table: K) {
    return supabase.from(table);
  },

  rpc<F extends keyof Database["public"]["Functions"]>(
    fn: F,
    params?: Database["public"]["Functions"][F]["Args"],
  ) {
    return supabase.rpc(fn, params as Database["public"]["Functions"][F]["Args"]);
  },
};
