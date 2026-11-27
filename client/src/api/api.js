const API_BASE =
  import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '/api';
const DEV_ROLE = import.meta.env.VITE_DEV_ROLE || 'admin';

export class ApiError extends Error {
  constructor(status, message, code, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

async function request(path, init = {}) {
  const token =
    localStorage.getItem('invoice_manager_token') ||
    localStorage.getItem('token');

  const headers = {
    'Content-Type': 'application/json',
    'x-dev-role': DEV_ROLE,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(init.headers || {}),
  };

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
  });

  if (!res.ok) {
    let payload = {};
    try {
      payload = await res.json();
    } catch {
      // ignore non-json error response
    }
    throw new ApiError(
      res.status,
      payload.error?.message || `Erreur HTTP ${res.status}`,
      payload.error?.code,
      payload.error?.details
    );
  }

  return res.json();
}

export const api = {
  async checkHealth() {
    try {
      const res = await request('/health');
      return res.status === 'ok';
    } catch {
      return false;
    }
  },

  async listContacts() {
    const res = await request('/contacts?archived=all&limit=100');
    return res.data;
  },

  async createContact(values) {
    const res = await request('/contacts', {
      method: 'POST',
      body: JSON.stringify(values),
    });
    return res.data;
  },

  async updateContact(id, values) {
    const res = await request(`/contacts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(values),
    });
    return res.data;
  },

  async archiveContact(id) {
    const res = await request(`/contacts/${id}/archive`, {
      method: 'PATCH',
    });
    return res.data;
  },

  async restoreContact(id) {
    const res = await request(`/contacts/${id}/restore`, {
      method: 'PATCH',
    });
    return res.data;
  },

  async listInvoices() {
    const res = await request('/invoices?limit=100');
    return res.data;
  },
};
