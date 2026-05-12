import { IntegrationState } from '../types';
import { api } from '../api';

interface Props {
  integrations: IntegrationState[];
  onAction: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  healthy: 'var(--green)',
  degraded: 'var(--amber)',
  error: 'var(--red)',
  syncing: 'var(--cyan)',
};

const SYSTEM_COLORS: Record<string, string> = {
  HCM: 'var(--green)',
  CRM: 'var(--amber)',
  TICKETING: 'var(--purple)',
};

function MiniGraph({ data }: { data: number[] }) {
  const max = Math.max(...data, 1);
  const w = 80; const h = 24;
  const pts = data.slice(-20).map((v, i, arr) =>
    `${(i / (arr.length - 1)) * w},${h - (v / max) * h}`
  ).join(' ');
  return (
    <svg width={w} height={h} style={{ display: 'block' }}>
      <polyline points={pts} fill="none" stroke="var(--cyan)" strokeWidth="1.5" opacity="0.6" />
    </svg>
  );
}

export function IntegrationPanels({ integrations, onAction }: Props) {
  const handleSync = async () => {
    await api.syncHCMtoCRM();
    onAction();
  };

  const handleInjectError = async (system: string) => {
    await api.injectError(system);
    onAction();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, height: '100%' }}>
      <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.15em', padding: '0 2px 4px' }}>
        INTEGRATION STATUS
      </div>
      {integrations.map(intg => (
        <div key={intg.name} style={{
          background: 'var(--bg-card)',
          border: `1px solid var(--border)`,
          borderLeft: `3px solid ${SYSTEM_COLORS[intg.name] || 'var(--cyan)'}`,
          borderRadius: 'var(--radius)',
          padding: '10px 12px',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}>
          {/* Header row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 600, color: SYSTEM_COLORS[intg.name] }}>
                {intg.name}
              </span>
              <span style={{
                fontSize: 8, fontFamily: 'var(--font-mono)',
                color: STATUS_COLORS[intg.status],
                background: `${STATUS_COLORS[intg.status]}18`,
                border: `1px solid ${STATUS_COLORS[intg.status]}44`,
                padding: '1px 6px', borderRadius: 10,
                animation: intg.status === 'syncing' ? 'pulse-dot 1s infinite' : 'none',
              }}>
                {intg.status.toUpperCase()}
              </span>
            </div>
            <MiniGraph data={intg.throughput} />
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4 }}>
            {[
              { label: 'RECORDS', value: intg.recordCount.toLocaleString() },
              { label: 'LATENCY', value: `${intg.latencyMs}ms` },
              { label: 'ERRORS', value: intg.errorCount, color: intg.errorCount > 0 ? 'var(--red)' : undefined },
            ].map(s => (
              <div key={s.label} style={{ background: 'var(--bg-panel)', borderRadius: 3, padding: '4px 6px' }}>
                <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: s.color || 'var(--text-primary)', fontWeight: 500 }}>{s.value}</div>
                <div style={{ fontSize: 7, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Last sync + actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 8, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              SYNC {new Date(intg.lastSync).toLocaleTimeString('en-US', { hour12: false })}
            </span>
            <div style={{ display: 'flex', gap: 4 }}>
              {intg.name === 'HCM' && (
                <button onClick={handleSync} style={{
                  background: 'var(--bg-panel)', color: 'var(--green)',
                  border: '1px solid var(--green-dim)', borderRadius: 3, padding: '3px 8px',
                }}>↻ SYNC</button>
              )}
              <button onClick={() => handleInjectError(intg.name)} style={{
                background: 'var(--bg-panel)', color: 'var(--red)',
                border: '1px solid var(--red-dim)', borderRadius: 3, padding: '3px 8px',
              }}>⚡ ERR</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
