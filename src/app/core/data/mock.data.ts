import {
  AdminMessage,
  AdminNotification,
  Announcement,
  Application,
  ApplicationStatus,
  AuditEntry,
  BusinessRecord,
  Citizen,
  Inspection,
  Invoice,
  OfficerTask,
  Priority,
  PropertyRecord,
  Receipt,
  Refund,
  RevenueHead,
  RoleId,
  ServiceCategoryId,
  StaffUser,
  StoredDocument,
} from '../models';
import { SUB_METROS } from './reference.data';

/**
 * Operational mock data for the administration portal.
 *
 * Anchor records — the ones opened on detail screens — are written by hand so
 * they hang together properly. The rest of the volume that makes the tables
 * feel real is generated from a seeded pseudo-random sequence, so the data is
 * identical on every reload and across every developer's machine.
 */

// --- Deterministic generator -------------------------------------------------

/** Mulberry32: small, fast, and identical everywhere. */
function seeded(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rnd = seeded(20260725);

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(rnd() * items.length)];
}

function between(min: number, max: number): number {
  return Math.floor(rnd() * (max - min + 1)) + min;
}

function isoDate(daysAgo: number): string {
  const date = new Date(2026, 6, 25);
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().slice(0, 10);
}

function stamp(daysAgo: number, hour = 9, minute = 15): string {
  return `${isoDate(daysAgo)} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

// --- Name pools --------------------------------------------------------------

const FIRST_NAMES = [
  'Akosua', 'Kofi', 'Ama', 'Yaw', 'Esi', 'Kwame', 'Abena', 'Kojo', 'Adwoa', 'Kwabena',
  'Afia', 'Kwaku', 'Akua', 'Kwadwo', 'Yaa', 'Nana', 'Ibrahim', 'Fatima', 'Emmanuel',
  'Grace', 'Samuel', 'Comfort', 'Daniel', 'Mary', 'Joseph', 'Gifty', 'Isaac', 'Vida',
];

const LAST_NAMES = [
  'Mensah', 'Boateng', 'Owusu', 'Asante', 'Danquah', 'Ofori', 'Antwi', 'Serwaa',
  'Adjei', 'Agyemang', 'Appiah', 'Darko', 'Frimpong', 'Gyamfi', 'Osei', 'Amoah',
  'Nyarko', 'Tetteh', 'Quartey', 'Lartey', 'Addo', 'Bediako', 'Sarpong', 'Aidoo',
];

const BUSINESS_WORDS = [
  'Sunrise', 'Golden', 'Unity', 'Royal', 'Divine', 'Excel', 'Prime', 'Blessed',
  'Peace', 'Grace', 'Victory', 'Star', 'Green', 'Silver', 'Crown', 'Hope',
];

const BUSINESS_TYPES = [
  'Ventures', 'Enterprise', 'Trading', 'Company Ltd', 'Services', 'Stores', 'Kitchen',
  'Pharmacy', 'Provisions', 'Salon', 'Bakery', 'Hardware',
];

const BUSINESS_CATEGORIES = [
  'Chop Bar & Restaurant', 'Retail Shop', 'Chemical Shop', 'Sachet Water Producer',
  'Hairdressing & Barbering', 'Pharmacy', 'Fuel Filling Station', 'Guest House & Hotel',
  'Bakery', 'Hardware Store', 'Cold Store', 'Printing Press',
];

const SERVICES: { id: string; name: string; category: ServiceCategoryId }[] = [
  { id: 'svc-bop', name: 'Business Operating Permit', category: 'business' },
  { id: 'svc-bop-renewal', name: 'Permit Renewal', category: 'business' },
  { id: 'svc-temp-permit', name: 'Temporary Permit', category: 'business' },
  { id: 'svc-business-update', name: 'Business Detail Update', category: 'business' },
  { id: 'svc-property-registration', name: 'Property Registration', category: 'property' },
  { id: 'svc-property-rates', name: 'Property Rate Payment', category: 'property' },
  { id: 'svc-building-permit', name: 'Building Permit', category: 'building' },
  { id: 'svc-development-permit', name: 'Development Permit', category: 'building' },
  { id: 'svc-planning-approval', name: 'Planning Approval', category: 'building' },
  { id: 'svc-food-vendor', name: 'Food Vendor Licence', category: 'environmental' },
  { id: 'svc-health-certificate', name: 'Environmental Health Certificate', category: 'environmental' },
  { id: 'svc-sanitation-permit', name: 'Sanitation Permit', category: 'environmental' },
  { id: 'svc-stall-allocation', name: 'Market Stall Allocation', category: 'market' },
  { id: 'svc-trading-licence', name: 'Trading Licence', category: 'market' },
  { id: 'svc-lorry-park', name: 'Lorry Park Permit', category: 'transport' },
  { id: 'svc-burial-permit', name: 'Burial Permit', category: 'community' },
  { id: 'svc-event-permit', name: 'Public Event Permit', category: 'community' },
];

function fullName(): string {
  return `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
}

function phone(): string {
  return `+233 ${pick(['24', '20', '54', '27', '55'])} ${between(100, 999)} ${between(1000, 9999)}`;
}

function ghanaCard(): string {
  return `GHA-${between(100000000, 999999999)}-${between(0, 9)}`;
}

// --- Staff -------------------------------------------------------------------

const STAFF_SEED: { name: string; role: RoleId; department: string; designation: string }[] = [
  { name: 'Emmanuel Adjei-Nyarko', role: 'DISTRICT_ADMINISTRATOR', department: 'Records & Administration', designation: 'Municipal Coordinating Director' },
  { name: 'Selina Owusu', role: 'SYSTEM_ADMINISTRATOR', department: 'Records & Administration', designation: 'ICT Manager' },
  { name: 'Yaw Antwi', role: 'FINANCE_OFFICER', department: 'Finance & Revenue', designation: 'Municipal Finance Officer' },
  { name: 'Kofi Boateng', role: 'BUSINESS_LICENSING_OFFICER', department: 'Business Licensing', designation: 'Principal Licensing Officer' },
  { name: 'Ama Serwaa', role: 'ENVIRONMENTAL_HEALTH_OFFICER', department: 'Environmental Health', designation: 'Chief Environmental Health Officer' },
  { name: 'Nana Ofori', role: 'PHYSICAL_PLANNING_OFFICER', department: 'Physical Planning', designation: 'Municipal Planning Officer' },
  { name: 'Esi Danquah', role: 'RECORDS_OFFICER', department: 'Records & Administration', designation: 'Records Officer' },
  { name: 'Ibrahim Mohammed', role: 'INSPECTOR', department: 'Works', designation: 'Building Inspector' },
  { name: 'Comfort Asare', role: 'REVENUE_OFFICER', department: 'Finance & Revenue', designation: 'Revenue Superintendent' },
  { name: 'Daniel Agyapong', role: 'REVENUE_OFFICER', department: 'Finance & Revenue', designation: 'Revenue Collector' },
  { name: 'Gifty Amankwah', role: 'CUSTOMER_SERVICE_OFFICER', department: 'Records & Administration', designation: 'Customer Service Officer' },
  { name: 'Michael Tetteh', role: 'INSPECTOR', department: 'Environmental Health', designation: 'Environmental Health Inspector' },
  { name: 'Patience Kumi', role: 'BUSINESS_LICENSING_OFFICER', department: 'Business Licensing', designation: 'Licensing Officer' },
  { name: 'Richard Nkrumah', role: 'PHYSICAL_PLANNING_OFFICER', department: 'Physical Planning', designation: 'Development Control Officer' },
  { name: 'Joyce Ampofo', role: 'FINANCE_OFFICER', department: 'Finance & Revenue', designation: 'Accountant' },
  { name: 'Solomon Baidoo', role: 'INSPECTOR', department: 'Works', designation: 'Site Inspector' },
  { name: 'Rita Aggrey', role: 'CUSTOMER_SERVICE_OFFICER', department: 'Records & Administration', designation: 'Front Desk Officer' },
  { name: 'Bernard Oduro', role: 'REVENUE_OFFICER', department: 'Finance & Revenue', designation: 'Market Revenue Collector' },
];

export const STAFF: StaffUser[] = STAFF_SEED.map((seed, i) => {
  const [firstName, ...rest] = seed.name.split(' ');
  const lastName = rest.join(' ');
  return {
    id: `stf-${String(i + 1).padStart(3, '0')}`,
    staffNumber: `GEA/STF/${String(1200 + i).padStart(4, '0')}`,
    firstName,
    lastName,
    email: `${firstName.toLowerCase()}.${lastName.split(' ')[0].toLowerCase()}@gaeast.gov.gh`,
    phone: phone(),
    role: seed.role,
    department: seed.department,
    designation: seed.designation,
    status: i === 16 ? 'SUSPENDED' : i === 17 ? 'PENDING' : 'ACTIVE',
    lastLogin: stamp(between(0, 6), between(7, 17), between(0, 59)),
    createdOn: isoDate(between(120, 900)),
    initials: (firstName.charAt(0) + lastName.charAt(0)).toUpperCase(),
  };
});

/** The signed-in officer for this demonstration. */
export const CURRENT_STAFF: StaffUser = STAFF[3];

const OFFICERS = STAFF.filter((s) =>
  ['BUSINESS_LICENSING_OFFICER', 'PHYSICAL_PLANNING_OFFICER', 'ENVIRONMENTAL_HEALTH_OFFICER', 'REVENUE_OFFICER'].includes(
    s.role,
  ),
);

const INSPECTORS = STAFF.filter((s) => s.role === 'INSPECTOR' || s.role === 'ENVIRONMENTAL_HEALTH_OFFICER');

// --- Applications ------------------------------------------------------------

const STATUS_POOL: ApplicationStatus[] = [
  'SUBMITTED', 'SUBMITTED', 'UNDER_REVIEW', 'UNDER_REVIEW', 'UNDER_REVIEW',
  'AWAITING_PAYMENT', 'AWAITING_PAYMENT', 'INSPECTION_SCHEDULED', 'INSPECTION_PASSED',
  'APPROVED', 'ISSUED', 'ISSUED', 'RETURNED', 'REJECTED',
];

const PRIORITY_POOL: Priority[] = ['NORMAL', 'NORMAL', 'NORMAL', 'HIGH', 'LOW', 'URGENT'];

function timelineFor(status: ApplicationStatus, age: number, officer: string, amount: number): Application['timeline'] {
  const events: Application['timeline'] = [
    { date: stamp(age, 9, 12), status: 'SUBMITTED', title: 'Application submitted', actor: 'Applicant' },
  ];

  const reached = (s: ApplicationStatus) => {
    const order: ApplicationStatus[] = [
      'SUBMITTED', 'UNDER_REVIEW', 'AWAITING_PAYMENT', 'INSPECTION_SCHEDULED',
      'INSPECTION_PASSED', 'APPROVED', 'ISSUED',
    ];
    return order.indexOf(s) <= order.indexOf(status);
  };

  if (status === 'RETURNED') {
    events.push({ date: stamp(age - 1, 11, 5), status: 'UNDER_REVIEW', title: 'Review started', actor: officer });
    events.push({
      date: stamp(age - 2, 14, 30),
      status: 'RETURNED',
      title: 'Returned for correction',
      detail: 'The uploaded business registration certificate is not legible.',
      actor: officer,
    });
    return events;
  }

  if (status === 'REJECTED') {
    events.push({ date: stamp(age - 1, 10, 20), status: 'UNDER_REVIEW', title: 'Review started', actor: officer });
    events.push({
      date: stamp(age - 3, 15, 10),
      status: 'REJECTED',
      title: 'Application rejected',
      detail: 'Premises fall outside the approved zoning for this trade.',
      actor: officer,
    });
    return events;
  }

  if (reached('UNDER_REVIEW') && status !== 'SUBMITTED') {
    events.push({ date: stamp(age - 1, 10, 40), status: 'UNDER_REVIEW', title: 'Review started', actor: officer });
  }
  if (reached('AWAITING_PAYMENT') && status !== 'SUBMITTED' && status !== 'UNDER_REVIEW') {
    events.push({
      date: stamp(age - 2, 12, 15),
      status: 'AWAITING_PAYMENT',
      title: `Assessed — GH₵ ${amount.toFixed(2)}`,
      detail: 'Invoice raised and sent to the applicant.',
      actor: officer,
    });
  }
  if (['INSPECTION_SCHEDULED', 'INSPECTION_PASSED', 'APPROVED', 'ISSUED'].includes(status)) {
    events.push({
      date: stamp(age - 3, 8, 45),
      status: 'NOTE',
      title: `Payment received — GH₵ ${amount.toFixed(2)}`,
      detail: 'Mobile Money.',
      actor: 'System',
    });
    events.push({
      date: stamp(age - 3, 9, 30),
      status: 'INSPECTION_SCHEDULED',
      title: 'Inspection scheduled',
      actor: officer,
    });
  }
  if (['INSPECTION_PASSED', 'APPROVED', 'ISSUED'].includes(status)) {
    events.push({
      date: stamp(age - 5, 11, 50),
      status: 'INSPECTION_PASSED',
      title: 'Inspection passed',
      detail: 'Premises satisfactory.',
      actor: pick(INSPECTORS).firstName + ' ' + pick(INSPECTORS).lastName,
    });
  }
  if (['APPROVED', 'ISSUED'].includes(status)) {
    events.push({ date: stamp(age - 6, 14, 0), status: 'APPROVED', title: 'Application approved', actor: 'Emmanuel Adjei-Nyarko' });
  }
  if (status === 'ISSUED') {
    events.push({
      date: stamp(age - 6, 14, 5),
      status: 'ISSUED',
      title: 'Permit issued',
      detail: `Permit GEA/BOP/2026/${String(between(100, 900)).padStart(6, '0')} issued.`,
      actor: 'System',
    });
  }

  return events;
}

function makeApplication(index: number): Application {
  const service = pick(SERVICES);
  const status = pick(STATUS_POOL);
  const officerStaff = pick(OFFICERS);
  const officer = `${officerStaff.firstName} ${officerStaff.lastName}`;
  const age = between(1, 45);
  const assessed = between(4, 60) * 25;
  const paid = ['INSPECTION_SCHEDULED', 'INSPECTION_PASSED', 'APPROVED', 'ISSUED'].includes(status)
    ? assessed
    : status === 'AWAITING_PAYMENT'
      ? (rnd() > 0.7 ? Math.round(assessed / 2) : 0)
      : 0;

  const applicant = fullName();

  return {
    id: `app-${String(index).padStart(3, '0')}`,
    applicationNumber: `ASP-2026-${String(1000 + index).padStart(6, '0')}`,
    applicant,
    applicantPhone: phone(),
    applicantEmail: `${applicant.toLowerCase().replace(' ', '.')}@example.com`,
    ghanaCardNo: ghanaCard(),
    subject: `${pick(BUSINESS_WORDS)} ${pick(BUSINESS_TYPES)} — ${service.name}`,
    serviceId: service.id,
    serviceName: service.name,
    categoryId: service.category,
    district: 'Ga East Municipal Assembly',
    subMetro: pick(SUB_METROS),
    status,
    officer,
    officerId: officerStaff.id,
    priority: pick(PRIORITY_POOL),
    submittedDate: isoDate(age),
    ageDays: age,
    assessedAmount: assessed,
    amountPaid: paid,
    documents: [
      { name: 'Business registration certificate.pdf', type: 'PDF', size: `${between(120, 900)} KB`, uploadedOn: isoDate(age), verified: true },
      { name: 'Ghana Card.pdf', type: 'PDF', size: `${between(100, 300)} KB`, uploadedOn: isoDate(age), verified: true },
      { name: 'Premises photograph.jpg', type: 'JPG', size: `${between(400, 1800)} KB`, uploadedOn: isoDate(age), verified: rnd() > 0.3 },
      { name: 'Tenancy agreement.pdf', type: 'PDF', size: `${between(300, 1200)} KB`, uploadedOn: isoDate(age), verified: rnd() > 0.4 },
    ],
    timeline: timelineFor(status, age, officer, assessed),
    officerNotes:
      status === 'RETURNED'
        ? 'Applicant notified. Awaiting a clearer copy of the registration certificate.'
        : status === 'REJECTED'
          ? 'Referred to Physical Planning; the site is zoned residential.'
          : 'Details verified against the register. No adverse history.',
  };
}

/** Two hand-written anchors so the detail screens read coherently. */
const ANCHOR_APPLICATIONS: Application[] = [
  {
    id: 'app-001',
    applicationNumber: 'ASP-2026-001001',
    applicant: 'Akosua Mensah',
    applicantPhone: '+233 24 123 4567',
    applicantEmail: 'akosua.mensah@example.com',
    ghanaCardNo: 'GHA-723451890-4',
    subject: 'Akosua’s Kitchen — 2026 renewal',
    serviceId: 'svc-bop-renewal',
    serviceName: 'Permit Renewal',
    categoryId: 'business',
    district: 'Ga East Municipal Assembly',
    subMetro: 'Ashongman',
    status: 'AWAITING_PAYMENT',
    officer: 'Kofi Boateng',
    officerId: 'stf-004',
    priority: 'HIGH',
    submittedDate: '2026-07-08',
    ageDays: 17,
    assessedAmount: 450,
    amountPaid: 0,
    businessId: 'biz-001',
    documents: [
      { name: '2025 permit certificate.pdf', type: 'PDF', size: '284 KB', uploadedOn: '2026-07-08', verified: true },
      { name: 'Payment receipt 2025.pdf', type: 'PDF', size: '96 KB', uploadedOn: '2026-07-08', verified: true },
      { name: 'Premises photograph.jpg', type: 'JPG', size: '820 KB', uploadedOn: '2026-07-08', verified: true },
    ],
    timeline: [
      { date: '2026-07-08 09:12', status: 'SUBMITTED', title: 'Application submitted', actor: 'Applicant' },
      { date: '2026-07-09 11:40', status: 'UNDER_REVIEW', title: 'Review started', detail: 'Assigned to Kofi Boateng, Business Licensing.', actor: 'Kofi Boateng' },
      { date: '2026-07-11 15:05', status: 'AWAITING_PAYMENT', title: 'Assessed — GH₵ 450.00', detail: 'Invoice GEA/INV/2026/002841 raised, due 10 August 2026.', actor: 'Kofi Boateng' },
    ],
    officerNotes:
      'Details verified against the 2025 record. No change of premises, so no fresh inspection is required. Awaiting settlement of the invoice before approval.',
  },
  {
    id: 'app-002',
    applicationNumber: 'ASP-2026-001002',
    applicant: 'Akosua Mensah',
    applicantPhone: '+233 24 123 4567',
    applicantEmail: 'akosua.mensah@example.com',
    ghanaCardNo: 'GHA-723451890-4',
    subject: 'Akosua’s Kitchen — food vendor licence 2026',
    serviceId: 'svc-food-vendor',
    serviceName: 'Food Vendor Licence',
    categoryId: 'environmental',
    district: 'Ga East Municipal Assembly',
    subMetro: 'Ashongman',
    status: 'INSPECTION_SCHEDULED',
    officer: 'Ama Serwaa',
    officerId: 'stf-005',
    priority: 'NORMAL',
    submittedDate: '2026-06-24',
    ageDays: 31,
    assessedAmount: 300,
    amountPaid: 300,
    businessId: 'biz-001',
    inspectionId: 'ins-001',
    documents: [
      { name: 'Health certificates (7 staff).pdf', type: 'PDF', size: '1.2 MB', uploadedOn: '2026-06-24', verified: true },
      { name: 'Premises photograph.jpg', type: 'JPG', size: '840 KB', uploadedOn: '2026-06-24', verified: true },
      { name: 'Ghana Card.pdf', type: 'PDF', size: '210 KB', uploadedOn: '2026-06-24', verified: true },
    ],
    timeline: [
      { date: '2026-06-24 14:22', status: 'SUBMITTED', title: 'Application submitted', actor: 'Applicant' },
      { date: '2026-06-26 10:03', status: 'UNDER_REVIEW', title: 'Review started', actor: 'Ama Serwaa' },
      { date: '2026-06-30 09:15', status: 'AWAITING_PAYMENT', title: 'Assessed — GH₵ 300.00', actor: 'Ama Serwaa' },
      { date: '2026-07-02 16:48', status: 'NOTE', title: 'Payment received — GH₵ 300.00', detail: 'Receipt GEA/RCT/2026/007713, Mobile Money.', actor: 'System' },
      { date: '2026-07-14 08:30', status: 'INSPECTION_SCHEDULED', title: 'Inspection scheduled for 29 July 2026', detail: 'Environmental Health Officer: Ama Serwaa.', actor: 'Ama Serwaa' },
    ],
    officerNotes: 'Health certificates current for all seven staff. Premises inspection is the last step before issue.',
  },
];

export const APPLICATIONS: Application[] = [
  ...ANCHOR_APPLICATIONS,
  ...Array.from({ length: 86 }, (_, i) => makeApplication(i + 3)),
];

// --- Businesses --------------------------------------------------------------

function makeBusiness(index: number): BusinessRecord {
  const name = `${pick(BUSINESS_WORDS)} ${pick(BUSINESS_TYPES)}`;
  const grade = pick(['Grade A', 'Grade B', 'Grade C']);
  const permitStatus = pick<BusinessRecord['permitStatus']>(['VALID', 'VALID', 'VALID', 'EXPIRED', 'PENDING']);
  const outstanding = permitStatus === 'VALID' ? (rnd() > 0.75 ? between(1, 12) * 50 : 0) : between(2, 20) * 50;
  const registeredYear = between(2016, 2025);

  return {
    id: `biz-${String(index).padStart(3, '0')}`,
    businessNumber: `GEA/BUS/${String(index * 7 + 100).padStart(6, '0')}`,
    businessName: name,
    owner: fullName(),
    ownerPhone: phone(),
    category: pick(BUSINESS_CATEGORIES),
    grade,
    ownershipType: pick(['Sole Proprietorship', 'Partnership', 'Company Limited by Shares']),
    registrationNo: `BN-${registeredYear}-${between(100000, 999999)}`,
    tinNo: `P00${between(10000000, 99999999)}`,
    location: `${pick(['Plot', 'House', 'Shop'])} ${between(1, 90)}, ${pick(SUB_METROS)}`,
    subMetro: pick(SUB_METROS),
    digitalAddress: `GE-${between(100, 999)}-${between(1000, 9999)}`,
    employees: between(1, 45),
    registeredOn: `${registeredYear}-${String(between(1, 12)).padStart(2, '0')}-${String(between(1, 28)).padStart(2, '0')}`,
    status: pick<BusinessRecord['status']>(['ACTIVE', 'ACTIVE', 'ACTIVE', 'ACTIVE', 'DORMANT', 'CLOSED']),
    permitStatus,
    currentPermitNo: permitStatus === 'VALID' ? `GEA/BOP/2026/${String(index * 3 + 200).padStart(6, '0')}` : undefined,
    permitExpiry: permitStatus === 'VALID' ? '2026-12-31' : permitStatus === 'EXPIRED' ? '2025-12-31' : undefined,
    outstanding,
    compliance: between(55, 100),
    permits: Array.from({ length: between(1, 4) }, (_, i) => {
      const year = 2026 - i;
      return {
        permitNumber: `GEA/BOP/${year}/${String(index * 3 + 200 + i).padStart(6, '0')}`,
        year,
        issuedOn: `${year}-0${between(1, 4)}-${String(between(10, 28)).padStart(2, '0')}`,
        expiresOn: `${year}-12-31`,
        status: (i === 0 && permitStatus === 'VALID' ? 'ACTIVE' : 'EXPIRED') as 'ACTIVE' | 'EXPIRED',
        amount: between(8, 40) * 50,
      };
    }),
    paymentHistory: Array.from({ length: between(2, 6) }, (_, i) => ({
      date: isoDate(between(20, 700)),
      reference: `GEA/RCT/2026/${String(between(1000, 9999)).padStart(6, '0')}`,
      description: pick(['Permit fee', 'Renewal fee', 'Inspection fee', 'Late penalty']),
      amount: between(2, 30) * 50,
      method: pick(['Mobile Money', 'Debit Card', 'Bank Transfer', 'Cash', 'POS']),
    })),
    complianceLog: Array.from({ length: between(1, 4) }, () => ({
      date: isoDate(between(30, 500)),
      event: pick(['Routine inspection', 'Complaint investigation', 'Sanitation check', 'Re-inspection']),
      outcome: pick<'PASSED' | 'FAILED' | 'NOTICE' | 'RESOLVED'>(['PASSED', 'PASSED', 'NOTICE', 'FAILED', 'RESOLVED']),
      officer: fullName(),
      note: pick([
        'Premises found in good order.',
        'Waste bins not covered. Notice served.',
        'Hand-washing facility installed as required.',
        'Staff health certificates sighted and current.',
      ]),
    })),
  };
}

const ANCHOR_BUSINESS: BusinessRecord = {
  id: 'biz-001',
  businessNumber: 'GEA/BUS/000418',
  businessName: 'Akosua’s Kitchen',
  owner: 'Akosua Mensah',
  ownerPhone: '+233 24 123 4567',
  category: 'Chop Bar & Restaurant',
  grade: 'Grade B',
  ownershipType: 'Sole Proprietorship',
  registrationNo: 'BN-2019-114577',
  tinNo: 'P0012345678',
  location: 'Plot 42, Ashongman Estates',
  subMetro: 'Ashongman',
  digitalAddress: 'GE-183-2401',
  employees: 7,
  registeredOn: '2019-03-14',
  status: 'ACTIVE',
  permitStatus: 'EXPIRED',
  permitExpiry: '2025-12-31',
  outstanding: 450,
  compliance: 92,
  permits: [
    { permitNumber: 'GEA/BOP/2025/000377', year: 2025, issuedOn: '2025-02-20', expiresOn: '2025-12-31', status: 'EXPIRED', amount: 400 },
    { permitNumber: 'GEA/BOP/2024/000291', year: 2024, issuedOn: '2024-02-18', expiresOn: '2024-12-31', status: 'EXPIRED', amount: 360 },
    { permitNumber: 'GEA/BOP/2023/000204', year: 2023, issuedOn: '2023-03-02', expiresOn: '2023-12-31', status: 'EXPIRED', amount: 320 },
  ],
  paymentHistory: [
    { date: '2026-07-02', reference: 'GEA/RCT/2026/007713', description: 'Food vendor licence', amount: 300, method: 'Mobile Money' },
    { date: '2025-02-20', reference: 'GEA/RCT/2025/004410', description: 'Permit fee 2025', amount: 400, method: 'Mobile Money' },
    { date: '2024-02-18', reference: 'GEA/RCT/2024/003118', description: 'Permit fee 2024', amount: 360, method: 'Cash' },
  ],
  complianceLog: [
    { date: '2026-03-11', event: 'Routine sanitation inspection', outcome: 'PASSED', officer: 'Ama Serwaa', note: 'Premises satisfactory. Staff certificates current.' },
    { date: '2025-08-04', event: 'Complaint investigation', outcome: 'RESOLVED', officer: 'Michael Tetteh', note: 'Waste disposal complaint. Bins replaced within the notice period.' },
    { date: '2025-02-15', event: 'Pre-permit inspection', outcome: 'PASSED', officer: 'Ama Serwaa' },
  ],
};

export const BUSINESSES: BusinessRecord[] = [
  ANCHOR_BUSINESS,
  ...Array.from({ length: 63 }, (_, i) => makeBusiness(i + 2)),
];

// --- Properties --------------------------------------------------------------

function makeProperty(index: number): PropertyRecord {
  const use = pick<PropertyRecord['use']>(['Residential', 'Residential', 'Commercial', 'Industrial', 'Mixed use']);
  const rateableValue = between(40, 900) * 1000;
  const currentRate = Math.round(rateableValue * 0.002);
  const paidRatio = rnd();
  const outstanding = paidRatio > 0.6 ? 0 : Math.round(currentRate * (1 - paidRatio));

  return {
    id: `prp-${String(index).padStart(3, '0')}`,
    propertyNumber: `GEA/PR/${between(2015, 2025)}/${String(index * 11 + 400).padStart(5, '0')}`,
    owner: fullName(),
    ownerPhone: phone(),
    description: `${pick(['3 bedroom house', '2 bedroom flat', 'Shop unit', 'Warehouse', 'Storey building', 'Compound house'])}`,
    use,
    location: `${pick(['Plot', 'House'])} ${between(1, 120)}, ${pick(SUB_METROS)}`,
    subMetro: pick(SUB_METROS),
    digitalAddress: `GE-${between(100, 999)}-${between(1000, 9999)}`,
    latitude: 5.65 + rnd() * 0.12,
    longitude: -0.24 + rnd() * 0.12,
    rateableValue,
    currentRate,
    outstanding,
    lastValuation: `${between(2019, 2025)}-${String(between(1, 12)).padStart(2, '0')}-${String(between(1, 28)).padStart(2, '0')}`,
    status: pick<PropertyRecord['status']>(['RATED', 'RATED', 'RATED', 'RATED', 'UNRATED', 'EXEMPT']),
    rateHistory: [2026, 2025, 2024, 2023].map((year) => {
      const charged = year === 2026 ? currentRate : Math.round(currentRate * (0.85 - (2026 - year) * 0.05));
      const balance = year === 2026 ? outstanding : 0;
      return { year, charged, paid: charged - balance, balance };
    }),
  };
}

export const PROPERTIES: PropertyRecord[] = Array.from({ length: 72 }, (_, i) => makeProperty(i + 1));

// --- Citizens ----------------------------------------------------------------

export const CITIZENS: Citizen[] = Array.from({ length: 58 }, (_, i) => {
  const name = i === 0 ? 'Akosua Mensah' : fullName();
  return {
    id: `ctz-${String(i + 1).padStart(3, '0')}`,
    name,
    ghanaCardNo: i === 0 ? 'GHA-723451890-4' : ghanaCard(),
    phone: i === 0 ? '+233 24 123 4567' : phone(),
    email: `${name.toLowerCase().replace(/ /g, '.')}@example.com`,
    accountType: pick(['Citizen', 'Business Owner', 'Property Owner', 'Organisation']),
    subMetro: pick(SUB_METROS),
    registeredOn: isoDate(between(30, 800)),
    applications: between(0, 9),
    status: rnd() > 0.95 ? 'SUSPENDED' : 'ACTIVE',
  };
});

// --- Money -------------------------------------------------------------------

const REVENUE_HEAD_NAMES = [
  'Property Rates', 'Business Licences', 'Building Permits', 'Market Fees',
  'Lorry Park Fees', 'Environmental Fees', 'Burial Fees', 'Court Fines',
  'Rental Income', 'Development Levies', 'Advertising Fees', 'Investment Income',
];

const REVENUE_ICONS = [
  'pi pi-home', 'pi pi-briefcase', 'pi pi-building', 'pi pi-shopping-bag',
  'pi pi-car', 'pi pi-shield', 'pi pi-bookmark', 'pi pi-flag',
  'pi pi-key', 'pi pi-chart-line', 'pi pi-megaphone', 'pi pi-wallet',
];

export const REVENUE_HEADS: RevenueHead[] = REVENUE_HEAD_NAMES.map((name, i) => {
  // Seven months elapsed in the year; the rest of the curve tapers to zero.
  const scale = [420, 280, 190, 96, 74, 58, 22, 34, 46, 62, 38, 88][i] * 1000;
  const monthly = Array.from({ length: 12 }, (_, m) =>
    m > 6 ? 0 : Math.round((scale / 7) * (0.72 + rnd() * 0.56)),
  );
  const collected = monthly.reduce((sum, v) => sum + v, 0);

  return {
    id: `rev-${i + 1}`,
    name,
    icon: REVENUE_ICONS[i],
    collectedYtd: collected,
    target: Math.round(scale * 1.65),
    outstanding: Math.round(collected * (0.12 + rnd() * 0.4)),
    transactions: between(60, 2400),
    monthly,
  };
});

function makeInvoice(index: number): Invoice {
  const total = between(2, 60) * 50;
  const roll = rnd();
  const status: Invoice['status'] = roll > 0.55 ? 'PAID' : roll > 0.3 ? 'UNPAID' : roll > 0.12 ? 'PART_PAID' : 'CANCELLED';
  const paid = status === 'PAID' ? total : status === 'PART_PAID' ? Math.round(total / 2) : 0;
  const age = between(1, 90);

  return {
    id: `inv-${String(index).padStart(3, '0')}`,
    invoiceNumber: `GEA/INV/2026/${String(2000 + index).padStart(6, '0')}`,
    applicationNumber: rnd() > 0.35 ? `ASP-2026-${String(1000 + between(3, 88)).padStart(6, '0')}` : undefined,
    payer: fullName(),
    description: pick([
      'Business Operating Permit', 'Property rate 2026', 'Building permit fee',
      'Food vendor licence', 'Market stall fee', 'Lorry park permit', 'Event permit',
    ]),
    revenueHead: pick(REVENUE_HEAD_NAMES),
    issuedDate: isoDate(age),
    dueDate: isoDate(age - 30),
    total,
    paid,
    status,
  };
}

export const INVOICES: Invoice[] = [
  {
    id: 'inv-001',
    invoiceNumber: 'GEA/INV/2026/002841',
    applicationNumber: 'ASP-2026-001001',
    payer: 'Akosua Mensah',
    description: 'Business Operating Permit renewal — Akosua’s Kitchen',
    revenueHead: 'Business Licences',
    issuedDate: '2026-07-11',
    dueDate: '2026-08-10',
    total: 450,
    paid: 0,
    status: 'UNPAID',
  },
  ...Array.from({ length: 74 }, (_, i) => makeInvoice(i + 2)),
];

function makeReceipt(index: number): Receipt {
  const age = between(0, 60);
  return {
    id: `rct-${String(index).padStart(3, '0')}`,
    receiptNumber: `GEA/RCT/2026/${String(7000 + index).padStart(6, '0')}`,
    invoiceNumber: `GEA/INV/2026/${String(2000 + between(2, 75)).padStart(6, '0')}`,
    payer: fullName(),
    description: pick([
      'Business Operating Permit', 'Property rate 2026', 'Building permit fee',
      'Food vendor licence', 'Market stall fee', 'Lorry park toll', 'Burial permit',
    ]),
    revenueHead: pick(REVENUE_HEAD_NAMES),
    paidDate: isoDate(age),
    amount: between(1, 60) * 50,
    method: pick(['Mobile Money', 'Mobile Money', 'Debit Card', 'Bank Transfer', 'Cash', 'POS', 'QR Code']),
    reference: `${pick(['MM', 'CD', 'BT', 'PS'])}-${between(100000000, 999999999)}`,
    collectedBy: pick(['Comfort Asare', 'Daniel Agyapong', 'Bernard Oduro', 'Online', 'Online', 'Online']),
    reconciled: age > 3,
  };
}

export const RECEIPTS: Receipt[] = [
  {
    id: 'rct-001',
    receiptNumber: 'GEA/RCT/2026/007713',
    invoiceNumber: 'GEA/INV/2026/002590',
    payer: 'Akosua Mensah',
    description: 'Food Vendor Licence — Akosua’s Kitchen',
    revenueHead: 'Environmental Fees',
    paidDate: '2026-07-02',
    amount: 300,
    method: 'Mobile Money',
    reference: 'MM-884213097',
    collectedBy: 'Online',
    reconciled: true,
  },
  ...Array.from({ length: 96 }, (_, i) => makeReceipt(i + 2)),
];

export const REFUNDS: Refund[] = Array.from({ length: 9 }, (_, i) => ({
  id: `ref-${String(i + 1).padStart(3, '0')}`,
  reference: `GEA/RFD/2026/${String(100 + i).padStart(4, '0')}`,
  receiptNumber: `GEA/RCT/2026/${String(7000 + between(2, 90)).padStart(6, '0')}`,
  payer: fullName(),
  reason: pick([
    'Duplicate payment',
    'Application withdrawn before assessment',
    'Overpayment on property rate',
    'Charged the wrong fee grade',
    'Event cancelled — sanitation deposit',
  ]),
  amount: between(1, 20) * 50,
  requestedOn: isoDate(between(2, 60)),
  status: pick<Refund['status']>(['PENDING', 'PENDING', 'APPROVED', 'PAID', 'REJECTED']),
  requestedBy: pick(['Gifty Amankwah', 'Rita Aggrey', 'Comfort Asare']),
}));

// --- Inspections -------------------------------------------------------------

const CHECKLIST = [
  'Sanitation and general cleanliness',
  'Waste storage and disposal',
  'Water supply and hand-washing',
  'Fire safety provisions',
  'Structural condition of premises',
  'Signage and display of permit',
];

function makeInspection(index: number): Inspection {
  const outcome = pick<InspectionOutcomeLocal>(['PENDING', 'PENDING', 'PASSED', 'PASSED', 'PASSED_WITH_CONDITIONS', 'FAILED']);
  const inspector = pick(INSPECTORS);
  const future = outcome === 'PENDING';
  const offset = future ? -between(1, 21) : between(1, 60);

  return {
    id: `ins-${String(index).padStart(3, '0')}`,
    reference: `GEA/INSP/2026/${String(500 + index).padStart(5, '0')}`,
    applicationNumber: `ASP-2026-${String(1000 + between(3, 88)).padStart(6, '0')}`,
    subject: `${pick(BUSINESS_WORDS)} ${pick(BUSINESS_TYPES)}`,
    type: pick(['Environmental health', 'Pre-permit premises', 'Building site', 'Re-inspection', 'Complaint follow-up']),
    premises: `${pick(['Plot', 'Shop', 'House'])} ${between(1, 90)}, ${pick(SUB_METROS)}`,
    subMetro: pick(SUB_METROS),
    scheduledDate: isoDate(offset),
    timeSlot: pick(['08:00 – 10:00', '09:00 – 12:00', '10:00 – 13:00', '13:00 – 16:00', '14:00 – 17:00']),
    inspector: `${inspector.firstName} ${inspector.lastName}`,
    inspectorId: inspector.id,
    outcome,
    completedOn: future ? undefined : isoDate(offset),
    checklist: CHECKLIST.map((item) => ({
      item,
      passed: outcome === 'PENDING' ? false : outcome === 'FAILED' ? rnd() > 0.6 : rnd() > 0.15,
    })),
    findings: future
      ? undefined
      : pick([
          'Premises generally well kept. Minor issues noted below.',
          'Waste bins uncovered at the rear of the premises.',
          'Hand-washing facility present and functioning.',
          'Structure sound; no evidence of unauthorised extension.',
        ]),
    conditions:
      outcome === 'PASSED_WITH_CONDITIONS'
        ? 'Provide covered waste bins and a hand-washing station at the entrance within 30 days.'
        : undefined,
    recommendation: future
      ? undefined
      : outcome === 'FAILED'
        ? 'Do not issue. Re-inspect after remedial work.'
        : 'Recommend issue of the permit.',
    photos: Array.from({ length: between(2, 4) }, (_, p) => ({
      caption: pick(['Front elevation', 'Preparation area', 'Waste storage', 'Wash area', 'Signage', 'Rear access']) + ` ${p + 1}`,
      tint: pick(['tint-blue', 'tint-green', 'tint-gold', 'tint-grey']),
    })),
  };
}

type InspectionOutcomeLocal = Inspection['outcome'];

const ANCHOR_INSPECTION: Inspection = {
  id: 'ins-001',
  reference: 'GEA/INSP/2026/00501',
  applicationNumber: 'ASP-2026-001002',
  subject: 'Akosua’s Kitchen',
  type: 'Environmental health',
  premises: 'Plot 42, Ashongman Estates',
  subMetro: 'Ashongman',
  scheduledDate: '2026-07-29',
  timeSlot: '09:00 – 12:00',
  inspector: 'Ama Serwaa',
  inspectorId: 'stf-005',
  outcome: 'PENDING',
  checklist: CHECKLIST.map((item) => ({ item, passed: false })),
  photos: [],
};

export const INSPECTIONS: Inspection[] = [
  ANCHOR_INSPECTION,
  ...Array.from({ length: 47 }, (_, i) => makeInspection(i + 2)),
];

// --- Documents ---------------------------------------------------------------

export const DOCUMENTS: StoredDocument[] = Array.from({ length: 64 }, (_, i) => {
  const kind = pick<StoredDocument['kind']>([
    'PERMIT', 'PERMIT', 'CERTIFICATE', 'RECEIPT', 'RECEIPT', 'INSPECTION_REPORT', 'ATTACHMENT', 'LETTER',
  ]);
  const names: Record<StoredDocument['kind'], string> = {
    PERMIT: 'Business Operating Permit 2026',
    CERTIFICATE: 'Environmental Health Certificate',
    RECEIPT: 'Payment receipt',
    INSPECTION_REPORT: 'Inspection report',
    ATTACHMENT: 'Application attachment',
    LETTER: 'Approval letter',
  };
  const prefixes: Record<StoredDocument['kind'], string> = {
    PERMIT: 'GEA/BOP/2026/',
    CERTIFICATE: 'GEA/EHC/2026/',
    RECEIPT: 'GEA/RCT/2026/',
    INSPECTION_REPORT: 'GEA/INSP/2026/',
    ATTACHMENT: 'GEA/ATT/2026/',
    LETTER: 'GEA/LTR/2026/',
  };

  return {
    id: `doc-${String(i + 1).padStart(3, '0')}`,
    name: `${names[kind]} — ${pick(BUSINESS_WORDS)} ${pick(BUSINESS_TYPES)}`,
    kind,
    reference: prefixes[kind] + String(between(1000, 9999)).padStart(6, '0'),
    relatedTo: `ASP-2026-${String(1000 + between(3, 88)).padStart(6, '0')}`,
    issuedDate: isoDate(between(1, 180)),
    sizeLabel: `${between(80, 1800)} KB`,
    issuedBy: pick(['Kofi Boateng', 'Ama Serwaa', 'Nana Ofori', 'System', 'Yaw Antwi']),
  };
});

// --- Operations --------------------------------------------------------------

export const TASKS: OfficerTask[] = [
  { id: 'tsk-1', title: 'Review 6 business permit applications', detail: 'Submitted in the last two working days and not yet picked up.', due: '2026-07-25', priority: 'HIGH', status: 'OPEN', link: '/admin/applications' },
  { id: 'tsk-2', title: 'Approve ASP-2026-001001', detail: 'Awaiting settlement of invoice GEA/INV/2026/002841.', due: '2026-07-26', priority: 'NORMAL', status: 'IN_PROGRESS', link: '/admin/applications/app-001' },
  { id: 'tsk-3', title: 'Reconcile Monday’s mobile money collections', detail: '18 receipts totalling GH₵ 12,450 awaiting reconciliation.', due: '2026-07-25', priority: 'URGENT', status: 'OPEN', link: '/admin/payments' },
  { id: 'tsk-4', title: 'Assign inspector for 4 food premises', detail: 'Scheduled for the week of 27 July.', due: '2026-07-27', priority: 'NORMAL', status: 'OPEN', link: '/admin/inspections' },
  { id: 'tsk-5', title: 'Publish the 2026 rate notice announcement', detail: 'Draft prepared by Records, awaiting approval.', due: '2026-07-28', priority: 'LOW', status: 'IN_PROGRESS', link: '/admin/announcements' },
  { id: 'tsk-6', title: 'Deactivate leavers’ accounts', detail: '2 staff left at the end of June.', due: '2026-07-30', priority: 'NORMAL', status: 'OPEN', link: '/admin/users' },
];

export const NOTIFICATIONS: AdminNotification[] = [
  { id: 'ntf-1', title: '6 new applications submitted', body: 'Received through the public portal since yesterday evening.', date: stamp(0, 7, 45), kind: 'APPLICATION', read: false },
  { id: 'ntf-2', title: 'Payment posted — GH₵ 4,500.00', body: 'Fuel filling station permit, Kwabenya. Receipt GEA/RCT/2026/007801.', date: stamp(0, 9, 12), kind: 'PAYMENT', read: false },
  { id: 'ntf-3', title: 'Inspection overdue', body: 'GEA/INSP/2026/00488 was due on 22 July and has not been recorded.', date: stamp(1, 8, 0), kind: 'INSPECTION', read: false },
  { id: 'ntf-4', title: 'New user awaiting activation', body: 'Bernard Oduro was created by Selina Owusu and needs a role assigned.', date: stamp(1, 16, 30), kind: 'USER', read: true },
  { id: 'ntf-5', title: 'Fee schedule updated', body: 'The 2026 fee-fixing resolution was loaded and is now in force.', date: stamp(3, 11, 20), kind: 'SYSTEM', read: true },
  { id: 'ntf-6', title: 'Monthly revenue report ready', body: 'June 2026 collections closed at GH₵ 186,420.', date: stamp(5, 9, 0), kind: 'PAYMENT', read: true },
];

export const MESSAGES: AdminMessage[] = [
  { id: 'msg-1', from: 'Ama Serwaa', role: 'Environmental Health', subject: 'Re: Akosua’s Kitchen inspection', preview: 'I can take the 29 July slot. Please confirm the applicant has been notified.', date: stamp(0, 8, 20), unread: true },
  { id: 'msg-2', from: 'Yaw Antwi', role: 'Finance', subject: 'June reconciliation', preview: 'Two POS batches from Dome market are still unmatched. Can Revenue check the terminal IDs?', date: stamp(1, 15, 40), unread: true },
  { id: 'msg-3', from: 'Emmanuel Adjei-Nyarko', role: 'Coordinating Director', subject: 'Q3 revenue review', preview: 'Please prepare the head-by-head position for Thursday’s management meeting.', date: stamp(2, 10, 5), unread: false },
  { id: 'msg-4', from: 'Nana Ofori', role: 'Physical Planning', subject: 'Zoning query — Taifa', preview: 'The site on ASP-2026-001042 is zoned residential. I have returned the application.', date: stamp(4, 13, 15), unread: false },
];

export const ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann-1',
    title: '2026 property rate notices have been issued',
    body: 'Rate notices for 2026 are now on ratepayers’ accounts. Rates may be settled in full or in instalments, and a receipt is issued immediately on payment. Ratepayers are encouraged to settle before the deadline to avoid the penalty.',
    audience: 'Property owners',
    channel: ['Portal', 'SMS', 'Email'],
    status: 'PUBLISHED',
    publishedOn: '2026-07-01',
    author: 'Esi Danquah',
    views: 4218,
  },
  {
    id: 'ann-2',
    title: 'Food vendor licensing now available online',
    body: 'Food vendors can now apply, book the health inspection and receive the certificate digitally, without visiting the Assembly to file the application.',
    audience: 'Businesses',
    channel: ['Portal', 'SMS'],
    status: 'PUBLISHED',
    publishedOn: '2026-07-15',
    author: 'Ama Serwaa',
    views: 1902,
  },
  {
    id: 'ann-3',
    title: 'Market stall allocation opens at Dome Market',
    body: 'Applications for stalls and stores at Dome Market are open until 30 August 2026. Where demand exceeds available space, applicants join a waiting list visible from their account.',
    audience: 'Traders',
    channel: ['Portal'],
    status: 'PUBLISHED',
    publishedOn: '2026-06-06',
    author: 'Bernard Oduro',
    views: 2764,
  },
  {
    id: 'ann-4',
    title: 'Scheduled maintenance — Sunday 2 August',
    body: 'The portal will be unavailable between 01:00 and 04:00 GMT while scheduled maintenance is carried out. Applications in progress are saved.',
    audience: 'All users',
    channel: ['Portal', 'Email'],
    status: 'DRAFT',
    author: 'Selina Owusu',
    views: 0,
  },
  {
    id: 'ann-5',
    title: 'Beware of unofficial payment requests',
    body: 'Assembly fees are payable only through the portal or at an official revenue desk, and every payment carries an Assembly receipt number. Do not pay fees into a personal account.',
    audience: 'All users',
    channel: ['Portal', 'SMS', 'Email'],
    status: 'PUBLISHED',
    publishedOn: '2026-04-02',
    author: 'Emmanuel Adjei-Nyarko',
    views: 6031,
  },
  {
    id: 'ann-6',
    title: '2025 permit renewal deadline reminder',
    body: 'Renew before 31 March to avoid the late-renewal penalty on your Business Operating Permit.',
    audience: 'Businesses',
    channel: ['SMS'],
    status: 'ARCHIVED',
    publishedOn: '2025-02-10',
    author: 'Kofi Boateng',
    views: 3390,
  },
];

const AUDIT_ACTIONS: { action: string; category: AuditEntry['category']; detail: string }[] = [
  { action: 'User signed in', category: 'AUTH', detail: 'Successful sign-in from the district network.' },
  { action: 'User signed out', category: 'AUTH', detail: 'Session ended by the user.' },
  { action: 'Failed sign-in attempt', category: 'AUTH', detail: 'Incorrect password. Account not locked.' },
  { action: 'Application approved', category: 'APPLICATION', detail: 'Approved after inspection passed and fees settled.' },
  { action: 'Application returned', category: 'APPLICATION', detail: 'Returned to the applicant for a legible document.' },
  { action: 'Application assigned', category: 'APPLICATION', detail: 'Reassigned to another officer in the same department.' },
  { action: 'Payment recorded', category: 'PAYMENT', detail: 'Receipt issued against an outstanding invoice.' },
  { action: 'Invoice cancelled', category: 'PAYMENT', detail: 'Cancelled before payment; replaced by a re-assessment.' },
  { action: 'Refund approved', category: 'PAYMENT', detail: 'Duplicate payment confirmed and refund authorised.' },
  { action: 'Inspection assigned', category: 'INSPECTION', detail: 'Inspector allocated and applicant notified.' },
  { action: 'Inspection outcome recorded', category: 'INSPECTION', detail: 'Checklist completed and photographs attached.' },
  { action: 'User created', category: 'USER', detail: 'New staff account created and role assigned.' },
  { action: 'User deactivated', category: 'USER', detail: 'Account suspended pending clearance.' },
  { action: 'Password reset', category: 'USER', detail: 'Reset link issued to the staff email address.' },
  { action: 'Role updated', category: 'ROLE', detail: 'Permission matrix amended for the role.' },
  { action: 'Fee schedule updated', category: 'SETTINGS', detail: 'Fee-fixing resolution line amended for 2026.' },
  { action: 'Notification template edited', category: 'SETTINGS', detail: 'SMS template wording changed.' },
];

export const AUDIT_LOG: AuditEntry[] = Array.from({ length: 120 }, (_, i) => {
  const entry = pick(AUDIT_ACTIONS);
  const actor = pick(STAFF);
  return {
    id: `aud-${String(i + 1).padStart(4, '0')}`,
    timestamp: stamp(between(0, 30), between(7, 18), between(0, 59)),
    actor: `${actor.firstName} ${actor.lastName}`,
    action: entry.action,
    category: entry.category,
    target: pick([
      `ASP-2026-${String(1000 + between(3, 88)).padStart(6, '0')}`,
      `GEA/INV/2026/${String(2000 + between(2, 75)).padStart(6, '0')}`,
      `GEA/RCT/2026/${String(7000 + between(2, 96)).padStart(6, '0')}`,
      `GEA/INSP/2026/${String(500 + between(2, 48)).padStart(5, '0')}`,
      pick(STAFF).staffNumber,
      'System settings',
    ]),
    detail: entry.detail,
    ipAddress: `10.20.${between(1, 40)}.${between(2, 250)}`,
  };
}).sort((a, b) => b.timestamp.localeCompare(a.timestamp));
