import { supabase } from "@/lib/supabase/client";
import { parseSupabaseError } from "@/lib/supabase/errors";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";

export const AuthRepository = {
  async getSession() {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw parseSupabaseError(error);
      return data;
    } catch (error) {
      throw parseSupabaseError(error);
    }
  },

  async getUser() {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error) throw parseSupabaseError(error);
      return data;
    } catch (error) {
      throw parseSupabaseError(error);
    }
  },

  async signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw parseSupabaseError(error);
      return data;
    } catch (error) {
      throw parseSupabaseError(error);
    }
  },

  async signUp(
    email: string,
    password: string,
    metadata?: Record<string, unknown>
  ) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: metadata },
      });
      if (error) throw parseSupabaseError(error);
      return data;
    } catch (error) {
      throw parseSupabaseError(error);
    }
  },

  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw parseSupabaseError(error);
    } catch (error) {
      throw parseSupabaseError(error);
    }
  },

  async resetPassword(email: string) {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw parseSupabaseError(error);
      return data;
    } catch (error) {
      throw parseSupabaseError(error);
    }
  },

  async updateProfile(data: Record<string, unknown>) {
    try {
      const { data: updated, error } = await supabase.auth.updateUser({ data });
      if (error) throw parseSupabaseError(error);
      return updated;
    } catch (error) {
      throw parseSupabaseError(error);
    }
  },

  onAuthStateChange(
    callback: (event: AuthChangeEvent, session: Session | null) => void
  ) {
    return supabase.auth.onAuthStateChange(callback);
  },
};
