// Client API minimal — à adapter avec l'URL réelle du backend en production.
const API_BASE = window.API_BASE_URL || 'http://localhost:4000/api';

async function apiRequest(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = localStorage.getItem('ac_token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}${path}`, {
    method, headers, body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Erreur réseau');
  return data;
}

const api = {
  register: (payload) => apiRequest('/auth/register', { method: 'POST', body: payload, auth: false }),
  login: (payload) => apiRequest('/auth/login', { method: 'POST', body: payload, auth: false }),
  me: () => apiRequest('/auth/me'),

  getWallet: () => apiRequest('/wallet/me'),
  withdraw: (payload) => apiRequest('/wallet/withdraw', { method: 'POST', body: payload }),

  getListings: (params = '') => apiRequest(`/p2p/listings${params}`),
  createListing: (payload) => apiRequest('/p2p/listings', { method: 'POST', body: payload }),
  buy: (payload) => apiRequest('/p2p/buy', { method: 'POST', body: payload }),
  declarePaid: (id) => apiRequest(`/p2p/transactions/${id}/declare-paid`, { method: 'POST' }),
  confirmRelease: (id) => apiRequest(`/p2p/transactions/${id}/confirm-release`, { method: 'POST' }),
  openDispute: (id, payload) => apiRequest(`/p2p/transactions/${id}/dispute`, { method: 'POST', body: payload }),
  getMessages: (id) => apiRequest(`/p2p/transactions/${id}/messages`),

  adminDisputes: () => apiRequest('/admin/disputes'),
  adminResolve: (id, resolution) => apiRequest(`/admin/disputes/${id}/resolve`, { method: 'POST', body: { resolution } }),
};
