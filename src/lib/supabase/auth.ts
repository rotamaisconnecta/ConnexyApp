import { supabase } from "@/integrations/supabase/client";

export const AuthHelper = {
  signUp(email: string, password: string) {
    return supabase.auth.signUp({ email, password });
  },

  signIn(email: string, password: string) {
    return supabase.auth.signInWithPassword({ email, password });
  },

  signOut() {
    return supabase.auth.signOut();
  },

  resetPassword(email: string) {
    return supabase.auth.resetPasswordForEmail(email);
  },

  updatePassword(password: string) {
    return supabase.auth.updateUser({ password });
  },

  getSession() {
    return supabase.auth.getSession();
  },

  getUser() {
    return supabase.auth.getUser();
  },

  onAuthStateChange(callback: Parameters<typeof supabase.auth.onAuthStateChange>[0]) {
    return supabase.auth.onAuthStateChange(callback);
  },
};
