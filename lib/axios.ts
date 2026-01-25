// Lightweight API helper using fetch (no axios dependency)
// Defaults to production API if env is not provided
export const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'https://www.urbanwatch.me';

// Token refresh state management
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;
let refreshSubscribers: Array<(token: string | null) => void> = [];

// Subscribe to token refresh
function subscribeTokenRefresh(callback: (token: string | null) => void) {
  refreshSubscribers.push(callback);
}

// Notify all subscribers when token is refreshed
function onTokenRefreshed(token: string | null) {
  refreshSubscribers.forEach(callback => callback(token));
  refreshSubscribers = [];
}

// Get access token from storage
async function getAccessToken(): Promise<string | null> {
  try {
    const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');
    return await AsyncStorage.getItem('@urbanwatch:auth_token');
  } catch {
    return null;
  }
}

// Refresh token function (will be set by auth context)
let refreshTokenFn: (() => Promise<string | null>) | null = null;

export function setTokenRefreshFunction(fn: () => Promise<string | null>) {
  refreshTokenFn = fn;
}

// Interceptor: Handle 401 errors and refresh token automatically
async function handleResponseWithTokenRefresh<T>(
  response: Response,
  originalRequest: () => Promise<Response>
): Promise<T> {
  // If not 401, process normally
  if (response.status !== 401) {
    return processResponse<T>(response);
  }

  console.log('[HTTP] 🔄 Received 401 Unauthorized - attempting token refresh...');

  // If already refreshing, wait for it
  if (isRefreshing && refreshPromise) {
    return new Promise((resolve, reject) => {
      subscribeTokenRefresh(async (newToken) => {
        if (!newToken) {
          reject(new Error('Token refresh failed'));
          return;
        }
        try {
          // Retry original request with new token
          const retryResponse = await originalRequest();
          const result = await processResponse<T>(retryResponse);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  // Start refresh process
  isRefreshing = true;
  refreshPromise = refreshTokenFn ? refreshTokenFn() : Promise.resolve(null);

  try {
    const newToken = await refreshPromise;
    
    if (!newToken) {
      console.error('[HTTP] ❌ Token refresh failed - forcing logout');
      // Notify subscribers that refresh failed
      onTokenRefreshed(null);
      throw new Error('Token refresh failed - please login again');
    }

    console.log('[HTTP] ✅ Token refreshed successfully, retrying original request...');
    onTokenRefreshed(newToken);

    // Retry original request with new token
    const retryResponse = await originalRequest();
    return await processResponse<T>(retryResponse);
  } catch (error) {
    onTokenRefreshed(null);
    throw error;
  } finally {
    isRefreshing = false;
    refreshPromise = null;
  }
}

// Process response and handle errors
async function processResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type') || '';

  console.log(`[HTTP] 📥 Response Status: ${response.status} ${response.statusText}`);
  console.log(`[HTTP] 📥 Content-Type: ${contentType}`);

  // Check for HTML response (likely auth redirect)
  if (contentType.includes('text/html')) {
    const responseText = await response.text();
    console.error('❌ [HTTP] Backend returned HTML instead of JSON - likely authentication issue');
    console.error('📄 Response Text (first 500 chars):', responseText.substring(0, 500));
    throw new Error('Backend returned HTML page - authentication may have failed or session expired');
  }

  // Handle non-OK responses
  if (!response.ok) {
    console.error(`❌ [HTTP] Error Response: ${response.status} ${response.statusText}`);
    
    // Try to get response body for debugging
    let errorBody = '';
    try {
      errorBody = await response.text();
      console.error('❌ [HTTP] Error Body:', errorBody.substring(0, 1000));
    } catch (e) {
      console.error('❌ [HTTP] Could not read error body');
    }
    
    // Try to parse as JSON if possible
    if (errorBody && contentType.includes('application/json')) {
      try {
        const errorData = JSON.parse(errorBody);
        const errorMessage = errorData?.message || errorData?.error || `HTTP ${response.status}`;
        console.error('❌ [HTTP] Error Message:', errorMessage);
        throw new Error(`HTTP ${response.status}: ${errorMessage}`);
      } catch (parseError) {
        // Not valid JSON
      }
    }
    
    throw new Error(`HTTP ${response.status}: ${response.statusText || errorBody.substring(0, 100)}`);
  }

  // Handle empty or non-JSON responses
  if (!contentType.includes('application/json')) {
    const responseText = await response.text();
    console.log('⚠️ [HTTP] Empty or non-JSON response');
    console.log('📄 Response Text:', responseText.substring(0, 500));
    return {} as T;
  }

  return (await response.json()) as T;
}

export async function httpGet<T = any>(path: string, init?: RequestInit): Promise<T> {
  const fullUrl = `${API_BASE}${path}`;
  
  // Merge headers properly
  const mergedHeaders = new Headers();
  mergedHeaders.set('Accept', 'application/json');
  mergedHeaders.set('X-Requested-With', 'XMLHttpRequest');
  // Required for ngrok free tier - bypasses the browser warning page
  mergedHeaders.set('ngrok-skip-browser-warning', 'true');
  
  // Add authorization header if token is available
  const token = await getAccessToken();
  if (token) {
    mergedHeaders.set('Authorization', `Bearer ${token}`);
  }
  
  if (init?.headers) {
    if (init.headers instanceof Headers) {
      init.headers.forEach((value, key) => {
        mergedHeaders.set(key, value);
      });
    } else if (Array.isArray(init.headers)) {
      init.headers.forEach(([key, value]) => {
        mergedHeaders.set(key, value);
      });
    } else {
      Object.entries(init.headers).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          mergedHeaders.set(key, String(value));
        }
      });
    }
  }
  
  const fetchOptions: RequestInit = {
    method: 'GET',
    headers: mergedHeaders,
  };
  
  if (init) {
    if (init.credentials) fetchOptions.credentials = init.credentials;
    if (init.mode) fetchOptions.mode = init.mode;
    if (init.cache) fetchOptions.cache = init.cache;
    if (init.redirect) fetchOptions.redirect = init.redirect;
    if (init.referrer) fetchOptions.referrer = init.referrer;
    if (init.signal) fetchOptions.signal = init.signal;
  }
  
  // Create a function to retry the request (for token refresh)
  const makeRequest = async (): Promise<Response> => {
    // Update token in headers if it changed
    const currentToken = await getAccessToken();
    if (currentToken) {
      mergedHeaders.set('Authorization', `Bearer ${currentToken}`);
    }
    return fetch(fullUrl, fetchOptions);
  };
  
  const response = await makeRequest();
  
  // Handle 401 with automatic token refresh
  if (response.status === 401) {
    return handleResponseWithTokenRefresh<T>(response, makeRequest);
  }
  
  return processResponse<T>(response);
}

export async function httpPost<T = any>(path: string, body?: any, init?: RequestInit): Promise<T> {
  const fullUrl = `${API_BASE}${path}`;
  
  // Merge headers properly
  const mergedHeaders = new Headers();
  mergedHeaders.set('Content-Type', 'application/json');
  mergedHeaders.set('Accept', 'application/json');
  mergedHeaders.set('X-Requested-With', 'XMLHttpRequest');
  // Required for ngrok free tier - bypasses the browser warning page
  mergedHeaders.set('ngrok-skip-browser-warning', 'true');
  
  // Add authorization header if token is available
  const token = await getAccessToken();
  if (token) {
    mergedHeaders.set('Authorization', `Bearer ${token}`);
  }
  
  if (init?.headers) {
    if (init.headers instanceof Headers) {
      init.headers.forEach((value, key) => {
        mergedHeaders.set(key, value);
      });
    } else if (Array.isArray(init.headers)) {
      init.headers.forEach(([key, value]) => {
        mergedHeaders.set(key, value);
      });
    } else {
      Object.entries(init.headers).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          mergedHeaders.set(key, String(value));
        }
      });
    }
  }
  
  const bodyStr = body !== undefined ? JSON.stringify(body) : undefined;
  
  const fetchOptions: RequestInit = {
    method: 'POST',
    headers: mergedHeaders,
    body: bodyStr,
  };
  
  if (init) {
    if (init.credentials) fetchOptions.credentials = init.credentials;
    if (init.mode) fetchOptions.mode = init.mode;
    if (init.cache) fetchOptions.cache = init.cache;
    if (init.redirect) fetchOptions.redirect = init.redirect;
    if (init.referrer) fetchOptions.referrer = init.referrer;
    if (init.signal) fetchOptions.signal = init.signal;
  }
  
  // Create a function to retry the request (for token refresh)
  const makeRequest = async (): Promise<Response> => {
    // Update token in headers if it changed
    const currentToken = await getAccessToken();
    if (currentToken) {
      mergedHeaders.set('Authorization', `Bearer ${currentToken}`);
    }
    return fetch(fullUrl, fetchOptions);
  };
  
  const response = await makeRequest();
  
  // Handle 401 with automatic token refresh
  if (response.status === 401) {
    return handleResponseWithTokenRefresh<T>(response, makeRequest);
  }
  
  return processResponse<T>(response);
}

export async function httpPut<T = any>(path: string, body?: any, init?: RequestInit): Promise<T> {
  const fullUrl = `${API_BASE}${path}`;
  
  // Merge headers properly - ensure our headers take precedence
  const mergedHeaders = new Headers();
  mergedHeaders.set('Content-Type', 'application/json');
  mergedHeaders.set('Accept', 'application/json');
  mergedHeaders.set('X-Requested-With', 'XMLHttpRequest');
  // Required for ngrok free tier - bypasses the browser warning page
  mergedHeaders.set('ngrok-skip-browser-warning', 'true');
  
  // Add authorization header if token is available
  const token = await getAccessToken();
  if (token) {
    mergedHeaders.set('Authorization', `Bearer ${token}`);
  }
  
  // Add custom headers from init, but don't override our required headers
  if (init?.headers) {
    if (init.headers instanceof Headers) {
      init.headers.forEach((value, key) => {
        mergedHeaders.set(key, value);
      });
    } else if (Array.isArray(init.headers)) {
      init.headers.forEach(([key, value]) => {
        mergedHeaders.set(key, value);
      });
    } else {
      Object.entries(init.headers).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          mergedHeaders.set(key, String(value));
        }
      });
    }
  }
  
  // Log the full request details
  const logHeaders: Record<string, string> = {};
  mergedHeaders.forEach((value, key) => {
    logHeaders[key] = key.toLowerCase() === 'authorization' 
      ? `${value.substring(0, 20)}...` 
      : value;
  });
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📤 [HTTP] PUT Request');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🌐 Full URL:', fullUrl);
  console.log('🔑 Method: PUT');
  console.log('📦 Request Body:', body ? JSON.stringify(body, null, 2) : 'No body');
  console.log('🔐 Headers:', logHeaders);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const bodyStr = body !== undefined ? JSON.stringify(body) : undefined;
  
  // Create fetch options without spreading init (to avoid overriding our settings)
  const fetchOptions: RequestInit = {
    method: 'PUT',
    headers: mergedHeaders,
    body: bodyStr,
  };
  
  // Only copy non-header properties from init
  if (init) {
    if (init.credentials) fetchOptions.credentials = init.credentials;
    if (init.mode) fetchOptions.mode = init.mode;
    if (init.cache) fetchOptions.cache = init.cache;
    if (init.redirect) fetchOptions.redirect = init.redirect;
    if (init.referrer) fetchOptions.referrer = init.referrer;
    if (init.signal) fetchOptions.signal = init.signal;
  }
  
  // Create a function to retry the request (for token refresh)
  const makeRequest = async (): Promise<Response> => {
    // Update token in headers if it changed
    const currentToken = await getAccessToken();
    if (currentToken) {
      mergedHeaders.set('Authorization', `Bearer ${currentToken}`);
    }
    return fetch(fullUrl, fetchOptions);
  };
  
  const response = await makeRequest();
  
  console.log('📥 [HTTP] Response Status:', response.status, response.statusText);
  
  // Handle 401 with automatic token refresh
  if (response.status === 401) {
    return handleResponseWithTokenRefresh<T>(response, makeRequest);
  }
  
  // Check content type first
  const contentType = response.headers.get('content-type') || '';
  const responseHeaders: Record<string, string> = {};
  response.headers.forEach((value, key) => {
    responseHeaders[key] = value;
  });
  
  console.log('📋 [HTTP] Response Headers:', JSON.stringify(responseHeaders, null, 2));
  
  // If response is HTML (likely a redirect to login page), it's an error
  if (contentType.includes('text/html')) {
    const responseText = await response.text();
    console.error('❌ [HTTP] Backend returned HTML instead of JSON - likely authentication issue');
    console.error('📄 Response Text (first 500 chars):', responseText.substring(0, 500));
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    throw new Error('Backend returned HTML page - authentication may have failed or session expired');
  }
  
  if (!response.ok) {
    // Try to parse error message from response
    if (contentType.includes('application/json')) {
      try {
        const errorData = await response.json();
        const errorMessage = errorData?.message || errorData?.error || `HTTP ${response.status}`;
        throw new Error(errorMessage);
      } catch (parseError) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } else {
      // Non-JSON error response
      try {
        const text = await response.text();
        console.error('[HTTP] Non-JSON error response:', text.substring(0, 200));
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      } catch (textError) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    }
  }
  
  // Check if response has JSON content
  if (!contentType.includes('application/json')) {
    // Empty response or non-JSON - log the actual response
    const responseText = await response.text();
    console.log('⚠️ [HTTP] Empty or non-JSON response');
    console.log('📄 Response Text:', responseText.substring(0, 500));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    return {} as T;
  }
  
  try {
    const responseData = await response.json();
    console.log('📦 [HTTP] Response Body:', JSON.stringify(responseData, null, 2));
    
    // Check if response indicates success
    if (responseData.success === false) {
      console.error('❌ [HTTP] Backend returned success: false');
      console.error('📦 Error Response:', JSON.stringify(responseData, null, 2));
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    return responseData as T;
  } catch (parseError) {
    console.error('[HTTP] JSON parse error:', parseError);
    const responseText = await response.text();
    console.error('📄 Response Text (first 500 chars):', responseText.substring(0, 500));
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

// Export function to set up token refresh from auth context
// This should be called during app initialization
export { setTokenRefreshFunction };

