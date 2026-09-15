import { Injectable, computed, signal } from '@angular/core';
import {
  ANNOUNCEMENTS,
  APPLICATIONS,
  AUDIT_LOG,
  BUSINESSES,
  CITIZENS,
  DOCUMENTS,
  INSPECTIONS,
  INVOICES,
  MESSAGES,
  NOTIFICATIONS,
  PROPERTIES,
  RECEIPTS,
  REFUNDS,
  REVENUE_HEADS,
  STAFF,
  TASKS,
} from '../data/mock.data';
import {
  ASSEMBLY,
  DEPARTMENTS,
  FEE_SCHEDULE,
  MESSAGE_TEMPLATES,
  PERMISSION_MODULES,
  ROLES,
  SERVICE_CATEGORIES,
  SUB_METROS,
  WORKFLOW_STAGES,
} from '../data/reference.data';
import {
  Announcement,
  Application,
  ApplicationStatus,
  AuditEntry,
  Inspection,
  Invoice,
  ServiceCategoryId,
  StaffUser,
} from '../models';

/**
 * The single source of state for the administration portal.
 *
 * Everything is held in signals seeded from `core/data`. Actions taken on a
 * screen — approving an application, posting a payment, assigning an inspector —
 * update those signals in place, so the change is reflected everywhere at once:
 * the dashboard counters, the queue, the audit log. That is what a real backend
 * would do, and it means swapping to HTTP later is a change to this one file.
 */
@Injectable({ providedIn: 'root' })
export class AdminService {
  // --- Reference data (static) ----------------------------------------------
  readonly assembly = ASSEMBLY;
  readonly departments = DEPARTMENTS;
  readonly roles = ROLES;
  readonly permissionModules = PERMISSION_MODULES;
  readonly serviceCategories = SERVICE_CATEGORIES;
  readonly workflowStages = WORKFLOW_STAGES;
  readonly subMetros = SUB_METROS;
  readonly messageTemplates = MESSAGE_TEMPLATES;

  // --- Mutable state --------------------------------------------------------
  private readonly _applications = signal<Application[]>([...APPLICATIONS]);
  private readonly _invoices = signal([...INVOICES]);
  private readonly _receipts = signal([...RECEIPTS]);
  private readonly _refunds = signal([...REFUNDS]);
  private readonly _inspections = signal<Inspection[]>([...INSPECTIONS]);
  private readonly _staff = signal<StaffUser[]>([...STAFF]);
  private readonly _announcements = signal<Announcement[]>([...ANNOUNCEMENTS]);
  private readonly _notifications = signal([...NOTIFICATIONS]);
  private readonly _messages = signal([...MESSAGES]);
  private readonly _tasks = signal([...TASKS]);
  private readonly _audit = signal<AuditEntry[]>([...AUDIT_LOG]);
  private readonly _feeSchedule = signal([...FEE_SCHEDULE]);

  readonly applications = this._applications.asReadonly();
  readonly invoices = this._invoices.asReadonly();
  readonly receipts = this._receipts.asReadonly();
  readonly refunds = this._refunds.asReadonly();
  readonly inspections = this._inspections.asReadonly();
  readonly staff = this._staff.asReadonly();
  readonly announcements = this._announcements.asReadonly();
  readonly notifications = this._notifications.asReadonly();
  readonly messages = this._messages.asReadonly();
  readonly tasks = this._tasks.asReadonly();
  readonly audit = this._audit.asReadonly();
  readonly feeSchedule = this._feeSchedule.asReadonly();

  readonly businesses = signal([...BUSINESSES]).asReadonly();
  readonly properties = signal([...PROPERTIES]).asReadonly();
  readonly citizens = signal([...CITIZENS]).asReadonly();
  readonly documents = signal([...DOCUMENTS]).asReadonly();
  readonly revenueHeads = signal([...REVENUE_HEADS]).asReadonly();

  // --- Dashboard figures ----------------------------------------------------

  readonly applicationsToday = computed(
    () => this._applications().filter((a) => a.ageDays <= 1).length,
  );

  readonly pendingReviews = computed(
    () =>
      this._applications().filter((a) =>
        (['SUBMITTED', 'UNDER_REVIEW'] as ApplicationStatus[]).includes(a.status),
      ).length,
  );

  readonly approvalsToday = computed(
    () =>
      this._applications().filter(
        (a) => (a.status === 'APPROVED' || a.status === 'ISSUED') && a.ageDays <= 7,
      ).length,
  );

  readonly revenueToday = computed(() =>
    this._receipts()
      .filter((r) => r.paidDate === this.today())
      .reduce((sum, r) => sum + r.amount, 0),
  );

  readonly outstandingRevenue = computed(() =>
    this._invoices()
      .filter((i) => i.status === 'UNPAID' || i.status === 'PART_PAID')
      .reduce((sum, i) => sum + (i.total - i.paid), 0),
  );

  readonly businessesRegistered = computed(() => this.businesses().length);
  readonly propertiesRegistered = computed(() => this.properties().length);

  readonly inspectionsScheduled = computed(
    () => this._inspections().filter((i) => i.outcome === 'PENDING').length,
  );

  readonly unreadNotifications = computed(() => this._notifications().filter((n) => !n.read));
  readonly unreadMessages = computed(() => this._messages().filter((m) => m.unread));
  readonly openTasks = computed(() => this._tasks().filter((t) => t.status !== 'DONE'));

  readonly recentApplications = computed(() =>
    [...this._applications()].sort((a, b) => a.ageDays - b.ageDays).slice(0, 8),
  );

  readonly recentReceipts = computed(() =>
    [...this._receipts()].sort((a, b) => b.paidDate.localeCompare(a.paidDate)).slice(0, 8),
  );

  readonly upcomingInspections = computed(() =>
    this._inspections()
      .filter((i) => i.outcome === 'PENDING')
      .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate))
      .slice(0, 6),
  );

  readonly totalCollected = computed(() =>
    this.revenueHeads().reduce((sum, head) => sum + head.collectedYtd, 0),
  );

  readonly totalTarget = computed(() =>
    this.revenueHeads().reduce((sum, head) => sum + head.target, 0),
  );

  // --- Lookups --------------------------------------------------------------

  applicationById(id: string): Application | undefined {
    return this._applications().find((a) => a.id === id);
  }

  applicationsByCategory(categoryId: ServiceCategoryId): Application[] {
    return this._applications().filter((a) => a.categoryId === categoryId);
  }

  businessById(id: string) {
    return this.businesses().find((b) => b.id === id);
  }

  propertyById(id: string) {
    return this.properties().find((p) => p.id === id);
  }

  inspectionById(id: string) {
    return this._inspections().find((i) => i.id === id);
  }

  invoiceFor(application: Application): Invoice | undefined {
    return this._invoices().find((i) => i.applicationNumber === application.applicationNumber);
  }

  staffById(id: string) {
    return this._staff().find((s) => s.id === id);
  }

  roleById(id: string) {
    return this.roles.find((r) => r.id === id);
  }

  /** Officers who can be assigned work, for the assignment dialog. */
  assignableOfficers(): StaffUser[] {
    return this._staff().filter((s) => s.status === 'ACTIVE' && s.role !== 'CUSTOMER_SERVICE_OFFICER');
  }

  inspectors(): StaffUser[] {
    return this._staff().filter(
      (s) => s.status === 'ACTIVE' && (s.role === 'INSPECTOR' || s.role === 'ENVIRONMENTAL_HEALTH_OFFICER'),
    );
  }

  // --- Commands -------------------------------------------------------------

  /**
   * Every status change goes through here, so the audit trail is written
   * exactly once per move and nothing changes without a record of who did it.
   */
  transition(
    application: Application,
    status: ApplicationStatus,
    actor: string,
    title: string,
    detail?: string,
  ): void {
    this._applications.update((list) =>
      list.map((a) =>
        a.id === application.id
          ? {
              ...a,
              status,
              timeline: [...a.timeline, { date: this.stamp(), status, title, detail, actor }],
            }
          : a,
      ),
    );

    this.recordAudit(actor, title, 'APPLICATION', application.applicationNumber, detail ?? title);
  }

  approveApplication(application: Application, actor: string): void {
    this.transition(application, 'APPROVED', actor, 'Application approved',
      'Approved at the final stage. The permit may now be generated.');
  }

  rejectApplication(application: Application, actor: string, reason: string): void {
    this.transition(application, 'REJECTED', actor, 'Application rejected', reason);
  }

  returnApplication(application: Application, actor: string, reason: string): void {
    this.transition(application, 'RETURNED', actor, 'Returned for correction', reason);
  }

  assignOfficer(application: Application, officer: StaffUser, actor: string): void {
    const name = `${officer.firstName} ${officer.lastName}`;

    this._applications.update((list) =>
      list.map((a) =>
        a.id === application.id
          ? {
              ...a,
              officer: name,
              officerId: officer.id,
              status: a.status === 'SUBMITTED' ? 'UNDER_REVIEW' : a.status,
              timeline: [
                ...a.timeline,
                {
                  date: this.stamp(),
                  status: 'NOTE' as const,
                  title: `Assigned to ${name}`,
                  detail: `${officer.designation}, ${officer.department}.`,
                  actor,
                },
              ],
            }
          : a,
      ),
    );

    this.recordAudit(actor, 'Application assigned', 'APPLICATION', application.applicationNumber,
      `Assigned to ${name}.`);
  }

  /** Books an inspection and moves the application to match. */
  scheduleInspection(
    application: Application,
    inspector: StaffUser,
    date: string,
    timeSlot: string,
    actor: string,
  ): Inspection {
    const name = `${inspector.firstName} ${inspector.lastName}`;
    const inspection: Inspection = {
      id: `ins-${Math.random().toString(36).slice(2, 8)}`,
      reference: `GEA/INSP/2026/${String(600 + this._inspections().length).padStart(5, '0')}`,
      applicationNumber: application.applicationNumber,
      subject: application.subject,
      type: 'Pre-permit premises',
      premises: `${application.subMetro}`,
      subMetro: application.subMetro,
      scheduledDate: date,
      timeSlot,
      inspector: name,
      inspectorId: inspector.id,
      outcome: 'PENDING',
      checklist: [
        { item: 'Sanitation and general cleanliness', passed: false },
        { item: 'Waste storage and disposal', passed: false },
        { item: 'Water supply and hand-washing', passed: false },
        { item: 'Fire safety provisions', passed: false },
        { item: 'Structural condition of premises', passed: false },
        { item: 'Signage and display of permit', passed: false },
      ],
      photos: [],
    };

    this._inspections.update((list) => [inspection, ...list]);

    this.transition(application, 'INSPECTION_SCHEDULED', actor,
      `Inspection scheduled for ${date}`, `Inspector: ${name}, ${timeSlot}.`);

    return inspection;
  }

  /** Issues the permit and closes the application. */
  generatePermit(application: Application, actor: string): string {
    const permitNumber = `GEA/BOP/2026/${String(400 + this._applications().length).padStart(6, '0')}`;

    this.transition(application, 'ISSUED', actor, 'Permit issued',
      `Permit ${permitNumber} issued and released to the applicant.`);

    return permitNumber;
  }

  /** Posts a payment against an invoice and recomputes its position. */
  postPayment(invoice: Invoice, amount: number, method: string, actor: string): string {
    const receiptNumber = `GEA/RCT/2026/${String(7100 + this._receipts().length).padStart(6, '0')}`;
    const paid = invoice.paid + amount;

    this._receipts.update((list) => [
      {
        id: `rct-${Math.random().toString(36).slice(2, 8)}`,
        receiptNumber,
        invoiceNumber: invoice.invoiceNumber,
        payer: invoice.payer,
        description: invoice.description,
        revenueHead: invoice.revenueHead,
        paidDate: this.today(),
        amount,
        method,
        reference: `MN-${Math.floor(100000000 + Math.random() * 899999999)}`,
        collectedBy: actor,
        reconciled: false,
      },
      ...list,
    ]);

    this._invoices.update((list) =>
      list.map((i) =>
        i.id === invoice.id
          ? { ...i, paid, status: paid >= i.total ? ('PAID' as const) : ('PART_PAID' as const) }
          : i,
      ),
    );

    this.recordAudit(actor, 'Payment recorded', 'PAYMENT', receiptNumber,
      `GH₵ ${amount.toFixed(2)} received against ${invoice.invoiceNumber} by ${method}.`);

    return receiptNumber;
  }

  reconcileReceipts(ids: string[], actor: string): void {
    this._receipts.update((list) =>
      list.map((r) => (ids.includes(r.id) ? { ...r, reconciled: true } : r)),
    );

    this.recordAudit(actor, 'Receipts reconciled', 'PAYMENT', `${ids.length} receipts`,
      `${ids.length} receipt(s) marked as reconciled against the bank statement.`);
  }

  setRefundStatus(id: string, status: 'APPROVED' | 'REJECTED' | 'PAID', actor: string): void {
    this._refunds.update((list) => list.map((r) => (r.id === id ? { ...r, status } : r)));
    const refund = this._refunds().find((r) => r.id === id);

    this.recordAudit(actor, `Refund ${status.toLowerCase()}`, 'PAYMENT', refund?.reference ?? id,
      `Refund of GH₵ ${refund?.amount.toFixed(2)} ${status.toLowerCase()}.`);
  }

  /** Records the outcome of an inspection against its checklist. */
  recordInspection(
    inspection: Inspection,
    outcome: Inspection['outcome'],
    findings: string,
    actor: string,
  ): void {
    this._inspections.update((list) =>
      list.map((i) =>
        i.id === inspection.id
          ? { ...i, outcome, findings, completedOn: this.today(),
              recommendation: outcome === 'FAILED'
                ? 'Do not issue. Re-inspect after remedial work.'
                : 'Recommend issue of the permit.' }
          : i,
      ),
    );

    this.recordAudit(actor, 'Inspection outcome recorded', 'INSPECTION', inspection.reference,
      `Outcome: ${outcome.replace(/_/g, ' ').toLowerCase()}.`);
  }

  assignInspector(inspection: Inspection, inspector: StaffUser, actor: string): void {
    const name = `${inspector.firstName} ${inspector.lastName}`;

    this._inspections.update((list) =>
      list.map((i) => (i.id === inspection.id ? { ...i, inspector: name, inspectorId: inspector.id } : i)),
    );

    this.recordAudit(actor, 'Inspection assigned', 'INSPECTION', inspection.reference,
      `Assigned to ${name}.`);
  }

  // --- Users ----------------------------------------------------------------

  createStaff(user: Omit<StaffUser, 'id' | 'staffNumber' | 'initials' | 'lastLogin' | 'createdOn'>, actor: string): StaffUser {
    const created: StaffUser = {
      ...user,
      id: `stf-${Math.random().toString(36).slice(2, 8)}`,
      staffNumber: `GEA/STF/${String(1300 + this._staff().length).padStart(4, '0')}`,
      initials: (user.firstName.charAt(0) + user.lastName.charAt(0)).toUpperCase(),
      lastLogin: '—',
      createdOn: this.today(),
    };

    this._staff.update((list) => [created, ...list]);
    this.recordAudit(actor, 'User created', 'USER', created.staffNumber,
      `${created.firstName} ${created.lastName} created with the ${created.role} role.`);

    return created;
  }

  setStaffStatus(id: string, status: StaffUser['status'], actor: string): void {
    this._staff.update((list) => list.map((s) => (s.id === id ? { ...s, status } : s)));
    const staff = this.staffById(id);

    this.recordAudit(actor, status === 'ACTIVE' ? 'User reactivated' : 'User deactivated', 'USER',
      staff?.staffNumber ?? id, `${staff?.firstName} ${staff?.lastName} set to ${status.toLowerCase()}.`);
  }

  resetStaffPassword(id: string, actor: string): void {
    const staff = this.staffById(id);
    this.recordAudit(actor, 'Password reset', 'USER', staff?.staffNumber ?? id,
      `Reset link issued to ${staff?.email}.`);
  }

  // --- Announcements --------------------------------------------------------

  saveAnnouncement(announcement: Announcement): void {
    this._announcements.update((list) => {
      const exists = list.some((a) => a.id === announcement.id);
      return exists ? list.map((a) => (a.id === announcement.id ? announcement : a)) : [announcement, ...list];
    });
  }

  setAnnouncementStatus(id: string, status: Announcement['status'], actor: string): void {
    this._announcements.update((list) =>
      list.map((a) =>
        a.id === id
          ? { ...a, status, publishedOn: status === 'PUBLISHED' ? this.today() : a.publishedOn }
          : a,
      ),
    );

    const announcement = this._announcements().find((a) => a.id === id);
    this.recordAudit(actor, `Announcement ${status.toLowerCase()}`, 'SETTINGS',
      announcement?.title ?? id, `Status changed to ${status.toLowerCase()}.`);
  }

  // --- Notifications, messages, tasks ---------------------------------------

  markAllNotificationsRead(): void {
    this._notifications.update((list) => list.map((n) => ({ ...n, read: true })));
  }

  markAllMessagesRead(): void {
    this._messages.update((list) => list.map((m) => ({ ...m, unread: false })));
  }

  setTaskStatus(id: string, status: 'OPEN' | 'IN_PROGRESS' | 'DONE'): void {
    this._tasks.update((list) => list.map((t) => (t.id === id ? { ...t, status } : t)));
  }

  // --- Settings -------------------------------------------------------------

  saveFeeLine(line: (typeof FEE_SCHEDULE)[number], actor: string): void {
    this._feeSchedule.update((list) => {
      const exists = list.some((f) => f.id === line.id);
      return exists ? list.map((f) => (f.id === line.id ? line : f)) : [line, ...list];
    });

    this.recordAudit(actor, 'Fee schedule updated', 'SETTINGS', `${line.category} · ${line.grade}`,
      `${line.year} permit fee set to GH₵ ${line.permitFee.toFixed(2)}.`);
  }

  // --- Audit ----------------------------------------------------------------

  recordAudit(
    actor: string,
    action: string,
    category: AuditEntry['category'],
    target: string,
    detail: string,
  ): void {
    this._audit.update((list) => [
      {
        id: `aud-${Math.random().toString(36).slice(2, 8)}`,
        timestamp: this.stamp(),
        actor,
        action,
        category,
        target,
        detail,
        ipAddress: '10.20.1.14',
      },
      ...list,
    ]);
  }

  // --- Helpers --------------------------------------------------------------

  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private stamp(): string {
    const now = new Date();
    return `${this.today()} ${now.toTimeString().slice(0, 5)}`;
  }
}
