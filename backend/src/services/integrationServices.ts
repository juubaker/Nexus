import { CrmContact, SupportTicket } from '../types';
import { hcmService } from './hcmService';

// ── CRM Service ────────────────────────────────────────────────────────────
const crmContacts: Map<string, CrmContact> = new Map();

export const crmService = {
  syncFromHCM(): { synced: number; created: number; updated: number } {
    const employees = hcmService.getAllEmployees();
    let created = 0; let updated = 0;
    employees.forEach(emp => {
      const existing = crmContacts.get(emp.id);
      const contact: CrmContact = {
        id: `CRM-${emp.id}`,
        employeeId: emp.id,
        name: emp.name,
        email: emp.email,
        accountName: 'CorpHQ',
        syncedAt: new Date().toISOString(),
        fields: {
          department: emp.department,
          role: emp.role,
          startDate: emp.startDate,
        },
      };
      if (existing) updated++;
      else created++;
      crmContacts.set(emp.id, contact);
    });
    return { synced: employees.length, created, updated };
  },

  getContacts(): CrmContact[] { return Array.from(crmContacts.values()); },

  getContact(employeeId: string): CrmContact | undefined {
    return crmContacts.get(employeeId);
  },

  simulateLatency(): Promise<void> {
    return new Promise(r => setTimeout(r, Math.random() * 300 + 150));
  },
};

// ── Ticketing Service ──────────────────────────────────────────────────────
const TICKET_TITLES = [
  'Benefits enrollment error for new hire',
  'Cannot access HCM portal after password reset',
  'Payroll discrepancy for Q2 2026',
  'Dependent eligibility verification needed',
  'Open enrollment extension request',
  'FSA balance not reflecting recent contribution',
  'W-2 form missing from employee portal',
  'Direct deposit update not saving',
  'PTO balance incorrect after carry-over',
  'Health plan selection not confirmed',
];

const TAGS = [
  ['benefits', 'enrollment'],
  ['access', 'authentication'],
  ['payroll', 'finance'],
  ['compliance', 'eligibility'],
  ['enrollment', 'deadline'],
  ['fsa', 'benefits'],
  ['tax', 'documents'],
  ['payroll', 'banking'],
  ['pto', 'leave'],
  ['benefits', 'health'],
];

let ticketCounter = 100;

function generateTicket(): SupportTicket {
  const idx = Math.floor(Math.random() * TICKET_TITLES.length);
  const priority = (['low', 'medium', 'high', 'critical'] as const)[Math.floor(Math.random() * 4)];
  const createdAt = new Date();
  const slaHours = priority === 'critical' ? 2 : priority === 'high' ? 8 : priority === 'medium' ? 24 : 72;
  const slaDeadline = new Date(createdAt.getTime() + slaHours * 3600000);
  return {
    id: `TKT-${String(ticketCounter++).padStart(5, '0')}`,
    title: TICKET_TITLES[idx],
    description: `User reported: ${TICKET_TITLES[idx]}. Requires investigation and resolution.`,
    priority,
    status: 'open',
    createdAt: createdAt.toISOString(),
    slaDeadline: slaDeadline.toISOString(),
    tags: TAGS[idx],
    sourceSystem: 'HCM',
  };
}

const tickets: SupportTicket[] = Array.from({ length: 8 }, generateTicket);

export const ticketingService = {
  getTickets(): SupportTicket[] { return tickets; },

  createTicket(data: Partial<SupportTicket>): SupportTicket {
    const ticket = { ...generateTicket(), ...data };
    tickets.unshift(ticket);
    return ticket;
  },

  routeTicket(ticketId: string): { assignedTo: string; reasoning: string } {
    const ticket = tickets.find(t => t.id === ticketId);
    const routingMap: Record<string, string> = {
      benefits: 'benefits-team@corp.example.com',
      payroll: 'payroll-team@corp.example.com',
      access: 'it-support@corp.example.com',
      compliance: 'hr-compliance@corp.example.com',
    };
    const tag = ticket?.tags[0] ?? 'general';
    const assignedTo = routingMap[tag] ?? 'general-support@corp.example.com';
    if (ticket) {
      ticket.status = 'in_progress';
      ticket.assignedTo = assignedTo;
    }
    return { assignedTo, reasoning: `Routed based on tag: ${tag}` };
  },

  simulateLatency(): Promise<void> {
    return new Promise(r => setTimeout(r, Math.random() * 150 + 80));
  },
};
