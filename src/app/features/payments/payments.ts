import { Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { TabsModule } from 'primeng/tabs';
import { DialogModule } from 'primeng/dialog';
import { ConfirmationService } from 'primeng/api';
import { AdminService } from '../../core/services/admin.service';
import { AuthService } from '../../core/services/auth.service';
import {
  INVOICE_STATUS_LABEL,
  INVOICE_STATUS_SEVERITY,
  Severity,
} from '../../core/services/ui.service';
import { Invoice, InvoiceStatus, Receipt, Refund } from '../../core/models';
import { ToastService } from '../../core/services/toast.service';

/** Invoices, receipts, reconciliation and refunds. */
@Component({
  selector: 'app-payments',
  imports: [
    FormsModule,
    CurrencyPipe,
    DatePipe,
    TableModule,
    TagModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    TabsModule,
    DialogModule,
  ],
  templateUrl: './payments.html',
  styleUrls: ['../shared-page.scss', './payments.scss'],
})
export class PaymentsPage {
  protected readonly admin = inject(AdminService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmationService);

  protected readonly term = signal('');
  protected readonly statusFilter = signal<InvoiceStatus | null>(null);

  protected readonly statusOptions = (Object.keys(INVOICE_STATUS_LABEL) as InvoiceStatus[]).map(
    (value) => ({ value, label: INVOICE_STATUS_LABEL[value] }),
  );

  protected readonly invoices = computed(() => {
    const term = this.term().trim().toLowerCase();
    const status = this.statusFilter();

    return this.admin
      .invoices()
      .filter((i) => (status ? i.status === status : true))
      .filter((i) =>
        term
          ? i.invoiceNumber.toLowerCase().includes(term) ||
            i.payer.toLowerCase().includes(term) ||
            i.description.toLowerCase().includes(term)
          : true,
      )
      .sort((a, b) => b.issuedDate.localeCompare(a.issuedDate));
  });

  protected readonly outstanding = computed(() =>
    this.admin.invoices().filter((i) => i.status === 'UNPAID' || i.status === 'PART_PAID'),
  );

  protected readonly receipts = computed(() => {
    const term = this.term().trim().toLowerCase();
    return this.admin
      .receipts()
      .filter((r) =>
        term
          ? r.receiptNumber.toLowerCase().includes(term) ||
            r.payer.toLowerCase().includes(term) ||
            r.reference.toLowerCase().includes(term)
          : true,
      )
      .sort((a, b) => b.paidDate.localeCompare(a.paidDate));
  });

  /** Receipts still to be matched against the bank statement. */
  protected readonly unreconciled = computed(() =>
    this.admin.receipts().filter((r) => !r.reconciled),
  );

  protected readonly selectedForReconciliation = signal<Receipt[]>([]);

  protected readonly totals = computed(() => ({
    outstanding: this.outstanding().reduce((sum, i) => sum + (i.total - i.paid), 0),
    collected: this.admin.receipts().reduce((sum, r) => sum + r.amount, 0),
    unreconciled: this.unreconciled().reduce((sum, r) => sum + r.amount, 0),
    refundsPending: this.admin.refunds().filter((r) => r.status === 'PENDING').length,
  }));

  // --- Post a payment -------------------------------------------------------
  protected readonly payOpen = signal(false);
  protected readonly working = signal<Invoice | null>(null);
  protected readonly amount = signal(0);
  protected readonly method = signal('Cash');

  protected readonly methods = ['Cash', 'Mobile Money', 'Debit Card', 'Bank Transfer', 'POS', 'Cheque'];

  protected openPay(invoice: Invoice): void {
    this.working.set(invoice);
    this.amount.set(invoice.total - invoice.paid);
    this.method.set('Cash');
    this.payOpen.set(true);
  }

  protected confirmPay(): void {
    const invoice = this.working();
    const amount = this.amount();

    if (!invoice || amount <= 0) {
      this.toast.warn('Enter an amount');
      return;
    }

    if (amount > invoice.total - invoice.paid) {
      this.toast.warn(
        'Amount too high',
        'A receipt cannot exceed the outstanding balance on the invoice.',
      );
      return;
    }

    const receiptNumber = this.admin.postPayment(invoice, amount, this.method(), this.auth.displayName());
    this.payOpen.set(false);

    this.toast.success(
      'Payment posted',
      `Receipt ${receiptNumber} issued for GH₵ ${amount.toFixed(2)}.`,
    );
  }

  protected reconcileSelected(): void {
    const selected = this.selectedForReconciliation();

    if (!selected.length) {
      this.toast.warn(
        'Nothing selected',
        'Tick the receipts you have matched against the bank statement.',
      );
      return;
    }

    this.confirm.confirm({
      header: `Reconcile ${selected.length} receipt(s)?`,
      message: 'Mark these as matched against the bank statement. This is recorded in the audit log.',
      icon: 'pi pi-check-square',
      acceptLabel: 'Reconcile',
      rejectLabel: 'Cancel',
      accept: () => {
        this.admin.reconcileReceipts(selected.map((r) => r.id), this.auth.displayName());
        this.selectedForReconciliation.set([]);
        this.toast.success(
          'Receipts reconciled',
          `${selected.length} receipt(s) marked as reconciled.`,
        );
      },
    });
  }

  protected setRefund(refund: Refund, status: 'APPROVED' | 'REJECTED' | 'PAID'): void {
    this.admin.setRefundStatus(refund.id, status, this.auth.displayName());
    const summary = `Refund ${status.toLowerCase()}`;
    const detail = `${refund.reference} — GH₵ ${refund.amount.toFixed(2)}.`;
    if (status === 'REJECTED') {
      this.toast.info(summary, detail);
    } else {
      this.toast.success(summary, detail);
    }
  }

  protected clear(): void {
    this.term.set('');
    this.statusFilter.set(null);
  }

  protected statusLabel(status: InvoiceStatus): string {
    return INVOICE_STATUS_LABEL[status];
  }

  protected statusSeverity(status: InvoiceStatus): Severity {
    return INVOICE_STATUS_SEVERITY[status];
  }

  protected refundSeverity(status: Refund['status']): Severity {
    const map: Record<Refund['status'], Severity> = {
      PENDING: 'warn',
      APPROVED: 'info',
      REJECTED: 'danger',
      PAID: 'success',
    };
    return map[status];
  }
}
