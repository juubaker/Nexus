import { AuditEvent, IntegrationState, Metrics } from './types';
import { v4 as uuidv4 } from 'uuid';

// ── Audit Log ──────────────────────────────────────────────────────────────
const MAX_AUDIT_ENTRIES = 500;
const auditLog: AuditEvent[] = [];

export function addAuditEvent(event: Omit<AuditEvent, 'id' | 'timestamp'>): AuditEvent {
  const entry: AuditEvent = {
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    ...event,
  };
  auditLog.unshift(entry);
  if (auditLog.length > MAX_AUDIT_ENTRIES) auditLog.splice(MAX_AUDIT_ENTRIES);
  return entry;
}

export function getAuditLog(limit = 50): AuditEvent[] {
  return auditLog.slice(0, limit);
}

// ── Integration State ──────────────────────────────────────────────────────
export const integrationStates: Map<string, IntegrationState> = new Map([
  ['HCM', {
    name: 'HCM',
    status: 'healthy',
    lastSync: new Date().toISOString(),
    recordCount: 50,
    errorCount: 0,
    throughput: Array.from({ length: 60 }, () => Math.floor(Math.random() * 8) + 2),
    latencyMs: 210,
  }],
  ['CRM', {
    name: 'CRM',
    status: 'healthy',
    lastSync: new Date().toISOString(),
    recordCount: 48,
    errorCount: 1,
    throughput: Array.from({ length: 60 }, () => Math.floor(Math.random() * 6) + 1),
    latencyMs: 340,
  }],
  ['TICKETING', {
    name: 'TICKETING',
    status: 'healthy',
    lastSync: new Date().toISOString(),
    recordCount: 23,
    errorCount: 2,
    throughput: Array.from({ length: 60 }, () => Math.floor(Math.random() * 4) + 1),
    latencyMs: 180,
  }],
]);

export function getIntegrationStates(): IntegrationState[] {
  return Array.from(integrationStates.values());
}

export function updateIntegrationState(name: string, updates: Partial<IntegrationState>): void {
  const current = integrationStates.get(name);
  if (current) {
    integrationStates.set(name, { ...current, ...updates });
  }
}

// ── Metrics ────────────────────────────────────────────────────────────────
let totalEvents = 0;
let totalErrors = 0;
const startTime = Date.now();

export function incrementEvents(): void { totalEvents++; }
export function incrementErrors(): void { totalErrors++; }

export function getMetrics(): Metrics {
  const uptimeMs = Date.now() - startTime;
  const uptimeHours = uptimeMs / 3600000;
  return {
    totalEvents,
    successRate: totalEvents > 0 ? ((totalEvents - totalErrors) / totalEvents) * 100 : 100,
    avgLatencyMs: Math.round(
      Array.from(integrationStates.values()).reduce((s, i) => s + i.latencyMs, 0) /
        integrationStates.size
    ),
    errorCount: totalErrors,
    uptimePct: Math.min(99.99, 100 - (totalErrors / Math.max(totalEvents, 1)) * 100),
    eventsPerMinute: uptimeHours > 0 ? Math.round(totalEvents / (uptimeHours * 60)) : 0,
  };
}

// ── SSE Clients ────────────────────────────────────────────────────────────
import { Response } from 'express';
const sseClients: Set<Response> = new Set();

export function addSSEClient(res: Response): void { sseClients.add(res); }
export function removeSSEClient(res: Response): void { sseClients.delete(res); }

export function broadcastSSE(event: string, data: unknown): void {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach(client => {
    try { client.write(payload); } catch { sseClients.delete(client); }
  });
}
