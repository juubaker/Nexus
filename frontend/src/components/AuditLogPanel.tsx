import { AuditEvent } from '../types';

interface Props { events: AuditEvent[]; }

const TYPE_COLORS: Record<string, string> = {
  SYNC: 'var(--cyan)',
  ROUTE: 'var(--purple)',
  ERROR: 'var(--red)',
  RETRY: 'var(--amber)',
  AGENT: 'var(--green)',
  HEARTBEAT: 'var(--text-muted)',
};

const STATUS_ICONS: Record<string, string> = {
  success: '✓',
  error: '✗',
  pending: '○',
};

export function AuditLogPanel({ events }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.15em', padding: '0 2px 8px' }}>
        AUDIT LOG  ·  {events.length} EVENTS
      </div>
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1 }}>
        {events.length === 0 && (
          <div style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 11, textAlign: 'center', padding: 20 }}>
            Awaiting events...
          </div>
        )}
        {events.map((ev, i) => (
          <div key={ev.id} style={{
            display: 'grid',
            gridTemplateColumns: '58px 40px 58px 1fr 40px',
            gap: 6,
            padding: '3px 6px',
            borderRadius: 2,
            background: i % 2 === 0 ? 'var(--bg-card)' : 'transparent',
            animation: i === 0 ? 'slide-in 0.2s ease' : 'none',
            alignItems: 'center',
          }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)' }}>
              {new Date(ev.timestamp).toLocaleTimeString('en-US', { hour12: false })}
            </span>
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 9,
              color: TYPE_COLORS[ev.type] || 'var(--text-muted)',
              fontWeight: 600,
            }}>{ev.type}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)' }}>
              {ev.system}
            </span>
            <span style={{ fontSize: 10, color: ev.status === 'error' ? 'var(--red)' : 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {ev.message}
            </span>
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 9,
              color: ev.status === 'success' ? 'var(--green)' : ev.status === 'error' ? 'var(--red)' : 'var(--amber)',
              textAlign: 'right',
            }}>
              {STATUS_ICONS[ev.status]} {ev.durationMs ? `${ev.durationMs}ms` : ''}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
