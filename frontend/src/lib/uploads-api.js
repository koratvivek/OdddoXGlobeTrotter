import { getAuthToken } from '@/lib/apiClient';

export async function uploadImage(file) {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api/v1';
  const cleanBase = baseUrl.replace(/\/$/, '');
  const url = `${cleanBase}/uploads/image`;

  const headers = {};
  const token = getAuthToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const body = new FormData();
  body.append('file', file);

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body,
  });

  if (!response.ok) {
    let errorMsg = 'Failed to upload image';
    try {
      const data = await response.json();
      errorMsg = data.detail || data.message || errorMsg;
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  return response.json();
}

export function resolveMediaUrl(url) {
  if (!url) return url;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) {
    return url;
  }
  if (url.startsWith('/uploads/')) {
    return url;
  }
  return url;
}
