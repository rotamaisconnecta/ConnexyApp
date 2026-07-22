import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { AuthService } from '@/services/auth-service';

interface AuthContextValue {
  user: unknown;
  session: unknown;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<unknown>;
  signUp: (email: string, password: string) => Promise<unknown>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<unknown>(null);
  const [session, setSession] = useState<unknown>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = AuthService.onAuthStateChange((newSession, newUser) => {
      setSession(newSession);
      setUser(newUser);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const result = await AuthService.signIn(email, password);
    setSession(result.session);
    setUser(result.user);
    return result;
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const result = await AuthService.signUp(email, password);
    setSession(result.session);
    setUser(result.user);
    return result;
  }, []);

  const signOut = useCallback(async () => {
    await AuthService.signOut();
    setSession(null);
    setUser(null);
  }, []);

  const value: AuthContextValue = {
    user,
    session,
    isLoading,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
