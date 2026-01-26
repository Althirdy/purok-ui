/**
 * Auth Context - Manages PIN login and authenticated user
 */

import { setTokenRefreshFunction, API_BASE } from '@/lib/axios';
import { resetPusherClient } from '@/services/realtime-service';
import type { User } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  isSubmitting: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  loginWithPin: (pin: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  refreshAccessToken: () => Promise<string | null>;
  sessionStartMs: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_TOKEN_KEY = '@urbanwatch:auth_token';
const REFRESH_TOKEN_KEY = '@urbanwatch:refresh_token';
const NOTIFICATIONS_STORAGE_KEY = '@urbanwatch:notifications';

const LOGIN_ENDPOINT = '/api/v1/auth/login/purok_leader';
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
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);

  useEffect(() => {
    initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Register refresh function with axios interceptor when available
  useEffect(() => {
    setTokenRefreshFunction(refreshAccessToken);
  }, [refreshAccessToken]);

  const initialize = async () => {
    try {
      if (!PERSIST_SESSION) {
        await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, REFRESH_TOKEN_KEY, NOTIFICATIONS_STORAGE_KEY]);
        setUser(null);
        setAccessToken(null);
        setRefreshToken(null);
        return;
      }
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      const storedRefreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
      if (token) {
        await fetchCurrentUser(token);
        setSessionStartMs(Date.now());
        setAccessToken(token);
        setRefreshToken(storedRefreshToken);
      }
    } catch (err) {
      // noop; stay unauthenticated on init failure
    } finally {
      setIsInitializing(false);
    }
  };

  const normalizeUser = (raw: any): User => {
    // Ensure ID is a string (Pusher channel names need string IDs)
    const id = raw?.id != null ? String(raw.id) : raw?.userId ?? raw?.uid ?? '';
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
        'ngrok-skip-browser-warning': 'true', // Required for ngrok free tier
      },
    });
    if (!resp.ok) {
      throw new Error(`Failed to fetch user: ${resp.status}`);
    }
    const data = await resp.json();
    // API returns flat user object: { id, name, email, role_id, created_at }
    // Not nested in data.user or data.data.user
    const rawUser = data?.user ?? data?.data?.user ?? data;
    console.log('[Auth] Fetched user data:', { id: rawUser?.id, name: rawUser?.name, role_id: rawUser?.role_id });
    setUser(normalizeUser(rawUser));
  }, []);

  const loginWithPin = useCallback(async (pin: string) => {
    setIsSubmitting(true);
    try {
      const base = await getApiBase();
      const url = `${base}${LOGIN_ENDPOINT}`;

      console.log('[Auth] Logging in to:', url);
      console.log('[Auth] PIN being sent:', pin, 'type:', typeof pin, 'length:', pin.length);

      // Ensure pin is trimmed - backend expects pin as STRING
      const cleanPin = String(pin).trim();

      // Send PIN as string (backend validation requires: 'pin' => 'required|string')
      const bodyStr = JSON.stringify({ pin: cleanPin });
      console.log('[Auth] Request body:', bodyStr);

      // Try JSON format - Laravel accepts both JSON and form-data
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true', // Required for ngrok free tier
        },
        body: bodyStr,
      });

      console.log('[Auth] Response status:', resp.status);

      // Get response text first for debugging
      const responseText = await resp.text();
      console.log('[Auth] Response body:', responseText.substring(0, 500));

      // Parse as JSON
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        console.error('[Auth] Failed to parse response as JSON');
        throw new Error('Invalid response from server');
      }

      if (!resp.ok) {
        const message = responseData?.message ?? `Login failed: ${resp.status}`;
        console.error('[Auth] Login failed:', message);
        throw new Error(message);
      }

      // Use the already-parsed response data
      const loginData = responseData?.data ?? responseData;
      const token: string | undefined = loginData?.token || loginData?.accessToken || responseData?.token;
      const refreshTokenValue: string | undefined = loginData?.refreshToken || responseData?.refreshToken;

      if (!token) {
        console.error('[Auth] Login response missing token:', {
          hasToken: !!loginData?.token,
          hasAccessToken: !!loginData?.accessToken,
          hasDataToken: !!responseData?.token,
          loginDataKeys: Object.keys(loginData || {}),
          responseDataKeys: Object.keys(responseData || {}),
        });
        throw new Error('Login response missing token');
      }

      if (!refreshTokenValue) {
        console.warn('[Auth] ⚠️ Login response missing refreshToken - token refresh will not work');
      }

      console.log('[Auth] ✅ Token extracted from login response:', {
        tokenLength: token.length,
        tokenPrefix: token.substring(0, 20) + '...',
        hasRefreshToken: !!refreshTokenValue,
        refreshTokenPrefix: refreshTokenValue ? refreshTokenValue.substring(0, 20) + '...' : 'none',
      });

      // Store both tokens
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
      if (refreshTokenValue) {
        await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshTokenValue);
      }
      setAccessToken(token);
      setRefreshToken(refreshTokenValue || null);
      console.log('[Auth] ✅ Tokens stored in AsyncStorage and context');

      // Optimistically set user from login response if available
      if (loginData?.user) {
        setUser(normalizeUser(loginData.user));
      }
      setSessionStartMs(Date.now());
      await fetchCurrentUser(token);
    } finally {
      setIsSubmitting(false);
    }
  }, [fetchCurrentUser]);

  const logout = useCallback(async () => {
    await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, REFRESH_TOKEN_KEY, NOTIFICATIONS_STORAGE_KEY]);
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) return;
    await fetchCurrentUser(token);
  }, [fetchCurrentUser]);

  const refreshAccessToken = useCallback(async (): Promise<string | null> => {
    try {
      const storedRefreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
      if (!storedRefreshToken) {
        console.warn('[Auth] No refresh token available');
        return null;
      }

      const base = await getApiBase();
      const url = `${base}/api/v1/refresh-token`;

      console.log('[Auth] 🔄 Refreshing access token...');

      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${storedRefreshToken}`,
          'ngrok-skip-browser-warning': 'true',
        },
      });

      if (!resp.ok) {
        const errorText = await resp.text();
        console.error('[Auth] ❌ Token refresh failed:', resp.status, errorText);

        // If refresh token is expired/invalid, logout
        if (resp.status === 401 || resp.status === 403) {
          console.log('[Auth] 🔒 Refresh token expired, logging out...');
          await logout();
        }
        return null;
      }

      const responseData = await resp.json();
      const data = responseData?.data ?? responseData;
      const newAccessToken = data?.token;
      const newRefreshToken = data?.refreshToken;

      if (!newAccessToken) {
        console.error('[Auth] ❌ Refresh response missing token');
        return null;
      }

      // Update stored tokens
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, newAccessToken);
      if (newRefreshToken) {
        await AsyncStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
        setRefreshToken(newRefreshToken);
      }
      setAccessToken(newAccessToken);

      // Reset Pusher client to reconnect with new token
      resetPusherClient();

      console.log('[Auth] ✅ Access token refreshed successfully');
      return newAccessToken;
    } catch (error) {
      console.error('[Auth] ❌ Error refreshing token:', error);
      return null;
    }
  }, [logout]);

  const value = useMemo<AuthContextType>(() => ({
    user,
    isAuthenticated: !!user,
    isInitializing,
    isSubmitting,
    accessToken,
    refreshToken,
    loginWithPin,
    logout,
    refreshUser,
    refreshAccessToken,
    sessionStartMs,
  }), [user, isInitializing, isSubmitting, accessToken, refreshToken, loginWithPin, logout, refreshUser, refreshAccessToken, sessionStartMs]);

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
