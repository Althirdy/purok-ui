// Lightweight API helper using fetch (no axios dependency)
// Defaults to production API if env is not provided
const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'https://www.urbanwatch.me';

async function httpGet<T = any>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'GET',
    headers: { 'Accept': 'application/json', ...(init?.headers || {}) },
    ...init,
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return (await response.json()) as T;
}

export async function httpPost<T = any>(path: string, body?: any, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(init?.headers || {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    ...init,
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return (await response.json()) as T;
}

export async function httpPut<T = any>(path: string, body?: any, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(init?.headers || {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    ...init,
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return (await response.json()) as T;
}

// Helper to gracefully fallback to mock during development
export async function safeGet<T = any>(url: string, fallback: () => T | Promise<T>) {
  try {
    return await httpGet<T>(url);
  } catch (err) {
    return await fallback();
  }
}

// Axios configuration will be added here

