import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";
import { isPublicSupabaseConfigured } from "@/lib/supabase/config";
import { currentUser } from "@/lib/mock-data";
import { isDemoMode } from "@/lib/demo/demo-config";
import { isDemoAuthenticated } from "@/lib/demo/demo-auth";

const developmentMockUser = { id: currentUser.id } as User;

const demoUser: User = {
  id: currentUser.id,
  email: "demo@connexy.local",
  app_metadata: {},
  user_metadata: { name: currentUser.name },
  aud: "demo",
  created_at: new Date(0).toISOString(),
} as User;

const demoSession: Session = {
  access_token: "demo",
  refresh_token: "demo",
  token_type: "bearer",
  expires_in: 0,
  expires_at: 0,
  user: demoUser,
} as Session;

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDemoMode()) {
      if (isDemoAuthenticated()) {
        setSession(demoSession);
        setUser(demoUser);
      } else {
        setSession(null);
        setUser(null);
      }
      setLoading(false);
      return;
    }

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
