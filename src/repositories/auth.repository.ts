import { supabase } from "@/lib/supabase/client";
import { SupabaseError } from "@/lib/supabase/errors";

export const AuthRepository = {
  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw new SupabaseError(error.message, error.status);
    return data;
  },

  async getUser() {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw new SupabaseError(error.message, error.status);
    return data;
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw new SupabaseError(error.message, error.status);
    return data;
  },

  async signUp(
    email: string,
    password: string,
    metadata?: Record<string, unknown>
  ) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata },
    });
    if (error) throw new SupabaseError(error.message, error.status);
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw new SupabaseError(error.message, error.status);
  },

  async resetPassword(email: string) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw new SupabaseError(error.message, error.status);
    return data;
  },

  async updateProfile(data: Record<string, unknown>) {
    const { data: updated, error } = await supabase.auth.updateUser({ data });
    if (error) throw new SupabaseError(error.message, error.status);
    return updated;
  },

  onAuthStateChange(
    callback: (
      event: string,
      session: { user: { id: string; email: string } } | null
    ) => void
  ) {
    return supabase.auth.onAuthStateChange(callback);
  },
};
