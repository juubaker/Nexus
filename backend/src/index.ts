import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { router } from './routes';
import { addAuditEvent, broadcastSSE, updateIntegrationState } from './store';
import { checkOllamaHealth } from './services/llmService';

const app = express();
const PORT = process.env.PORT || 3001;
const OLLAMA_URL   = process.env.OLLAMA_URL   || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL  || 'llama3.1';

// ── Middleware ─────────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());
app.use(rateLimit({ windowMs: 60_000, max: 120, message: 'Rate limit exceeded' }));

// ── Routes ─────────────────────────────────────────────────────────────────
app.use('/api', router);
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '2.0.0', llm: 'ollama' });
});

// ── Background Simulation ──────────────────────────────────────────────────
setInterval(() => {
  const systems = ['HCM', 'CRM', 'TICKETING'] as const;
  const system = systems[Math.floor(Math.random() * systems.length)];
  const isError = Math.random() < 0.08;

  if (isError) {
    const event = addAuditEvent({ type: 'ERROR', system, message: `Transient ${system} connectivity issue`, status: 'error', durationMs: Math.floor(Math.random() * 500 + 200) });
    updateIntegrationState(system, { status: 'degraded' });
    broadcastSSE('audit_event', event);
    setTimeout(() => {
      updateIntegrationState(system, { status: 'healthy' });
      const r = addAuditEvent({ type: 'RETRY', system, message: `${system} recovered (auto-retry successful)`, status: 'success', durationMs: 1200 });
      broadcastSSE('audit_event', r);
      broadcastSSE('integration_update', { system, status: 'healthy' });
    }, 3000);
  } else {
    const event = addAuditEvent({ type: 'SYNC', system, message: `Background sync: ${Math.floor(Math.random() * 5) + 1} records processed`, status: 'success', durationMs: Math.floor(Math.random() * 300 + 100) });
    updateIntegrationState(system, { lastSync: new Date().toISOString() });
    broadcastSSE('audit_event', event);
  }
}, 8000);

// ── Start ──────────────────────────────────────────────────────────────────
app.listen(PORT, async () => {
  console.log(`\n🚀 Enterprise Integration Agent API (Ollama Edition)`);
  console.log(`   http://localhost:${PORT}`);
  console.log(`   LLM:  ${OLLAMA_MODEL} @ ${OLLAMA_URL}\n`);

  const health = await checkOllamaHealth();
  if (health.ok) {
    console.log(`   ✅ Ollama connected — model "${OLLAMA_MODEL}" ready`);
  } else {
    console.log(`   ⚠️  Ollama not reachable at ${OLLAMA_URL}`);
    console.log(`      Run: ollama pull ${OLLAMA_MODEL}`);
    console.log(`      Then: ollama serve`);
  }
  console.log();
});
