import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { supabase, isSupabaseAuthConfigured } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const mockUser = {
    id: 'mock-user-id',
    email: 'portfolio-demo@applyflow.com',
  };
  const mockSession = {
    user: mockUser,
  };

  const [session, setSession] = useState(mockSession);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Supabase auth is bypassed entirely for the portfolio demo
  }, []);

  const signOut = useCallback(async () => {
    setSession(mockSession);
  }, [mockSession]);

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      isConfigured: isSupabaseAuthConfigured(),
      signOut,
    }),
    [session, loading, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
