import { supabase } from "@/lib/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export const RpcHelper = {
  call<F extends keyof Database["public"]["Functions"]>(
    fn: F,
    params?: Database["public"]["Functions"][F]["Args"],
  ) {
    return supabase.rpc(fn, params as Database["public"]["Functions"][F]["Args"]);
  },
};
