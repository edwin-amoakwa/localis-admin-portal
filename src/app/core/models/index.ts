/**
 * Domain types for the ASP Administration Portal.
 *
 * UI-only build: every one of these is populated from `core/data`. The shapes
 * are written the way a real API would return them, so swapping the mock
 * services for HTTP later is a service-layer change, not a rewrite.
 */

// --- Staff, roles and access -------------------------------------------------

export type RoleId =
  | 'SYSTEM_ADMINISTRATOR'
  | 'DISTRICT_ADMINISTRATOR'
  | 'FINANCE_OFFICER'
  | 'REVENUE_OFFICER'
  | 'BUSINESS_LICENSING_OFFICER'
  | 'PHYSICAL_PLANNING_OFFICER'
  | 'ENVIRONMENTAL_HEALTH_OFFICER'
  | 'INSPECTOR'
  | 'RECORDS_OFFICER'
  | 'CUSTOMER_SERVICE_OFFICER';

export interface Role {
  id: RoleId;
  name: string;
  description: string;
  userCount: number;
  /** Module id -> the actions this role may take within it. */
  permissions: Record<string, PermissionLevel[]>;
}

export type PermissionLevel = 'VIEW' | 'CREATE' | 'EDIT' | 'APPROVE' | 'DELETE';

export interface PermissionModule {
  id: string;
  name: string;
  group: string;
}

export interface StaffUser {
  id: string;
  staffNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: RoleId;
  department: string;
  designation: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING';
  lastLogin: string;
  createdOn: string;
  initials: string;
}

export interface Department {
  id: string;
  name: string;
  head: string;
  staffCount: number;
  services: string[];
}

// --- Applications ------------------------------------------------------------

export type ServiceCategoryId =
  | 'business'
  | 'property'
  | 'building'
  | 'environmental'
  | 'market'
  | 'transport'
  | 'community';

export type ApplicationStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'RETURNED'
  | 'AWAITING_PAYMENT'
  | 'INSPECTION_SCHEDULED'
  | 'INSPECTION_PASSED'
  | 'INSPECTION_FAILED'
  | 'APPROVED'
  | 'REJECTED'
  | 'ISSUED';

export type Priority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export interface ApplicationEvent {
  date: string;
  status: ApplicationStatus | 'NOTE';
  title: string;
  detail?: string;
  actor: string;
}

export interface AttachedDocument {
  name: string;
  type: string;
  size: string;
  uploadedOn: string;
  verified: boolean;
}

export interface Application {
  id: string;
  applicationNumber: string;
  applicant: string;
  applicantPhone: string;
  applicantEmail: string;
  ghanaCardNo: string;
  subject: string;
  serviceId: string;
  serviceName: string;
  categoryId: ServiceCategoryId;
  district: string;
  subMetro: string;
  status: ApplicationStatus;
  officer: string;
  officerId: string | null;
  priority: Priority;
  submittedDate: string;
  ageDays: number;
  assessedAmount: number;
  amountPaid: number;
  documents: AttachedDocument[];
  timeline: ApplicationEvent[];
  officerNotes: string;
  inspectionId?: string;
  businessId?: string;
  propertyId?: string;
}

// --- Registries --------------------------------------------------------------

export interface BusinessRecord {
  id: string;
  businessNumber: string;
  businessName: string;
  owner: string;
  ownerPhone: string;
  category: string;
  grade: string;
  ownershipType: string;
  registrationNo: string;
  tinNo: string;
  location: string;
  subMetro: string;
  digitalAddress: string;
  employees: number;
  registeredOn: string;
  status: 'ACTIVE' | 'DORMANT' | 'CLOSED';
  permitStatus: 'VALID' | 'EXPIRED' | 'PENDING';
  currentPermitNo?: string;
  permitExpiry?: string;
  outstanding: number;
  compliance: number;
  permits: PermitRecord[];
  paymentHistory: PaymentSummary[];
  complianceLog: ComplianceEntry[];
}

export interface PermitRecord {
  permitNumber: string;
  year: number;
  issuedOn: string;
  expiresOn: string;
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
  amount: number;
}

export interface PaymentSummary {
  date: string;
  reference: string;
  description: string;
  amount: number;
  method: string;
}

export interface ComplianceEntry {
  date: string;
  event: string;
  outcome: 'PASSED' | 'FAILED' | 'NOTICE' | 'RESOLVED';
  officer: string;
  note?: string;
}

export interface PropertyRecord {
  id: string;
  propertyNumber: string;
  owner: string;
  ownerPhone: string;
  description: string;
  use: 'Residential' | 'Commercial' | 'Industrial' | 'Mixed use';
  location: string;
  subMetro: string;
  digitalAddress: string;
  latitude: number;
  longitude: number;
  rateableValue: number;
  currentRate: number;
  outstanding: number;
  lastValuation: string;
  status: 'RATED' | 'UNRATED' | 'EXEMPT';
  rateHistory: RateEntry[];
}

export interface RateEntry {
  year: number;
  charged: number;
  paid: number;
  balance: number;
}

export interface Citizen {
  id: string;
  name: string;
  ghanaCardNo: string;
  phone: string;
  email: string;
  accountType: string;
  subMetro: string;
  registeredOn: string;
  applications: number;
  status: 'ACTIVE' | 'SUSPENDED';
}

// --- Money -------------------------------------------------------------------

export type InvoiceStatus = 'UNPAID' | 'PART_PAID' | 'PAID' | 'CANCELLED';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  applicationNumber?: string;
  payer: string;
  description: string;
  revenueHead: string;
  issuedDate: string;
  dueDate: string;
  total: number;
  paid: number;
  status: InvoiceStatus;
}

export interface Receipt {
  id: string;
  receiptNumber: string;
  invoiceNumber: string;
  payer: string;
  description: string;
  revenueHead: string;
  paidDate: string;
  amount: number;
  method: string;
  reference: string;
  collectedBy: string;
  reconciled: boolean;
}

export interface Refund {
  id: string;
  reference: string;
  receiptNumber: string;
  payer: string;
  reason: string;
  amount: number;
  requestedOn: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID';
  requestedBy: string;
}

export interface RevenueHead {
  id: string;
  name: string;
  icon: string;
  collectedYtd: number;
  target: number;
  outstanding: number;
  transactions: number;
  /** Twelve monthly figures, January first. */
  monthly: number[];
}

// --- Inspections -------------------------------------------------------------

export type InspectionOutcome = 'PENDING' | 'PASSED' | 'PASSED_WITH_CONDITIONS' | 'FAILED';

export interface InspectionPhoto {
  caption: string;
  tint: string;
}

export interface Inspection {
  id: string;
  reference: string;
  applicationNumber: string;
  subject: string;
  type: string;
  premises: string;
  subMetro: string;
  scheduledDate: string;
  timeSlot: string;
  inspector: string;
  inspectorId: string;
  outcome: InspectionOutcome;
  completedOn?: string;
  checklist: { item: string; passed: boolean }[];
  findings?: string;
  conditions?: string;
  recommendation?: string;
  photos: InspectionPhoto[];
}

// --- Documents ---------------------------------------------------------------

export type DocumentKind =
  | 'PERMIT'
  | 'CERTIFICATE'
  | 'RECEIPT'
  | 'INSPECTION_REPORT'
  | 'ATTACHMENT'
  | 'LETTER';

export interface StoredDocument {
  id: string;
  name: string;
  kind: DocumentKind;
  reference: string;
  relatedTo: string;
  issuedDate: string;
  sizeLabel: string;
  issuedBy: string;
}

// --- Operations --------------------------------------------------------------

export interface OfficerTask {
  id: string;
  title: string;
  detail: string;
  due: string;
  priority: Priority;
  status: 'OPEN' | 'IN_PROGRESS' | 'DONE';
  link?: string;
}

export interface AdminNotification {
  id: string;
  title: string;
  body: string;
  date: string;
  kind: 'APPLICATION' | 'PAYMENT' | 'INSPECTION' | 'SYSTEM' | 'USER';
  read: boolean;
}

export interface AdminMessage {
  id: string;
  from: string;
  role: string;
  subject: string;
  preview: string;
  date: string;
  unread: boolean;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  audience: string;
  channel: string[];
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  publishedOn?: string;
  author: string;
  views: number;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  category: 'AUTH' | 'APPLICATION' | 'PAYMENT' | 'INSPECTION' | 'USER' | 'ROLE' | 'SETTINGS';
  target: string;
  detail: string;
  ipAddress: string;
}

// --- Settings ----------------------------------------------------------------

export interface FeeScheduleLine {
  id: string;
  category: string;
  grade: string;
  year: number;
  permitFee: number;
  registrationFee: number;
  inspectionFee: number;
  penalty: number;
  active: boolean;
}

export interface ServiceCategory {
  id: ServiceCategoryId;
  name: string;
  description: string;
  icon: string;
  tint: 'blue' | 'green' | 'gold';
  department: string;
  serviceCount: number;
}

export interface MessageTemplate {
  id: string;
  name: string;
  channel: 'EMAIL' | 'SMS';
  trigger: string;
  subject?: string;
  body: string;
  active: boolean;
}

export interface WorkflowStage {
  id: string;
  name: string;
  description: string;
  owner: string;
  slaDays: number;
  icon: string;
  /** How many applications are sitting at this stage right now. */
  count: number;
  automatic: boolean;
}

export interface AssemblyProfile {
  name: string;
  code: string;
  type: string;
  region: string;
  capital: string;
  postalAddress: string;
  physicalAddress: string;
  phone: string;
  email: string;
  website: string;
  coordinatingDirector: string;
  bankName: string;
  bankAccount: string;
  momoNumber: string;
  permitPrefix: string;
  inspectionRequired: boolean;
  paymentBeforeIssue: boolean;
}
