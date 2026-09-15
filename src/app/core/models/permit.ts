/** Mirrors localis-api's PermitApplicationDto. Dates are ISO strings; Gson omits null fields. */

export type PermitApplicationStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'RETURNED'
  | 'INSPECTION_SCHEDULED'
  | 'INSPECTION_PASSED'
  | 'INSPECTION_FAILED'
  | 'AWAITING_PAYMENT'
  | 'PAYMENT_CONFIRMATION'
  | 'APPROVED'
  | 'ISSUED'
  | 'REJECTED'
  | 'CANCELLED';

export interface PermitAssembly {
  id: string;
  assemblyName: string;
  assemblyCode: string;
  assemblyTypeLabel?: string;
  regionName?: string;
  capital?: string;
  postalAddress?: string;
  physicalAddress?: string;
  contactNo?: string;
  emailAddress?: string;
  website?: string;
  coordinatingDirector?: string;
  logoDataUri?: string;
}

export interface PermitBusiness {
  id: string;
  businessName: string;
  businessNumber?: string;
  categoryId?: string;
  categoryName?: string;
  ownershipType?: string;
  ownershipTypeLabel?: string;
  businessGradeLabel?: string;
  registrationNo?: string;
  tinNo?: string;
  natureOfBusiness?: string;
  coreBusinessDescription?: string;
  yearsInOperation: number;
  monthsInOperation: number;
  regionalPresence: string[];
  streetName?: string;
  postalAddress?: string;
  digitalAddress?: string;
  website?: string;
  contactNo?: string;
  emailAddress?: string;
  noOfEmployees: number;
  registered: boolean;
}

export interface PermitApplicant {
  id: string;
  fullname: string;
  phoneNo: string;
  emailAddress?: string;
  ghanaCardNo?: string;
}

export interface PermitInvoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string;
  totalAmount: number;
  amountPaid: number;
  status: string;
  statusLabel: string;
  narration?: string;
  items: { itemName: string; amount: number }[];
}

export interface PermitPayment {
  receiptNumber: string;
  paymentDate: string;
  amount: number;
  paymentModeLabel?: string;
  paymentReference?: string;
  payerName?: string;
  payerPhoneNo?: string;
  confirmed: boolean;
}

export interface PermitEvent {
  eventDate: string;
  fromStatus?: PermitApplicationStatus;
  toStatus?: PermitApplicationStatus;
  toStatusLabel?: string;
  actionedByName?: string;
  remarks?: string;
}

export interface IssuedPermit {
  id: string;
  permitNumber: string;
  permitYear: number;
  issueDate: string;
  expiryDate: string;
  statusLabel?: string;
  verificationCode: string;
  conditions?: string;
  issuedByName?: string;
  issuedByDesignation?: string;
}

export interface PermitApplicationRecord {
  id: string;
  applicationNumber: string;
  applicationType: string;
  applicationTypeLabel: string;
  status: PermitApplicationStatus;
  statusLabel: string;
  permitYear: number;
  submittedDate?: string;
  createdDate?: string;
  assessedAmount: number;
  amountPaid: number;
  outstandingAmount: number;
  reviewRemarks?: string;
  assembly: PermitAssembly;
  business: PermitBusiness;
  applicant?: PermitApplicant;
  invoice?: PermitInvoice;
  payments?: PermitPayment[];
  trail?: PermitEvent[];
  permit?: IssuedPermit;
  /** Staff only. */
  suggestedFee?: number;
}

export type TagSeverity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast';

export function permitStatusSeverity(status: PermitApplicationStatus): TagSeverity {
  switch (status) {
    case 'ISSUED':
    case 'APPROVED':
      return 'success';
    case 'AWAITING_PAYMENT':
      return 'warn';
    case 'PAYMENT_CONFIRMATION':
      return 'contrast';
    case 'REJECTED':
    case 'CANCELLED':
    case 'INSPECTION_FAILED':
      return 'danger';
    case 'DRAFT':
      return 'secondary';
    default:
      return 'info';
  }
}
