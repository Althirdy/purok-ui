import React, { createContext, useContext, useMemo, useState } from 'react';

type AuthState = {
  isAuthenticated: boolean;
  purokId?: string;
};

type AuthContextValue = AuthState & {
  login: (pin: string, purokId?: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ isAuthenticated: false });

  const login = async (pin: string, purokId = '176E') => {
    // TEMP: in-memory auth; accept only 1234
    if (pin !== '1234') {
      throw new Error('Invalid PIN');
    }
    setState({ isAuthenticated: true, purokId });
  };

  const logout = async () => {
    setState({ isAuthenticated: false });
  };

  const value = useMemo<AuthContextValue>(() => ({ ...state, login, logout }), [state]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}


