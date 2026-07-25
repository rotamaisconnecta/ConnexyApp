import { useState, useCallback, useEffect } from "react";
import { UserService } from "@/services/user.service";

export function useProfile(userId?: string) {
  const [profile, setProfile] = useState<unknown>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await UserService.getProfile(userId);
      setProfile(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch profile"));
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = useCallback(
    async (data: unknown) => {
      setIsLoading(true);
      try {
        if (!userId) throw new Error("No user ID");
        const result = await UserService.updateProfile(
          userId,
          data as Parameters<typeof UserService.updateProfile>[1],
        );
        setProfile(result);
        return result;
      } finally {
        setIsLoading(false);
      }
    },
    [userId],
  );

  return {
    profile,
    isLoading,
    error,
    updateProfile,
    refetch: fetchProfile,
  };
}
