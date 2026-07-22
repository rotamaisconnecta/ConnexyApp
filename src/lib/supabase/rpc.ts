import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export const RpcHelper = {
  call<F extends keyof Database["public"]["Functions"]>(
    fn: F,
    params?: Database["public"]["Functions"][F]["Args"],
  ) {
    return supabase.rpc(fn, params as Record<string, unknown>);
  },
};
