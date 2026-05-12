import { useEffect, useState } from 'react';
import { Metrics } from '../types';

interface Props { metrics: Metrics; connected: boolean; }

export function Header({ metrics, connected }: Props) {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const fmt = (d: Date) => d.toLocaleTimeString('en-US', { hour12: false });
  const fmtDate = (d: Date) => d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <header style={{
      background: 'var(--bg-panel)',
      borderBottom: '1px solid var(--border)',
      padding: '0 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: 52,
      flexShrink: 0,
      position: 'relative',
    }}>
      {/* Left: Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 4,
          background: 'linear-gradient(135deg, var(--cyan-dim), #003344)',
          border: '1px solid var(--cyan-dim)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, color: 'var(--cyan)', fontFamily: 'var(--font-mono)',
        }}>⬡</div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '0.05em' }}>
            ENTERPRISE INTEGRATION COMMAND CENTER
          </div>
          <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em' }}>
            AI-POWERED ORCHESTRATION  ·  HCM + CRM + TICKETING
          </div>
        </div>
      </div>

      {/* Center: Metrics strip */}
      <div style={{ display: 'flex', gap: 24, position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
        {[
          { label: 'UPTIME', value: `${metrics.uptimePct.toFixed(1)}%`, color: 'var(--green)' },
          { label: 'AVG LATENCY', value: `${metrics.avgLatencyMs}ms`, color: 'var(--cyan)' },
          { label: 'EVENTS', value: metrics.totalEvents.toLocaleString(), color: 'var(--amber)' },
          { label: 'ERRORS', value: String(metrics.errorCount), color: metrics.errorCount > 0 ? 'var(--red)' : 'var(--green)' },
        ].map(m => (
          <div key={m.label} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 14, fontFamily: 'var(--font-mono)', color: m.color, fontWeight: 600 }}>{m.value}</div>
            <div style={{ fontSize: 8, color: 'var(--text-muted)', letterSpacing: '0.12em' }}>{m.label}</div>
          </div>
        ))}
      </div>

      {/* Right: Clock + connection */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 16, fontFamily: 'var(--font-mono)', color: 'var(--cyan)', fontWeight: 500 }}>{fmt(time)}</div>
          <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.08em' }}>{fmtDate(time)}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            width: 7, height: 7, borderRadius: '50%',
            background: connected ? 'var(--green)' : 'var(--red)',
            animation: connected ? 'pulse-dot 2s infinite' : 'none',
          }} />
          <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>
            {connected ? 'LIVE' : 'OFFLINE'}
          </span>
        </div>
      </div>
    </header>
  );
}
