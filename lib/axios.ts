// Lightweight API helper using fetch (no axios dependency)
// Defaults to production API if env is not provided
export const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'https://uniniquitous-semimaturely-amie.ngrok-free.dev';

export async function httpGet<T = any>(path: string, init?: RequestInit): Promise<T> {
  const fullUrl = `${API_BASE}${path}`;
  
  // Merge headers properly
  const mergedHeaders = new Headers();
  mergedHeaders.set('Accept', 'application/json');
  mergedHeaders.set('X-Requested-With', 'XMLHttpRequest');
  // Required for ngrok free tier - bypasses the browser warning page
  mergedHeaders.set('ngrok-skip-browser-warning', 'true');
  
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
  
  const response = await fetch(fullUrl, fetchOptions);
  
  // Check content type first
  const contentType = response.headers.get('content-type') || '';
  
  if (contentType.includes('text/html')) {
    const responseText = await response.text();
    console.error('❌ [HTTP] Backend returned HTML instead of JSON - likely authentication issue');
    console.error('📄 Response Text (first 500 chars):', responseText.substring(0, 500));
    throw new Error('Backend returned HTML page - authentication may have failed or session expired');
  }
  
  if (!response.ok) {
    if (contentType.includes('application/json')) {
      try {
        const errorData = await response.json();
        const errorMessage = errorData?.message || errorData?.error || `HTTP ${response.status}`;
        throw new Error(errorMessage);
      } catch (parseError) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
    }
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  if (!contentType.includes('application/json')) {
    const responseText = await response.text();
    console.log('⚠️ [HTTP] Empty or non-JSON response');
    console.log('📄 Response Text:', responseText.substring(0, 500));
    return {} as T;
  }
  
  return (await response.json()) as T;
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
    method: 'POST',
    headers: mergedHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  };
  
  if (init) {
    if (init.credentials) fetchOptions.credentials = init.credentials;
    if (init.mode) fetchOptions.mode = init.mode;
    if (init.cache) fetchOptions.cache = init.cache;
    if (init.redirect) fetchOptions.redirect = init.redirect;
    if (init.referrer) fetchOptions.referrer = init.referrer;
    if (init.signal) fetchOptions.signal = init.signal;
  }
  
  const response = await fetch(fullUrl, fetchOptions);
  
  // Check content type first
  const contentType = response.headers.get('content-type') || '';
  
  if (contentType.includes('text/html')) {
    const responseText = await response.text();
    console.error('❌ [HTTP] Backend returned HTML instead of JSON - likely authentication issue');
    console.error('📄 Response Text (first 500 chars):', responseText.substring(0, 500));
    throw new Error('Backend returned HTML page - authentication may have failed or session expired');
  }
  
  if (!response.ok) {
    if (contentType.includes('application/json')) {
      try {
        const errorData = await response.json();
        const errorMessage = errorData?.message || errorData?.error || `HTTP ${response.status}`;
        throw new Error(errorMessage);
      } catch (parseError) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
    }
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  if (!contentType.includes('application/json')) {
    const responseText = await response.text();
    console.log('⚠️ [HTTP] Empty or non-JSON response');
    console.log('📄 Response Text:', responseText.substring(0, 500));
    return {} as T;
  }
  
  return (await response.json()) as T;
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
  
  // Create fetch options without spreading init (to avoid overriding our settings)
  const fetchOptions: RequestInit = {
    method: 'PUT',
    headers: mergedHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
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
  
  const response = await fetch(fullUrl, fetchOptions);
  
  console.log('📥 [HTTP] Response Status:', response.status, response.statusText);
  
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

// Axios configuration will be added here

