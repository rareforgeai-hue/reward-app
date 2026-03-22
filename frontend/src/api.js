const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

async function request(path, token) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const response = await fetch(`${API_BASE}${path}`, { headers });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = payload?.error || `Request failed (${response.status})`;
    throw new Error(message);
  }

  return payload;
}

export function fetchOffers(token) {
  return request('/api/offers', token);
}

export function fetchWallet(token) {
  return request('/api/wallet', token);
}
