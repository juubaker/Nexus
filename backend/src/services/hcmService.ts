import { Employee } from '../types';

const DEPARTMENTS = ['Engineering', 'HR', 'Finance', 'Sales', 'Legal', 'Product', 'Marketing'];
const BENEFITS = ['Medical', 'Dental', 'Vision', '401k', 'FSA', 'HSA', 'Life Insurance', 'PTO'];
const FIRST_NAMES = ['Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Sam', 'Drew',
  'Avery', 'Quinn', 'Blake', 'Cameron', 'Dana', 'Emery', 'Frankie'];
const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller',
  'Davis', 'Wilson', 'Moore', 'Anderson', 'Taylor', 'Thomas', 'Jackson', 'White'];
const ROLES = ['Engineer', 'Manager', 'Analyst', 'Director', 'Specialist', 'Lead', 'Associate'];

function rand<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min: number, max: number): number { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randDate(yearsBack: number): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - Math.random() * yearsBack);
  return d.toISOString().split('T')[0];
}

function generateEmployee(id: number): Employee {
  const firstName = rand(FIRST_NAMES);
  const lastName = rand(LAST_NAMES);
  const dept = rand(DEPARTMENTS);
  const benefitCount = randInt(2, 5);
  const shuffled = [...BENEFITS].sort(() => Math.random() - 0.5);
  return {
    id: `EMP-${String(id).padStart(4, '0')}`,
    name: `${firstName} ${lastName}`,
    department: dept,
    role: `${dept} ${rand(ROLES)}`,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@corp.example.com`,
    startDate: randDate(12),
    benefits: shuffled.slice(0, benefitCount),
    salary: randInt(70000, 220000),
    managerId: id > 1 ? `EMP-${String(randInt(1, id - 1)).padStart(4, '0')}` : undefined,
  };
}

// Generate 50 synthetic employees once at startup
const employees: Employee[] = Array.from({ length: 50 }, (_, i) => generateEmployee(i + 1));

export const hcmService = {
  getAllEmployees(): Employee[] { return employees; },

  getEmployee(id: string): Employee | undefined {
    return employees.find(e => e.id === id);
  },

  getRecentChanges(since: Date): Employee[] {
    // Simulate 2-5 changed records
    const count = Math.floor(Math.random() * 4) + 2;
    return employees.slice(0, count);
  },

  validateBenefits(employeeId: string): { valid: boolean; issues: string[] } {
    const emp = employees.find(e => e.id === employeeId);
    if (!emp) return { valid: false, issues: ['Employee not found'] };
    const issues: string[] = [];
    if (!emp.benefits.includes('Medical')) issues.push('No medical coverage selected');
    if (emp.salary > 100000 && !emp.benefits.includes('401k')) issues.push('401k recommended for salary bracket');
    return { valid: issues.length === 0, issues };
  },

  simulateLatency(): Promise<void> {
    return new Promise(r => setTimeout(r, Math.random() * 200 + 100));
  },
};
