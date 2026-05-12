import { Router, Request, Response } from 'express';
import { runAgentQuery, checkOllamaHealth } from '../services/llmService';
import { hcmService } from '../services/hcmService';
import { crmService, ticketingService } from '../services/integrationServices';
import {
  addAuditEvent, getAuditLog, getIntegrationStates, updateIntegrationState,
  getMetrics, incrementEvents, incrementErrors, addSSEClient, removeSSEClient, broadcastSSE,
} from '../store';
import { AgentQueryRequest } from '../types';

export const router = Router();

// ── SSE Event Stream ───────────────────────────────────────────────────────
router.get('/events', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();
  addSSEClient(res);

  const heartbeat = setInterval(() => {
    try { res.write(`event: heartbeat\ndata: ${JSON.stringify({ ts: Date.now() })}\n\n`); }
    catch { clearInterval(heartbeat); }
  }, 25000);

  req.on('close', () => { clearInterval(heartbeat); removeSSEClient(res); });
});

// ── Ollama Health ──────────────────────────────────────────────────────────
router.get('/llm/health', async (_req: Request, res: Response) => {
  const status = await checkOllamaHealth();
  res.status(status.ok ? 200 : 503).json(status);
});

// ── Integration Status ─────────────────────────────────────────────────────
router.get('/integrations', (_req: Request, res: Response) => {
  res.json({ integrations: getIntegrationStates(), metrics: getMetrics() });
});

// ── Sync HCM → CRM ────────────────────────────────────────────────────────
router.post('/integrations/sync', async (_req: Request, res: Response) => {
  const start = Date.now();
  try {
    updateIntegrationState('CRM', { status: 'syncing' });
    broadcastSSE('integration_update', { system: 'CRM', status: 'syncing' });
    await crmService.simulateLatency();
    const result = crmService.syncFromHCM();
    const duration = Date.now() - start;
    updateIntegrationState('CRM', { status: 'healthy', lastSync: new Date().toISOString(), recordCount: result.synced, latencyMs: duration });
    const event = addAuditEvent({ type: 'SYNC', system: 'HCM', message: `Manual sync: ${result.synced} records (${result.created} new, ${result.updated} updated)`, status: 'success', durationMs: duration, metadata: result });
    incrementEvents();
    broadcastSSE('audit_event', event);
    broadcastSSE('integration_update', { system: 'CRM', status: 'healthy', ...result });
    res.json({ success: true, ...result, durationMs: duration });
  } catch {
    incrementErrors();
    updateIntegrationState('CRM', { status: 'error' });
    const event = addAuditEvent({ type: 'ERROR', system: 'CRM', message: 'Sync failed', status: 'error' });
    broadcastSSE('audit_event', event);
    res.status(500).json({ success: false, error: 'Sync failed' });
  }
});

// ── Inject Error ───────────────────────────────────────────────────────────
router.post('/integrations/inject-error', (req: Request, res: Response) => {
  const { system = 'CRM' } = req.body as { system?: string };
  updateIntegrationState(system, { status: 'error', errorCount: 1 });
  const event = addAuditEvent({ type: 'ERROR', system: system as 'HCM' | 'CRM' | 'TICKETING', message: `Simulated error injected into ${system}`, status: 'error' });
  incrementErrors();
  broadcastSSE('audit_event', event);
  broadcastSSE('integration_update', { system, status: 'error' });
  setTimeout(() => {
    updateIntegrationState(system, { status: 'healthy', errorCount: 0 });
    const r = addAuditEvent({ type: 'RETRY', system: system as 'HCM' | 'CRM' | 'TICKETING', message: `${system} auto-recovered after error`, status: 'success', durationMs: 3000 });
    broadcastSSE('audit_event', r);
    broadcastSSE('integration_update', { system, status: 'healthy' });
  }, 5000);
  res.json({ success: true, message: `Error injected into ${system}. Auto-recovery in 5s.` });
});

// ── Data endpoints ─────────────────────────────────────────────────────────
router.get('/hcm/employees', (_req, res) => res.json({ employees: hcmService.getAllEmployees() }));
router.get('/crm/contacts', (_req, res) => res.json({ contacts: crmService.getContacts() }));
router.get('/tickets', (_req, res) => res.json({ tickets: ticketingService.getTickets() }));

router.post('/tickets/route/:id', (req: Request, res: Response) => {
  const result = ticketingService.routeTicket(req.params.id);
  const event = addAuditEvent({ type: 'ROUTE', system: 'TICKETING', message: `Ticket ${req.params.id} → ${result.assignedTo}`, status: 'success', durationMs: 90 });
  incrementEvents();
  broadcastSSE('audit_event', event);
  res.json({ success: true, ...result });
});

router.get('/audit', (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 50;
  res.json({ events: getAuditLog(limit) });
});

router.get('/metrics', (_req, res) => res.json(getMetrics()));

// ── AI Agent ───────────────────────────────────────────────────────────────
router.post('/agent/query', async (req: Request, res: Response) => {
  const { query, conversationHistory } = req.body as AgentQueryRequest;
  if (!query?.trim()) return res.status(400).json({ error: 'Query is required' });

  try {
    const start = Date.now();
    const result = await runAgentQuery(query, conversationHistory);
    const event = addAuditEvent({
      type: 'AGENT', system: 'AGENT',
      message: `Agent query: "${query.slice(0, 60)}..." → ${result.actionsPerformed.length} actions`,
      status: 'success', durationMs: Date.now() - start,
      metadata: { actionsPerformed: result.actionsPerformed },
    });
    incrementEvents();
    broadcastSSE('audit_event', event);
    return res.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    incrementErrors();
    return res.status(500).json({
      error: `Agent query failed. Is Ollama running at ${process.env.OLLAMA_URL || 'http://localhost:11434'}?`,
      detail: msg,
    });
  }
});
