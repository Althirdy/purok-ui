// Lightweight API helper using fetch (no axios dependency)
// Defaults to production API if env is not provided
export const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'https://www.urbanwatch.me';

export async function httpGet<T = any>(path: string, init?: RequestInit): Promise<T> {
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
    // Try to parse error message from response
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      try {
        const errorData = await response.json();
        const errorMessage = errorData?.message || errorData?.error || `HTTP ${response.status}`;
        throw new Error(errorMessage);
      } catch (parseError) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } else {
      // HTML response (error page) - read text to see what the error is
      try {
        const text = await response.text();
        console.error('[HTTP] Non-JSON error response:', text.substring(0, 200));
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      } catch (textError) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    }
  }
  
  // Check if response has content before parsing JSON
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    // Empty response or non-JSON - return empty object
    return {} as T;
  }
  
  try {
    return (await response.json()) as T;
  } catch (parseError) {
    console.error('[HTTP] JSON parse error:', parseError);
    throw new Error('Invalid JSON response from server');
  }
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

