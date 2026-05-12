import { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { api } from '../api';

interface Props {
  onAction: () => void;
  llmModel?: string;
  llmOk?: boolean;
}

const QUICK_COMMANDS = [
  'Sync HCM data to CRM',
  'Check all system health',
  'Show open critical tickets',
  'Route the oldest open ticket',
  'Validate benefits for EMP-0001',
];

function TypingIndicator() {
  return (
    <div style={{ display: 'flex', gap: 4, padding: '8px 0' }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: 5, height: 5, borderRadius: '50%',
          background: 'var(--cyan)', opacity: 0.6,
          animation: `pulse-dot 1.2s ${i * 0.2}s infinite`,
        }} />
      ))}
    </div>
  );
}

export function AgentConsole({ onAction, llmModel, llmOk }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([{
    role: 'assistant',
    content: 'Enterprise Integration Agent online. I can sync systems, route tickets, validate benefits, and diagnose integration issues. What would you like me to do?',
    timestamp: new Date().toISOString(),
  }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = async (query: string) => {
    if (!query.trim() || loading) return;
    const userMsg: ChatMessage = { role: 'user', content: query, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const history = messages.slice(-6).map(m => ({ role: m.role, content: m.content }));
      const result = await api.agentQuery(query, history);
      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: result.response || result.error || 'No response.',
        actionsPerformed: result.actionsPerformed,
        durationMs: result.durationMs,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, assistantMsg]);
      onAction();
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '⚠ Connection error. Is Ollama running? Check backend logs.',
        timestamp: new Date().toISOString(),
      }]);
    } finally { setLoading(false); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 0 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 2px 8px' }}>
        <span style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.15em' }}>
          AI AGENT CONSOLE  ·  OLLAMA
        </span>
        {llmModel && (
          <span style={{
            fontSize: 8, fontFamily: 'var(--font-mono)',
            color: llmOk ? 'var(--green)' : 'var(--red)',
            background: llmOk ? 'var(--green-dim)22' : 'var(--red-dim)22',
            border: `1px solid ${llmOk ? 'var(--green-dim)' : 'var(--red-dim)'}`,
            padding: '2px 8px', borderRadius: 10,
          }}>
            {llmOk ? '●' : '○'} {llmModel}
          </span>
        )}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ animation: 'slide-in 0.2s ease' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <div style={{
                width: 20, height: 20, borderRadius: 3, flexShrink: 0, marginTop: 1,
                background: msg.role === 'assistant' ? 'var(--cyan-dim)' : 'var(--border)',
                border: `1px solid ${msg.role === 'assistant' ? 'var(--cyan)' : 'var(--border-bright)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 8, color: msg.role === 'assistant' ? 'var(--cyan)' : 'var(--text-muted)',
                fontFamily: 'var(--font-mono)',
              }}>
                {msg.role === 'assistant' ? 'AI' : 'U'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: 12, color: msg.role === 'assistant' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  lineHeight: 1.5, whiteSpace: 'pre-wrap',
                }}>{msg.content}</div>
                {msg.actionsPerformed && msg.actionsPerformed.length > 0 && (
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 6 }}>
                    {msg.actionsPerformed.map(a => (
                      <span key={a} style={{
                        fontSize: 9, fontFamily: 'var(--font-mono)',
                        color: 'var(--green)', background: 'var(--green-dim)22',
                        border: '1px solid var(--green-dim)', padding: '1px 6px', borderRadius: 10,
                      }}>✓ {a}</span>
                    ))}
                    {msg.durationMs && (
                      <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                        {msg.durationMs}ms
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{
              width: 20, height: 20, borderRadius: 3,
              background: 'var(--cyan-dim)', border: '1px solid var(--cyan)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 8, color: 'var(--cyan)', fontFamily: 'var(--font-mono)',
            }}>AI</div>
            <TypingIndicator />
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick commands */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', padding: '8px 0 6px' }}>
        {QUICK_COMMANDS.map(cmd => (
          <button key={cmd} onClick={() => send(cmd)} disabled={loading} style={{
            fontSize: 9, padding: '3px 8px', borderRadius: 10,
            background: 'var(--bg-panel)', color: 'var(--cyan-dim)',
            border: '1px solid var(--border)', opacity: loading ? 0.5 : 1,
          }}>
            {cmd}
          </button>
        ))}
      </div>

      {/* Input */}
      <div style={{ display: 'flex', gap: 6 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send(input)}
          placeholder={llmOk === false ? 'Ollama offline — check backend...' : 'Enter command or question...'}
          disabled={loading}
          style={{ flex: 1, padding: '8px 10px', borderRadius: 'var(--radius-sm)' }}
        />
        <button onClick={() => send(input)} disabled={loading || !input.trim()} style={{
          padding: '8px 14px', borderRadius: 'var(--radius-sm)',
          background: loading ? 'var(--border)' : 'var(--cyan-dim)',
          color: 'var(--cyan)', border: '1px solid var(--cyan-dim)',
          opacity: loading || !input.trim() ? 0.5 : 1,
        }}>▶</button>
      </div>
    </div>
  );
}
