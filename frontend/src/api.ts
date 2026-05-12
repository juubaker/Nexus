const BASE = '/api';

export const api = {
  async getIntegrations() {
    const r = await fetch(`${BASE}/integrations`);
    return r.json();
  },
  async syncHCMtoCRM() {
    const r = await fetch(`${BASE}/integrations/sync`, { method: 'POST' });
    return r.json();
  },
  async injectError(system: string) {
    const r = await fetch(`${BASE}/integrations/inject-error`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ system }),
    });
    return r.json();
  },
  async getAuditLog(limit = 80) {
    const r = await fetch(`${BASE}/audit?limit=${limit}`);
    return r.json();
  },
  async getTickets() {
    const r = await fetch(`${BASE}/tickets`);
    return r.json();
  },
  async routeTicket(id: string) {
    const r = await fetch(`${BASE}/tickets/route/${id}`, { method: 'POST' });
    return r.json();
  },
  async agentQuery(query: string, history: Array<{ role: 'user' | 'assistant'; content: string }>) {
    const r = await fetch(`${BASE}/agent/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, conversationHistory: history }),
    });
    return r.json();
  },
  async getLLMHealth(): Promise<{ ok: boolean; model: string; url: string }> {
    try {
      const r = await fetch(`${BASE}/llm/health`);
      return r.json();
    } catch {
      return { ok: false, model: 'unknown', url: 'unknown' };
    }
  },
};
