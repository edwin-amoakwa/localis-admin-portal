import { Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TableModule } from 'primeng/table';
import { TabsModule } from 'primeng/tabs';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import {
  PermitApplicationRecord,
  PermitApplicationStatus,
  permitStatusSeverity,
} from '../../../core/models/permit';
import { AuthService } from '../../../core/services/auth.service';
import { PermitQueueService } from '../../../core/services/permit-queue.service';
import { ToastService } from '../../../core/services/toast.service';

interface QueueTab {
  id: string;
  label: string;
  /** null = every filed application. */
  statuses: PermitApplicationStatus[] | null;
  emptyTitle: string;
}

const TABS: QueueTab[] = [
  {
    id: 'pending',
    label: 'Pending approval',
    statuses: ['SUBMITTED', 'UNDER_REVIEW', 'INSPECTION_PASSED'],
    emptyTitle: 'No applications waiting for approval',
  },
  {
    id: 'approved',
    label: 'Approved for payment',
    statuses: ['AWAITING_PAYMENT'],
    emptyTitle: 'No applications waiting for the applicant to pay',
  },
  {
    id: 'confirmation',
    label: 'Awaiting payment confirmation',
    statuses: ['PAYMENT_CONFIRMATION'],
    emptyTitle: 'No payments to confirm',
  },
  {
    id: 'issued',
    label: 'Permits generated',
    statuses: ['ISSUED'],
    emptyTitle: 'No permits generated yet',
  },
  { id: 'all', label: 'All', statuses: null, emptyTitle: 'No applications filed yet' },
];

/** The assembly's Business Operating Permit queue, straight from localis-api. */
@Component({
  selector: 'app-permit-queue',
  imports: [
    FormsModule,
    RouterLink,
    CurrencyPipe,
    DatePipe,
    TableModule,
    TabsModule,
    TagModule,
    ButtonModule,
    InputTextModule,
  ],
  templateUrl: './permit-queue.html',
  styleUrls: ['../../shared-page.scss', './permit-queue.scss'],
})
export class PermitQueuePage {
  private readonly queue = inject(PermitQueueService);
  private readonly toast = inject(ToastService);
  protected readonly auth = inject(AuthService);

  protected readonly tabs = TABS;
  protected readonly activeTab = signal<string>(TABS[0].id);
  protected readonly loading = signal(false);
  protected readonly failed = signal(false);
  protected readonly applications = signal<PermitApplicationRecord[]>([]);
  protected readonly term = signal('');

  protected readonly currentTab = computed(
    () => TABS.find((t) => t.id === this.activeTab()) ?? TABS[0],
  );

  protected readonly rows = computed(() => {
    const term = this.term().trim().toLowerCase();
    const list = this.applications();
    if (!term) {
      return list;
    }
    return list.filter((a) =>
      [
        a.applicationNumber,
        a.business?.businessName,
        a.business?.categoryName,
        a.applicant?.fullname,
        a.applicant?.phoneNo,
      ].some((value) => value?.toLowerCase().includes(term)),
    );
  });

  protected readonly severity = permitStatusSeverity;

  constructor() {
    this.load();
  }

  protected count(tab: QueueTab): number {
    return this.queue.countOf(tab.statuses);
  }

  protected selectTab(id: string | number | undefined): void {
    if (id === undefined || String(id) === this.activeTab()) {
      return;
    }
    this.activeTab.set(String(id));
    this.load();
  }

  protected async load(): Promise<void> {
    this.loading.set(true);
    this.failed.set(false);
    this.queue.refreshCounts();

    const tabId = this.activeTab();
    try {
      const list = await this.queue.list(this.currentTab().statuses);
      if (tabId === this.activeTab()) {
        this.applications.set(list ?? []);
      }
    } catch (error) {
      if (tabId === this.activeTab()) {
        this.applications.set([]);
        this.failed.set(true);
      }
      this.toast.error('Could not load applications', error);
    } finally {
      if (tabId === this.activeTab()) {
        this.loading.set(false);
      }
    }
  }

  protected actionLabel(status: PermitApplicationStatus): string {
    switch (status) {
      case 'PAYMENT_CONFIRMATION':
        return 'Confirm payment';
      case 'ISSUED':
        return 'View permit';
      case 'SUBMITTED':
      case 'UNDER_REVIEW':
      case 'INSPECTION_PASSED':
        return 'Review';
      default:
        return 'Open';
    }
  }

  protected actionIcon(status: PermitApplicationStatus): string {
    switch (status) {
      case 'PAYMENT_CONFIRMATION':
        return 'pi pi-wallet';
      case 'ISSUED':
        return 'pi pi-verified';
      default:
        return 'pi pi-arrow-right';
    }
  }
}
