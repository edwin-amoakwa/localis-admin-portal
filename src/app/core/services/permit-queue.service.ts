import { Injectable, computed, inject, signal } from '@angular/core';
import { PermitApplicationRecord, PermitApplicationStatus } from '../models/permit';
import { ApiResponse, ApiService } from './api.service';

export type PermitStatusCounts = Partial<Record<PermitApplicationStatus, number>>;

/**
 * The Business Operating Permit queue on localis-api (/staff/applications).
 * Holds the per-status counts so the sidebar badge and the queue tabs agree.
 */
@Injectable({ providedIn: 'root' })
export class PermitQueueService {
  private readonly api = inject(ApiService);

  private readonly _counts = signal<PermitStatusCounts>({});
  readonly counts = this._counts.asReadonly();

  /** Files waiting on staff: new submissions and Mobile Money payments to confirm. */
  readonly actionable = computed(
    () => (this._counts().SUBMITTED ?? 0) + (this._counts().PAYMENT_CONFIRMATION ?? 0),
  );

  countOf(statuses: PermitApplicationStatus[] | null): number {
    const counts = this._counts();
    if (!statuses) {
      return Object.entries(counts)
        .filter(([status]) => status !== 'DRAFT')
        .reduce((sum, [, count]) => sum + (count ?? 0), 0);
    }
    return statuses.reduce((sum, status) => sum + (counts[status] ?? 0), 0);
  }

  /** Never throws: a failed refresh keeps the last counts. */
  async refreshCounts(): Promise<void> {
    try {
      this._counts.set(await this.api.getData<PermitStatusCounts>('/staff/applications/counts'));
    } catch {
      // Badges are a convenience; the queue page reports its own errors.
    }
  }

  list(statuses: PermitApplicationStatus[] | null): Promise<PermitApplicationRecord[]> {
    const query = statuses?.length ? `?status=${statuses.join(',')}` : '';
    return this.api.getData<PermitApplicationRecord[]>(`/staff/applications${query}`);
  }

  detail(id: string): Promise<PermitApplicationRecord> {
    return this.api.getData<PermitApplicationRecord>(`/staff/applications/${encodeURIComponent(id)}`);
  }

  approveForPayment(
    id: string,
    body: { amount?: number; remarks?: string },
  ): Promise<ApiResponse<PermitApplicationRecord>> {
    return this.api.postAsync<PermitApplicationRecord>(
      `/staff/applications/${encodeURIComponent(id)}/approve-for-payment`,
      body,
    );
  }

  confirmPayment(id: string): Promise<ApiResponse<PermitApplicationRecord>> {
    return this.api.postAsync<PermitApplicationRecord>(
      `/staff/applications/${encodeURIComponent(id)}/confirm-payment`,
      {},
    );
  }

  /** The generated permit as a base64-encoded PDF. */
  permitPdf(id: string): Promise<string> {
    return this.api.getData<string>(`/staff/applications/${encodeURIComponent(id)}/permit`);
  }
}
