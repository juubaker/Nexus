export type IntegrationStatus = 'healthy' | 'degraded' | 'error' | 'syncing';
export type EventType = 'SYNC' | 'ROUTE' | 'ERROR' | 'RETRY' | 'AGENT' | 'HEARTBEAT';
export type SystemName = 'HCM' | 'CRM' | 'TICKETING';

export interface AuditEvent {
  id: string;
  timestamp: string;
  type: EventType;
  system: SystemName | 'AGENT' | 'SYSTEM';
  message: string;
  metadata?: Record<string, unknown>;
  status: 'success' | 'error' | 'pending';
  durationMs?: number;
}

export interface IntegrationState {
  name: SystemName;
  status: IntegrationStatus;
  lastSync: string;
  recordCount: number;
  errorCount: number;
  throughput: number[];   // last 60 data points (events/min)
  latencyMs: number;
}

export interface Employee {
  id: string;
  name: string;
  department: string;
  role: string;
  email: string;
  startDate: string;
  benefits: string[];
  salary: number;
  managerId?: string;
}

export interface CrmContact {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  accountName: string;
  syncedAt: string;
  fields: Record<string, string>;
}

export interface SupportTicket {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved' | 'escalated';
  assignedTo?: string;
  createdAt: string;
  slaDeadline: string;
  tags: string[];
  sourceSystem: SystemName;
}

export interface AgentQueryRequest {
  query: string;
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export interface AgentQueryResponse {
  response: string;
  actionsPerformed: string[];
  durationMs: number;
}

export interface Metrics {
  totalEvents: number;
  successRate: number;
  avgLatencyMs: number;
  errorCount: number;
  uptimePct: number;
  eventsPerMinute: number;
}
