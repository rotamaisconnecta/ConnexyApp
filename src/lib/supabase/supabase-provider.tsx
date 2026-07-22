import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "./client";
import type { Session } from "@supabase/supabase-js";

interface SupabaseContextValue {
  session: Session | null;
  isLoading: boolean;
}

const SupabaseContext = createContext<SupabaseContextValue | null>(null);

export function useSupabaseContext(): SupabaseContextValue {
  const ctx = useContext(SupabaseContext);
  if (!ctx) throw new Error("useSupabaseContext must be used within SupabaseProvider");
  return ctx;
}

interface SupabaseProviderProps {
  children: ReactNode;
}

export function SupabaseProvider({ children }: SupabaseProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setIsLoading(false);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <SupabaseContext.Provider value={{ session, isLoading }}>
      {children}
    </SupabaseContext.Provider>
  );
}
