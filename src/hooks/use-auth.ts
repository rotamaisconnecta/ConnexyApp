import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";
import { isPublicSupabaseConfigured } from "@/lib/supabase/config";
import { currentUser } from "@/lib/mock-data";
import { isDemoMode } from "@/lib/demo/demo-config";
import { isDemoAuthenticated } from "@/lib/demo/demo-auth";
import { useDemoIdentity } from "@/lib/demo/demo-identity";

const developmentMockUser = { id: currentUser.id } as User;

function createDemoSession(identity: { id: string; name: string }): Session {
  const demoUser: User = {
    id: identity.id,
    email: `${identity.id}@demo.connexy.local`,
    app_metadata: {},
    user_metadata: { name: identity.name, demo_identity: true },
    aud: "demo",
    created_at: new Date(0).toISOString(),
  } as User;
  return {
    access_token: "demo",
    refresh_token: "demo",
    token_type: "bearer",
    expires_in: 0,
    expires_at: 0,
    user: demoUser,
  } as Session;
}

export function useAuth() {
  const demoIdentity = useDemoIdentity();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const applyAuthState = (nextSession: Session | null) => {
      if (!active) return;
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(false);
    };

    if (isDemoMode()) {
      if (isDemoAuthenticated()) {
        const demoSession = createDemoSession(demoIdentity);
        applyAuthState(demoSession);
      } else {
        applyAuthState(null);
      }
      return;
    }

    if (!isPublicSupabaseConfigured()) {
      if (import.meta.env.DEV && active) setUser(developmentMockUser);
      if (active) setLoading(false);
      return;
    }

    const { data: sub } = supabase.auth.onAuthStateChange((_ev, s) => {
      applyAuthState(s);
    });
    supabase.auth.getSession().then(({ data }) => {
      applyAuthState(data.session);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [demoIdentity]);

  return { session, user, loading };
}
