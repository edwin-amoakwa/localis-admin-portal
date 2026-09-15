import { Component, computed, inject, input, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ChartModule } from 'primeng/chart';
import { AdminService } from '../../core/services/admin.service';
import {
  APPLICATION_STATUS_LABEL,
  APPLICATION_STATUS_SEVERITY,
  PRIORITY_SEVERITY,
  Severity,
} from '../../core/services/ui.service';
import { ApplicationStatus, Priority, ServiceCategoryId } from '../../core/models';
import { ToastService } from '../../core/services/toast.service';

/**
 * A single service desk — the queue for one category of service.
 *
 * The four desks in the sidebar (business permits, property rates, building
 * permits, environmental health) are the same screen with a different category
 * from the route, so there is one queue implementation to maintain rather than
 * four that drift apart.
 */
@Component({
  selector: 'app-service-desk',
  imports: [
    RouterLink,
    FormsModule,
    CurrencyPipe,
    DatePipe,
    TableModule,
    TagModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    ChartModule,
  ],
  templateUrl: './service-desk.html',
  styleUrls: ['../shared-page.scss', './service-desk.scss'],
})
export class ServiceDeskPage {
  protected readonly admin = inject(AdminService);
  private readonly toast = inject(ToastService);

  readonly category = input.required<string>();

  protected readonly term = signal('');
  protected readonly statusFilter = signal<ApplicationStatus | null>(null);

  protected readonly categoryDef = computed(() =>
    this.admin.serviceCategories.find((c) => c.id === this.category()),
  );

  protected readonly applications = computed(() =>
    this.admin.applicationsByCategory(this.category() as ServiceCategoryId),
  );

  protected readonly rows = computed(() => {
    const term = this.term().trim().toLowerCase();
    const status = this.statusFilter();

    return this.applications()
      .filter((a) => (status ? a.status === status : true))
      .filter((a) =>
        term
          ? a.applicationNumber.toLowerCase().includes(term) ||
            a.applicant.toLowerCase().includes(term) ||
            a.subject.toLowerCase().includes(term)
          : true,
      )
      .sort((a, b) => a.ageDays - b.ageDays);
  });

  protected readonly statusOptions = (
    Object.keys(APPLICATION_STATUS_LABEL) as ApplicationStatus[]
  ).map((value) => ({ value, label: APPLICATION_STATUS_LABEL[value] }));

  protected readonly stats = computed(() => {
    const list = this.applications();
    return {
      total: list.length,
      open: list.filter((a) => !['ISSUED', 'REJECTED'].includes(a.status)).length,
      awaitingPayment: list.filter((a) => a.status === 'AWAITING_PAYMENT').length,
      assessed: list.reduce((sum, a) => sum + a.assessedAmount, 0),
      collected: list.reduce((sum, a) => sum + a.amountPaid, 0),
    };
  });

  /** Volume by service within this category. */
  protected readonly serviceChart = computed(() => {
    const counts = new Map<string, number>();
    for (const application of this.applications()) {
      counts.set(application.serviceName, (counts.get(application.serviceName) ?? 0) + 1);
    }

    return {
      labels: [...counts.keys()],
      datasets: [
        {
          label: 'Applications',
          data: [...counts.values()],
          backgroundColor: '#0F4C81',
          borderRadius: 6,
          barThickness: 22,
        },
      ],
    };
  });

  protected readonly chartOptions = {
    indexAxis: 'y',
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { beginAtZero: true, grid: { color: 'rgba(134, 151, 169, 0.16)' } },
      y: { grid: { display: false } },
    },
  };

  protected clear(): void {
    this.term.set('');
    this.statusFilter.set(null);
  }

  protected exportCsv(): void {
    this.toast.info(
      'Demonstration build',
      `In the live portal this exports ${this.rows().length} rows to CSV.`,
    );
  }

  protected statusLabel(status: ApplicationStatus): string {
    return APPLICATION_STATUS_LABEL[status];
  }

  protected statusSeverity(status: ApplicationStatus): Severity {
    return APPLICATION_STATUS_SEVERITY[status];
  }

  protected prioritySeverity(priority: Priority): Severity {
    return PRIORITY_SEVERITY[priority];
  }
}
