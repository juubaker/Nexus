import { Ollama, Message, Tool } from 'ollama';
import { hcmService } from './hcmService';
import { crmService, ticketingService } from './integrationServices';
import { addAuditEvent, broadcastSSE, getMetrics, getIntegrationStates } from '../store';

const OLLAMA_URL   = process.env.OLLAMA_URL   || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL  || 'llama3.1';

const ollama = new Ollama({ host: OLLAMA_URL });

// ── System prompt ──────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are an enterprise integration specialist AI embedded in a Forward Deployed Engineering command center. You orchestrate data flows between HCM (Human Capital Management), CRM, and Ticketing systems for enterprise customers.

You have access to tools that let you perform real actions across these systems. When a user asks you to do something, use the appropriate tools, then summarize what you did clearly and concisely.

Be direct and professional. Always confirm what actions you took and their outcomes. If something fails, explain why and suggest alternatives.`;

// ── Tool definitions (OpenAI-compatible format that Ollama accepts) ─────────
const tools: Tool[] = [
  {
    type: 'function',
    function: {
      name: 'sync_hcm_to_crm',
      description: 'Synchronize employee records from the HCM system to the CRM. Returns counts of records synced, created, and updated.',
      parameters: {
        type: 'object',
        properties: {
          reason: { type: 'string', description: 'Reason for triggering this sync' },
        },
        required: ['reason'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'route_support_ticket',
      description: 'Route a support ticket to the appropriate team based on its category and priority.',
      parameters: {
        type: 'object',
        properties: {
          ticket_id: { type: 'string', description: 'The ticket ID to route (e.g. TKT-00100)' },
        },
        required: ['ticket_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_integration_status',
      description: 'Get the current health status, record counts, and latency of all integration systems.',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'validate_employee_benefits',
      description: 'Validate benefits enrollment for a specific employee and report any issues.',
      parameters: {
        type: 'object',
        properties: {
          employee_id: { type: 'string', description: 'Employee ID (e.g. EMP-0001)' },
        },
        required: ['employee_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_open_tickets',
      description: 'Retrieve a list of open support tickets, optionally filtered by priority.',
      parameters: {
        type: 'object',
        properties: {
          priority: {
            type: 'string',
            enum: ['low', 'medium', 'high', 'critical', 'all'],
            description: 'Filter tickets by priority level',
          },
        },
        required: ['priority'],
      },
    },
  },
];

// ── Tool executor ──────────────────────────────────────────────────────────
function executeTool(name: string, args: Record<string, string>): unknown {
  switch (name) {
    case 'sync_hcm_to_crm': {
      const result = crmService.syncFromHCM();
      addAuditEvent({
        type: 'SYNC', system: 'HCM',
        message: `Agent-triggered sync: ${result.synced} records (${result.created} new, ${result.updated} updated)`,
        status: 'success', durationMs: 320,
      });
      broadcastSSE('integration_update', { system: 'CRM', event: 'sync_complete', data: result });
      return result;
    }
    case 'route_support_ticket': {
      const result = ticketingService.routeTicket(args.ticket_id);
      addAuditEvent({
        type: 'ROUTE', system: 'TICKETING',
        message: `Routed ${args.ticket_id} → ${result.assignedTo}`,
        status: 'success', durationMs: 85,
      });
      broadcastSSE('ticket_update', { ticketId: args.ticket_id, ...result });
      return result;
    }
    case 'get_integration_status':
      return { integrations: getIntegrationStates(), metrics: getMetrics() };

    case 'validate_employee_benefits': {
      const result = hcmService.validateBenefits(args.employee_id);
      addAuditEvent({
        type: 'SYNC', system: 'HCM',
        message: `Benefits validation for ${args.employee_id}: ${result.valid ? 'PASSED' : 'ISSUES FOUND'}`,
        status: result.valid ? 'success' : 'error', durationMs: 120,
      });
      return result;
    }
    case 'get_open_tickets': {
      const all = ticketingService.getTickets();
      const filtered = args.priority === 'all'
        ? all
        : all.filter(t => t.priority === args.priority);
      return { tickets: filtered.slice(0, 10), total: filtered.length };
    }
    default:
      return { error: `Unknown tool: ${name}` };
  }
}

// ── Main agent function ────────────────────────────────────────────────────
export async function runAgentQuery(
  query: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []
): Promise<{ response: string; actionsPerformed: string[]; durationMs: number }> {
  const start = Date.now();
  const actionsPerformed: string[] = [];

  const messages: Message[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...conversationHistory.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    { role: 'user', content: query },
  ];

  // Agentic loop — keep going until no more tool calls
  while (true) {
    const response = await ollama.chat({
      model: OLLAMA_MODEL,
      messages,
      tools,
      stream: false,
    });

    const msg = response.message;
    messages.push(msg);

    // No tool calls → we're done
    if (!msg.tool_calls || msg.tool_calls.length === 0) {
      const text = typeof msg.content === 'string' ? msg.content : 'Action completed.';
      return { response: text, actionsPerformed, durationMs: Date.now() - start };
    }

    // Execute each tool call and append results
    for (const call of msg.tool_calls) {
      const fnName = call.function.name;
      const fnArgs = call.function.arguments as Record<string, string>;

      actionsPerformed.push(fnName);
      const result = executeTool(fnName, fnArgs);

      messages.push({
        role: 'tool',
        content: JSON.stringify(result),
      });
    }
  }
}

// ── Health check helper ────────────────────────────────────────────────────
export async function checkOllamaHealth(): Promise<{ ok: boolean; model: string; url: string }> {
  try {
    const models = await ollama.list();
    const available = models.models.map(m => m.name);
    const modelAvailable = available.some(n => n.startsWith(OLLAMA_MODEL.split(':')[0]));
    return { ok: modelAvailable, model: OLLAMA_MODEL, url: OLLAMA_URL };
  } catch {
    return { ok: false, model: OLLAMA_MODEL, url: OLLAMA_URL };
  }
}
