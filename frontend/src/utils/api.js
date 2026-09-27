export const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');

export const getAuthToken = () => {
  try {
    return localStorage.getItem('jalsah_access_token') || '';
  } catch (e) {
    return '';
  }
};

export const authFetch = async (endpoint, options = {}) => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;

  return fetch(url, {
    ...options,
    headers
  });
};

export const parseApiResponse = async (response) => {
  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json')
    ? await response.json()
    : { detail: await response.text() };

  if (!response.ok) {
    throw new Error(payload.detail || payload.message || `فشل الطلب (${response.status})`);
  }

  return payload;
};
