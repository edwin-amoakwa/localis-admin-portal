import { Injectable, effect, signal } from '@angular/core';
import { ApplicationStatus, InvoiceStatus, Priority } from '../models';
import { readJson, writeJson } from './storage';

const PREF_KEY = 'asp.admin.preferences';

export interface UiPreferences {
  darkMode: boolean;
  compactTables: boolean;
  sidebarCollapsed: boolean;
}

const DEFAULTS: UiPreferences = {
  darkMode: false,
  compactTables: false,
  sidebarCollapsed: false,
};

/** Theme and layout preferences, plus the shared status display maps. */
@Injectable({ providedIn: 'root' })
export class UiService {
  private readonly _prefs = signal<UiPreferences>(this.restore());
  readonly prefs = this._prefs.asReadonly();

  /** Off-canvas sidebar state on small screens. */
  readonly mobileMenuOpen = signal(false);

  constructor() {
    // Applying preferences as an effect keeps <html> in step with the signal,
    // including on first load.
    effect(() => {
      const prefs = this._prefs();
      document.documentElement.classList.toggle('app-dark', prefs.darkMode);
      writeJson(PREF_KEY, prefs);
    });
  }

  update(changes: Partial<UiPreferences>): void {
    this._prefs.update((prefs) => ({ ...prefs, ...changes }));
  }

  toggleDarkMode(): void {
    this.update({ darkMode: !this._prefs().darkMode });
  }

  toggleSidebar(): void {
    this.update({ sidebarCollapsed: !this._prefs().sidebarCollapsed });
  }

  private restore(): UiPreferences {
    const stored = readJson<Partial<UiPreferences>>(PREF_KEY);
    return stored ? { ...DEFAULTS, ...stored } : DEFAULTS;
  }
}

// --- Shared display maps ------------------------------------------------------
// Kept in one place so status wording and colour never drift between the queue,
// the detail screen and the dashboard.

/** PrimeNG severity union, shared by Tag, Message and Badge. */
export type Severity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast';

export const APPLICATION_STATUS_LABEL: Record<ApplicationStatus, string> = {
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under Review',
  RETURNED: 'Returned',
  AWAITING_PAYMENT: 'Awaiting Payment',
  INSPECTION_SCHEDULED: 'Inspection Scheduled',
  INSPECTION_PASSED: 'Inspection Passed',
  INSPECTION_FAILED: 'Inspection Failed',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  ISSUED: 'Issued',
};

export const APPLICATION_STATUS_SEVERITY: Record<ApplicationStatus, Severity> = {
  SUBMITTED: 'info',
  UNDER_REVIEW: 'info',
  RETURNED: 'warn',
  AWAITING_PAYMENT: 'warn',
  INSPECTION_SCHEDULED: 'warn',
  INSPECTION_PASSED: 'success',
  INSPECTION_FAILED: 'danger',
  APPROVED: 'success',
  REJECTED: 'danger',
  ISSUED: 'success',
};

export const PRIORITY_SEVERITY: Record<Priority, Severity> = {
  LOW: 'secondary',
  NORMAL: 'info',
  HIGH: 'warn',
  URGENT: 'danger',
};

export const PRIORITY_LABEL: Record<Priority, string> = {
  LOW: 'Low',
  NORMAL: 'Normal',
  HIGH: 'High',
  URGENT: 'Urgent',
};

export const INVOICE_STATUS_LABEL: Record<InvoiceStatus, string> = {
  UNPAID: 'Unpaid',
  PART_PAID: 'Part Paid',
  PAID: 'Paid',
  CANCELLED: 'Cancelled',
};

export const INVOICE_STATUS_SEVERITY: Record<InvoiceStatus, Severity> = {
  UNPAID: 'danger',
  PART_PAID: 'warn',
  PAID: 'success',
  CANCELLED: 'secondary',
};
