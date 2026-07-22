import { useState, useCallback } from 'react';
import { AuthService } from '@/services/auth-service';

export function useAuth() {
  const [session, setSession] = useState<unknown>(null);
  const [user, setUser] = useState<unknown>(null);
  const [isLoading, setIsLoading] = useState(false);

  const signIn = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const result = await AuthService.signIn(email, password);
      setSession(result.session);
      setUser(result.user);
      return result;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const result = await AuthService.signUp(email, password);
      setSession(result.session);
      setUser(result.user);
      return result;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    setIsLoading(true);
    try {
      await AuthService.signOut();
      setSession(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    setIsLoading(true);
    try {
      return await AuthService.resetPassword(email);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    session,
    user,
    isLoading,
    signIn,
    signUp,
    signOut,
    resetPassword,
  };
}
