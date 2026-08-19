import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";
import { isPublicSupabaseConfigured } from "@/lib/supabase/config";
import { currentUser } from "@/lib/mock-data";

const developmentMockUser = { id: currentUser.id } as User;

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isPublicSupabaseConfigured()) {
      if (import.meta.env.DEV) setUser(developmentMockUser);
      setLoading(false);
      return;
    }

    let hydrated = false;
    const { data: sub } = supabase.auth.onAuthStateChange((_ev, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (!hydrated) setLoading(false);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      hydrated = true;
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return { session, user, loading };
}
