import { Component, OnDestroy, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { TimelineModule } from 'primeng/timeline';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { ConfirmationService, MenuItem } from 'primeng/api';
import {
  PermitApplicationRecord,
  PermitApplicationStatus,
  PermitEvent,
  permitStatusSeverity,
} from '../../../core/models/permit';
import { PermitQueueService } from '../../../core/services/permit-queue.service';
import { ToastService } from '../../../core/services/toast.service';
import { ReportData } from '../../../core/report-data';
import { ReportViewer } from '../../../shared/report-viewer/report-viewer';

const REVIEWABLE: PermitApplicationStatus[] = ['SUBMITTED', 'UNDER_REVIEW', 'INSPECTION_PASSED'];

/** One Business Operating Permit application and the action its status calls for. */
@Component({
  selector: 'app-permit-detail',
  imports: [
    FormsModule,
    RouterLink,
    CurrencyPipe,
    DatePipe,
    ButtonModule,
    TagModule,
    DialogModule,
    InputNumberModule,
    TextareaModule,
    TimelineModule,
    BreadcrumbModule,
    ReportViewer,
  ],
  templateUrl: './permit-detail.html',
  styleUrls: ['../../shared-page.scss', './permit-detail.scss'],
})
export class PermitDetailPage implements OnDestroy {
  private readonly queue = inject(PermitQueueService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmationService);

  /** Bound from the :id route parameter. */
  readonly id = input.required<string>();

  protected readonly application = signal<PermitApplicationRecord | null>(null);
  protected readonly loading = signal(true);
  protected readonly failed = signal(false);
  protected readonly working = signal(false);
  protected readonly loadingPermit = signal(false);

  protected readonly reportData = new ReportData();
  protected readonly reportVisible = signal(false);

  // --- Approve for payment dialog --------------------------------------------
  protected readonly approveOpen = signal(false);
  protected readonly approveAmount = signal<number | null>(null);
  protected readonly approveRemarks = signal('');
  protected readonly approveTouched = signal(false);

  protected readonly severity = permitStatusSeverity;
  protected readonly home: MenuItem = { icon: 'pi pi-home', routerLink: '/admin/dashboard' };

  protected readonly crumbs = computed<MenuItem[]>(() => [
    { label: 'Applications', routerLink: '/admin/applications' },
    { label: this.application()?.applicationNumber ?? 'Application' },
  ]);

  protected readonly status = computed(() => this.application()?.status);
  protected readonly isReviewable = computed(() => {
    const status = this.status();
    return !!status && REVIEWABLE.includes(status);
  });

  /** Latest unconfirmed payment, else the latest payment. */
  protected readonly pendingPayment = computed(() => {
    const payments = this.application()?.payments ?? [];
    return [...payments].reverse().find((p) => !p.confirmed) ?? payments[payments.length - 1];
  });

  protected readonly amountRequired = computed(() => this.application()?.suggestedFee == null);
  protected readonly amountInvalid = computed(() => {
    const amount = this.approveAmount();
    return this.amountRequired() ? amount == null || amount <= 0 : amount != null && amount <= 0;
  });

  constructor() {
    effect(() => {
      const id = this.id();
      untracked(() => this.load(id));
    });
  }

  ngOnDestroy(): void {
    this.reportData.release();
  }

  protected async load(id = this.id(), quiet = false): Promise<void> {
    if (!quiet) {
      this.loading.set(true);
    }
    this.failed.set(false);
    try {
      this.application.set(await this.queue.detail(id));
    } catch (error) {
      if (!quiet) {
        this.application.set(null);
        this.failed.set(true);
      }
      this.toast.error('Could not load the application', error);
    } finally {
      this.loading.set(false);
    }
  }

  // --- Approve for payment ---------------------------------------------------
  protected openApprove(): void {
    const app = this.application();
    this.approveAmount.set(app?.suggestedFee ?? null);
    this.approveRemarks.set('');
    this.approveTouched.set(false);
    this.approveOpen.set(true);
  }

  protected async submitApprove(): Promise<void> {
    const app = this.application();
    this.approveTouched.set(true);
    if (!app || this.amountInvalid()) {
      return;
    }

    const amount = this.approveAmount();
    const remarks = this.approveRemarks().trim();
    const body: { amount?: number; remarks?: string } = {};
    if (amount != null) {
      body.amount = amount;
    }
    if (remarks) {
      body.remarks = remarks;
    }

    this.working.set(true);
    try {
      const response = await this.queue.approveForPayment(app.id, body);
      this.approveOpen.set(false);
      this.toast.success('Approved for payment', response.message);
      this.afterAction(response.data);
    } catch (error) {
      this.toast.error('Could not approve the application', error);
    } finally {
      this.working.set(false);
    }
  }

  // --- Confirm payment ---------------------------------------------------------
  protected confirmPayment(): void {
    const app = this.application();
    if (!app) {
      return;
    }
    const payment = this.pendingPayment();
    const paid = payment?.amount ?? app.amountPaid;

    this.confirm.confirm({
      header: 'Confirm payment',
      icon: 'pi pi-wallet',
      message:
        `Confirm that GHS ${paid.toFixed(2)} has been received for ${app.business.businessName}` +
        `${payment?.receiptNumber ? ` (receipt ${payment.receiptNumber})` : ''}? ` +
        'The Business Operating Permit will be generated.',
      acceptLabel: 'Confirm payment',
      rejectLabel: 'Cancel',
      rejectButtonProps: { severity: 'secondary', outlined: true },
      accept: () => this.doConfirmPayment(app.id),
    });
  }

  private async doConfirmPayment(id: string): Promise<void> {
    this.working.set(true);
    try {
      const response = await this.queue.confirmPayment(id);
      this.toast.success('Payment confirmed', response.message);
      this.afterAction(response.data);
    } catch (error) {
      this.toast.error('Could not confirm the payment', error);
    } finally {
      this.working.set(false);
    }
  }

  private afterAction(updated: PermitApplicationRecord | undefined): void {
    if (updated) {
      this.application.set(updated);
    } else {
      this.load(this.id(), true);
    }
    this.queue.refreshCounts();
  }

  // --- Permit PDF ------------------------------------------------------------
  protected async viewPermit(): Promise<void> {
    const app = this.application();
    if (!app) {
      return;
    }
    this.loadingPermit.set(true);
    try {
      const pdf = await this.queue.permitPdf(app.id);
      this.reportData.showPdfReport(
        'Business Operating Permit ' + (app.permit?.permitNumber ?? app.applicationNumber),
        pdf,
      );
      this.reportVisible.set(true);
    } catch (error) {
      this.toast.error('Could not open the permit', error);
    } finally {
      this.loadingPermit.set(false);
    }
  }

  // --- Display helpers -------------------------------------------------------
  protected humanize(value: string | undefined | null): string {
    if (!value) {
      return '—';
    }
    const text = value.replace(/_/g, ' ').toLowerCase();
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  protected experience(years: number, months: number): string {
    const parts: string[] = [];
    if (years) parts.push(`${years} year${years === 1 ? '' : 's'}`);
    if (months) parts.push(`${months} month${months === 1 ? '' : 's'}`);
    return parts.length ? parts.join(', ') : 'New business';
  }

  protected markerIcon(event: PermitEvent): string {
    switch (event.toStatus) {
      case 'SUBMITTED':
        return 'pi pi-send';
      case 'AWAITING_PAYMENT':
        return 'pi pi-file-check';
      case 'PAYMENT_CONFIRMATION':
        return 'pi pi-wallet';
      case 'APPROVED':
        return 'pi pi-check';
      case 'ISSUED':
        return 'pi pi-verified';
      case 'REJECTED':
      case 'CANCELLED':
      case 'INSPECTION_FAILED':
        return 'pi pi-times';
      case 'RETURNED':
        return 'pi pi-replay';
      default:
        return 'pi pi-circle-fill';
    }
  }

  protected markerClass(event: PermitEvent): string {
    return 'timeline-marker tint-' + (event.toStatus ? permitStatusSeverity(event.toStatus) : 'info');
  }
}
