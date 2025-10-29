// Lightweight API helper using fetch (no axios dependency)
const API_BASE = process.env.EXPO_PUBLIC_API_URL;

async function httpGet<T = any>(path: string): Promise<T> {
  if (!API_BASE) {
    throw new Error('API base URL not configured');
  }
  const response = await fetch(`${API_BASE}${path}`);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return (await response.json()) as T;
}

// Helper to gracefully fallback to mock during development
export async function safeGet<T = any>(url: string, fallback: () => T | Promise<T>) {
  // If API base url is not set, immediately return fallback without trying network
  if (!API_BASE) {
    return await fallback();
  }
  try {
    return await httpGet<T>(url);
  } catch (err) {
    return await fallback();
  }
}

// Axios configuration will be added here

