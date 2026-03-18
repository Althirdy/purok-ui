/**
 * Auth Context - Manages PIN login and authenticated user
 */

import { setPinChangeRequiredCallback, setTokenRefreshFunction } from '@/lib/axios';
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
  requiresPinChange: boolean;
  setRequiresPinChange: (value: boolean) => void;
  verifyId: (idNumber: string) => Promise<{ name: string; id_number: string }>;
  loginWithCredentials: (idNumber: string, pin: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  refreshAccessToken: () => Promise<string | null>;
  updateTokensAfterPinChange: (newToken: string, newRefreshToken: string) => Promise<void>;
  idNumber: string | null;
  verifiedName: string | null;
  clearVerifiedId: () => void;
  sessionStartMs: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_TOKEN_KEY = '@urbanwatch:auth_token';
const REFRESH_TOKEN_KEY = '@urbanwatch:refresh_token';
const NOTIFICATIONS_STORAGE_KEY = '@urbanwatch:notifications';
const WELCOME_DISMISSED_KEY = '@urbanwatch:welcome_dismissed';
// Default to production URL
// For development, set EXPO_PUBLIC_API_URL to ngrok URL in .env
const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'https://www.urbanwatch.me';
const LOGIN_ENDPOINT = '/api/v1/auth/login/purok_leader';
const VERIFY_ID_ENDPOINT = '/api/v1/auth/login/purok_leader/verify-id';
const CURRENT_USER_ENDPOINT = '/api/v1/auth/user';
const ID_NUMBER_KEY = '@urbanwatch:id_number';
const VERIFIED_NAME_KEY = '@urbanwatch:verified_name';
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
  const [requiresPinChange, setRequiresPinChange] = useState(false);
  const [idNumber, setIdNumber] = useState<string | null>(null);
  const [verifiedName, setVerifiedName] = useState<string | null>(null);

  useEffect(() => {
    initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const initialize = async () => {
    try {
      // Always load saved ID number for returning users
      const savedIdNumber = await AsyncStorage.getItem(ID_NUMBER_KEY);
      const savedName = await AsyncStorage.getItem(VERIFIED_NAME_KEY);
      if (savedIdNumber) {
        setIdNumber(savedIdNumber);
      }
      if (savedName) {
        setVerifiedName(savedName);
      }

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
    // Try many variants for purok name - the backend may return it in various structures
    const rawPurok = raw?.purok;
    console.log('[Auth] Raw purok data:', JSON.stringify(rawPurok));
    console.log('[Auth] Raw user purok fields:', { purokName: raw?.purokName, purok_name: raw?.purok_name, purok_location: raw?.purok_location });
    let purokName = raw?.purokName
      ?? raw?.purok_name
      ?? raw?.purok_location
      ?? rawPurok?.name
      ?? rawPurok?.purok_name
      ?? rawPurok?.display_name
      ?? rawPurok?.location_name
      ?? '';
    // If purokName is still empty but we have purok sub-fields, construct it
    if (!purokName && rawPurok) {
      const purokNum = rawPurok?.purok_number ?? rawPurok?.number ?? '';
      const purokLoc = rawPurok?.location ?? rawPurok?.location_name ?? rawPurok?.sitio ?? '';
      if (purokNum || purokLoc) {
        purokName = [purokNum, purokLoc].filter(Boolean).join(' - ');
      }
    }
    const email = raw?.email ?? raw?.emailAddress ?? '';
    const phoneNumber = raw?.phoneNumber ?? raw?.phone_number ?? raw?.phone ?? '';
    const address = raw?.officeAddress ?? raw?.address ?? '';
    // Prefer the full URL if available, otherwise use the path
    const profilePicture = raw?.profilePhotoUrl ?? raw?.profile_photo_url ?? raw?.profile_photo_path ?? raw?.profilePicture ?? raw?.profile_picture ?? raw?.avatar ?? raw?.avatarUrl ?? raw?.avatar_url ?? '';
    return { id, name, role, purokId, purokName, email, phoneNumber, address, profilePicture } as User;
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
    console.log('[Auth] Fetched user FULL raw data:', JSON.stringify(rawUser).substring(0, 1000));
    console.log('[Auth] Fetched user data:', { id: rawUser?.id, name: rawUser?.name, role_id: rawUser?.role_id });
    setUser(normalizeUser(rawUser));
  }, []);

  const verifyId = useCallback(async (idNum: string): Promise<{ name: string; id_number: string }> => {
    setIsSubmitting(true);
    try {
      const base = await getApiBase();
      const url = `${base}${VERIFY_ID_ENDPOINT}`;
      const cleanId = String(idNum).trim();

      console.log('[Auth] Verifying ID:', cleanId);

      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify({ id_number: cleanId }),
      });

      const responseText = await resp.text();
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        console.error('[Auth] Failed to parse verify-id response');
        throw new Error('Invalid response from server');
      }

      if (!resp.ok) {
        const message = responseData?.message ?? 'ID Number not found';
        console.error('[Auth] Verify ID failed:', message);
        throw new Error(message);
      }

      const data = responseData?.data ?? responseData;
      const name = data?.name ?? 'Purok Leader';
      const returnedId = data?.id_number ?? cleanId;

      await AsyncStorage.setItem(ID_NUMBER_KEY, returnedId);
      await AsyncStorage.setItem(VERIFIED_NAME_KEY, name);
      setIdNumber(returnedId);
      setVerifiedName(name);

      console.log('[Auth] ✅ ID verified:', { name, id_number: returnedId });
      return { name, id_number: returnedId };
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const loginWithCredentials = useCallback(async (idNum: string, pin: string) => {
    setIsSubmitting(true);
    try {
      const base = await getApiBase();
      const url = `${base}${LOGIN_ENDPOINT}`;
      const cleanPin = String(pin).trim();
      const cleanId = String(idNum).trim();

      console.log('[Auth] Logging in with ID + PIN to:', url);

      const bodyStr = JSON.stringify({ id_number: cleanId, pin: cleanPin });
      console.log('[Auth] Request body:', bodyStr);

      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'ngrok-skip-browser-warning': 'true',
        },
        body: bodyStr,
      });

      console.log('[Auth] Response status:', resp.status);

      const responseText = await resp.text();
      console.log('[Auth] Response body:', responseText.substring(0, 500));

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

      // Store tokens and ID
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
      if (refreshTokenValue) {
        await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshTokenValue);
      }
      await AsyncStorage.setItem(ID_NUMBER_KEY, cleanId);
      setAccessToken(token);
      setRefreshToken(refreshTokenValue || null);
      setIdNumber(cleanId);
      console.log('[Auth] ✅ Tokens stored in AsyncStorage and context');

      // Optimistically set user from login response if available
      if (loginData?.user) {
        setUser(normalizeUser(loginData.user));
      }
      setSessionStartMs(Date.now());
      await fetchCurrentUser(token);

      // Probe a protected purok-leader endpoint to detect forced PIN change
      try {
        const probeUrl = `${base}/api/v1/purok-leader/assigned-concerns`;
        await fetch(probeUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
            'X-Requested-With': 'XMLHttpRequest',
            'ngrok-skip-browser-warning': 'true',
          },
        }).then(async (probeResp) => {
          if (probeResp.status === 401) {
            const probeBody = await probeResp.text();
            if (probeBody.includes('change your default PIN') || probeBody.includes('change your PIN')) {
              console.log('[Auth] 🔒 Default PIN detected during login - requiring PIN change');
              setRequiresPinChange(true);
            }
          }
        });
      } catch (probeErr) {
        console.log('[Auth] ⚠️ PIN change probe failed (will detect lazily):', probeErr);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [fetchCurrentUser]);

  const clearVerifiedId = useCallback(async () => {
    setVerifiedName(null);
    setIdNumber(null);
    await AsyncStorage.multiRemove([ID_NUMBER_KEY, VERIFIED_NAME_KEY]);
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, REFRESH_TOKEN_KEY, NOTIFICATIONS_STORAGE_KEY, WELCOME_DISMISSED_KEY]);
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    setRequiresPinChange(false);
    // Note: idNumber and verifiedName are NOT cleared — so returning users skip Step 1
  }, []);

  const updateTokensAfterPinChange = useCallback(async (newToken: string, newRefreshToken: string) => {
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, newToken);
    await AsyncStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
    setAccessToken(newToken);
    setRefreshToken(newRefreshToken);
    setRequiresPinChange(false);
    // Reset Pusher client to reconnect with new token
    resetPusherClient();
    console.log('[Auth] ✅ Tokens updated after PIN change');
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

  // Register refresh function and PIN change callback with axios interceptor
  useEffect(() => {
    setTokenRefreshFunction(refreshAccessToken);
    setPinChangeRequiredCallback(() => {
      console.log('[Auth] 🔒 PIN change required - setting flag');
      setRequiresPinChange(true);
    });
  }, [refreshAccessToken]);

  const value = useMemo<AuthContextType>(() => ({
    user,
    isAuthenticated: !!user,
    isInitializing,
    isSubmitting,
    accessToken,
    refreshToken,
    requiresPinChange,
    setRequiresPinChange,
    verifyId,
    loginWithCredentials,
    logout,
    refreshUser,
    refreshAccessToken,
    updateTokensAfterPinChange,
    idNumber,
    verifiedName,
    clearVerifiedId,
    sessionStartMs,
  }), [user, isInitializing, isSubmitting, accessToken, refreshToken, requiresPinChange, verifyId, loginWithCredentials, logout, refreshUser, refreshAccessToken, updateTokensAfterPinChange, idNumber, verifiedName, clearVerifiedId, sessionStartMs]);

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


