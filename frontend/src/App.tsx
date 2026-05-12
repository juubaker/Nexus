import { useEffect, useState, useCallback, useRef } from 'react';
import './index.css';
import { AuditEvent, IntegrationState, Metrics } from './types';
import { api } from './api';
import { Header } from './components/Header';
import { IntegrationPanels } from './components/IntegrationPanels';
import { AgentConsole } from './components/AgentConsole';
import { AuditLogPanel } from './components/AuditLogPanel';

const DEFAULT_METRICS: Metrics = {
  totalEvents: 0, successRate: 100, avgLatencyMs: 0,
  errorCount: 0, uptimePct: 100, eventsPerMinute: 0,
};

export default function App() {
  const [integrations, setIntegrations] = useState<IntegrationState[]>([]);
  const [metrics, setMetrics] = useState<Metrics>(DEFAULT_METRICS);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const [llmOk, setLlmOk] = useState<boolean | undefined>(undefined);
  const [llmModel, setLlmModel] = useState<string>('');
  const sseRef = useRef<EventSource | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [intgData, auditData] = await Promise.all([
        api.getIntegrations(),
        api.getAuditLog(80),
      ]);
      if (intgData.integrations) setIntegrations(intgData.integrations);
      if (intgData.metrics) setMetrics(intgData.metrics);
      if (auditData.events) setAuditEvents(auditData.events);
    } catch { /* backend not running */ }
  }, []);

  const checkLLM = useCallback(async () => {
    const health = await api.getLLMHealth();
    setLlmOk(health.ok);
    setLlmModel(health.model);
  }, []);

  useEffect(() => {
    loadData();
    checkLLM();

    const connect = () => {
      const es = new EventSource('/api/events');
      sseRef.current = es;
      es.onopen = () => setConnected(true);
      es.onerror = () => { setConnected(false); setTimeout(connect, 4000); };
      es.addEventListener('audit_event', (e) => {
        const event: AuditEvent = JSON.parse(e.data);
        setAuditEvents(prev => [event, ...prev].slice(0, 200));
      });
      es.addEventListener('integration_update', () => {
        api.getIntegrations().then(d => {
          if (d.integrations) setIntegrations(d.integrations);
          if (d.metrics) setMetrics(d.metrics);
        }).catch(() => {});
      });
    };
    connect();
    const llmInterval = setInterval(checkLLM, 30000);
    return () => { sseRef.current?.close(); clearInterval(llmInterval); };
  }, [loadData, checkLLM]);

  const panelStyle: React.CSSProperties = {
    background: 'var(--bg-panel)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    padding: '12px 10px',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Header metrics={metrics} connected={connected} />

      {!connected && (
        <div style={{
          background: '#1A0A00', borderBottom: '1px solid var(--amber-dim)',
          padding: '6px 20px', fontSize: 10, fontFamily: 'var(--font-mono)',
          color: 'var(--amber)', letterSpacing: '0.1em',
        }}>
          ⚠ BACKEND OFFLINE — cd backend && npm run dev
        </div>
      )}

      {connected && llmOk === false && (
        <div style={{
          background: '#1A0A00', borderBottom: '1px solid var(--amber-dim)',
          padding: '6px 20px', fontSize: 10, fontFamily: 'var(--font-mono)',
          color: 'var(--amber)', letterSpacing: '0.1em',
        }}>
          ⚠ OLLAMA NOT CONNECTED — Run: ollama serve && ollama pull {llmModel || 'llama3.1'}
        </div>
      )}

      <main style={{
        display: 'grid',
        gridTemplateColumns: '260px 1fr 320px',
        gap: 8, flex: 1, overflow: 'hidden',
        padding: '8px 10px 10px', minHeight: 0,
      }}>
        <div style={panelStyle}>
          <IntegrationPanels integrations={integrations} onAction={loadData} />
        </div>
        <div style={panelStyle}>
          <AgentConsole onAction={loadData} llmModel={llmModel} llmOk={llmOk} />
        </div>
        <div style={panelStyle}>
          <AuditLogPanel events={auditEvents} />
        </div>
      </main>

      <div style={{
        borderTop: '1px solid var(--border)', background: 'var(--bg-panel)',
        padding: '4px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0,
      }}>
        <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>
          ENTERPRISE INTEGRATION COMMAND CENTER  v2.0  ·  OLLAMA EDITION  ·  JOHN BAKER
        </span>
        <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>
          github.com/juubaker  ·  linkedin.com/in/johnwilliambaker
        </span>
      </div>
    </div>
  );
}
