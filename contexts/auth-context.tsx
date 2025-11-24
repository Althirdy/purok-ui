/**
 * Auth Context - Manages PIN login and authenticated user
 */

import type { User } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  isSubmitting: boolean;
  loginWithPin: (pin: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  sessionStartMs: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_TOKEN_KEY = '@urbanwatch:auth_token';
const NOTIFICATIONS_STORAGE_KEY = '@urbanwatch:notifications';
const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'https://www.urbanwatch.me';
const LOGIN_ENDPOINT = '/api/v1/login/purok-leader';
const CURRENT_USER_ENDPOINT = '/api/v1/auth/user';
// Control whether session persists across app restarts
const PERSIST_SESSION = false;

async function getApiBase(): Promise<string> {
  return API_BASE;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sessionStartMs, setSessionStartMs] = useState<number>(Date.now());

  useEffect(() => {
    initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initialize = async () => {
    try {
      if (!PERSIST_SESSION) {
        await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, NOTIFICATIONS_STORAGE_KEY]);
        setUser(null);
        return;
      }
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      if (token) {
        await fetchCurrentUser(token);
        setSessionStartMs(Date.now());
      }
    } catch (err) {
      // noop; stay unauthenticated on init failure
    } finally {
      setIsInitializing(false);
    }
  };

  const normalizeUser = (raw: any): User => {
    const id = raw?.id ?? raw?.userId ?? raw?.uid ?? String(raw?.id ?? '');
    // Build name from common variants and split fields
    const firstName = raw?.firstName ?? raw?.first_name ?? '';
    const middleName = raw?.middleName ?? raw?.middle_name ?? '';
    const lastName = raw?.lastName ?? raw?.last_name ?? '';
    const compositeName = [firstName, middleName, lastName].filter(Boolean).join(' ').trim();
    const candidateName = (raw?.name ?? raw?.fullName ?? raw?.full_name ?? raw?.purokLeaderName ?? raw?.purok_leader_name ?? compositeName);
    const name = candidateName && String(candidateName).trim().length > 0 ? String(candidateName) : 'Purok Leader';
    // Map various role casings/labels to internal union
    const rawRole: string = String(raw?.role ?? '').toLowerCase();
    const role: User['role'] = rawRole === 'purok leader' || rawRole === 'purok_leader' ? 'purok_leader'
      : rawRole === 'admin' ? 'admin'
      : 'official';
    const purokId = raw?.purokId ?? raw?.purok_id ?? raw?.purok?.id ?? '';
    const purokName = raw?.purokName ?? raw?.purok_name ?? raw?.purok?.name ?? '';
    const email = raw?.email ?? raw?.emailAddress ?? '';
    const phoneNumber = raw?.phoneNumber ?? raw?.phone_number ?? raw?.phone ?? '';
    const address = raw?.officeAddress ?? raw?.address ?? '';
    return { id, name, role, purokId, purokName, email, phoneNumber, address } as User;
  };

  const fetchCurrentUser = useCallback(async (token: string) => {
    const base = await getApiBase();
    const resp = await fetch(`${base}${CURRENT_USER_ENDPOINT}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!resp.ok) {
      throw new Error(`Failed to fetch user: ${resp.status}`);
    }
    const data = await resp.json();
    const rawUser = (data && (data.user ?? data.data?.user)) ? (data.user ?? data.data?.user) : data;
    setUser(normalizeUser(rawUser));
  }, []);

  const loginWithPin = useCallback(async (pin: string) => {
    setIsSubmitting(true);
    try {
      const base = await getApiBase();
      const resp = await fetch(`${base}${LOGIN_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ pin }),
      });
      if (!resp.ok) {
        const message = await resp
          .json()
          .then(data => data?.message ?? `Login failed: ${resp.status}`)
          .catch(() => `Login failed: ${resp.status}`);
        throw new Error(message);
      }
      const loginData = await resp.json();
      const token: string | undefined = loginData?.token || loginData?.accessToken || loginData?.data?.token;
      if (!token) {
        throw new Error('Login response missing token');
      }
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
      // Optimistically set user from login response if available
      if (loginData?.data?.user) {
        setUser(normalizeUser(loginData.data.user));
      }
      setSessionStartMs(Date.now());
      await fetchCurrentUser(token);
    } finally {
      setIsSubmitting(false);
    }
  }, [fetchCurrentUser]);

  const logout = useCallback(async () => {
    await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, NOTIFICATIONS_STORAGE_KEY]);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) return;
    await fetchCurrentUser(token);
  }, [fetchCurrentUser]);

  const value = useMemo<AuthContextType>(() => ({
    user,
    isAuthenticated: !!user,
    isInitializing,
    isSubmitting,
    loginWithPin,
    logout,
    refreshUser,
    sessionStartMs,
  }), [user, isInitializing, isSubmitting, loginWithPin, logout, refreshUser, sessionStartMs]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}


