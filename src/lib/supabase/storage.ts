import { supabase } from "@/integrations/supabase/client";

export const StorageHelper = {
  upload(bucket: string, path: string, file: File, options?: Record<string, unknown>) {
    return supabase.storage.from(bucket).upload(path, file, options);
  },

  getPublicUrl(bucket: string, path: string) {
    return supabase.storage.from(bucket).getPublicUrl(path);
  },

  remove(bucket: string, paths: string[]) {
    return supabase.storage.from(bucket).remove(paths);
  },

  list(bucket: string, prefix?: string) {
    return supabase.storage.from(bucket).list(prefix);
  },
};
