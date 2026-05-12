export type IntegrationStatus = 'healthy' | 'degraded' | 'error' | 'syncing';
export type EventType = 'SYNC' | 'ROUTE' | 'ERROR' | 'RETRY' | 'AGENT' | 'HEARTBEAT';

export interface AuditEvent {
  id: string;
  timestamp: string;
  type: EventType;
  system: string;
  message: string;
  status: 'success' | 'error' | 'pending';
  durationMs?: number;
}

export interface IntegrationState {
  name: string;
  status: IntegrationStatus;
  lastSync: string;
  recordCount: number;
  errorCount: number;
  throughput: number[];
  latencyMs: number;
}

export interface Metrics {
  totalEvents: number;
  successRate: number;
  avgLatencyMs: number;
  errorCount: number;
  uptimePct: number;
  eventsPerMinute: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  actionsPerformed?: string[];
  durationMs?: number;
  timestamp: string;
}
