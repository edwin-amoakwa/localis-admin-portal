import { Component, computed, inject } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ChartModule } from 'primeng/chart';
import { AvatarModule } from 'primeng/avatar';
import { ProgressBarModule } from 'primeng/progressbar';
import { AdminService } from '../../core/services/admin.service';
import { AuthService } from '../../core/services/auth.service';
import {
  APPLICATION_STATUS_LABEL,
  APPLICATION_STATUS_SEVERITY,
  PRIORITY_SEVERITY,
  Severity,
} from '../../core/services/ui.service';
import { ApplicationStatus, Priority } from '../../core/models';

/** The operational overview: what came in, what is stuck, and what was collected. */
@Component({
  selector: 'app-dashboard',
  imports: [
    RouterLink,
    CurrencyPipe,
    DatePipe,
    ButtonModule,
    TableModule,
    TagModule,
    ChartModule,
    AvatarModule,
    ProgressBarModule,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class DashboardPage {
  protected readonly admin = inject(AdminService);
  private readonly auth = inject(AuthService);

  protected readonly user = this.auth.user;

  /** Collections over the elapsed months, summed across every revenue head. */
  protected readonly collectionsChart = computed(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
    const totals = months.map((_, i) =>
      this.admin.revenueHeads().reduce((sum, head) => sum + head.monthly[i], 0),
    );

    return {
      labels: months,
      datasets: [
        {
          label: 'Collections (GH₵)',
          data: totals,
          borderColor: '#0F4C81',
          backgroundColor: 'rgba(15, 76, 129, 0.12)',
          fill: true,
          tension: 0.35,
          borderWidth: 2,
          pointRadius: 3,
        },
      ],
    };
  });

  /** Where the open queue is sitting, by status. */
  protected readonly queueChart = computed(() => {
    const statuses: ApplicationStatus[] = [
      'SUBMITTED', 'UNDER_REVIEW', 'AWAITING_PAYMENT', 'INSPECTION_SCHEDULED', 'APPROVED',
    ];
    const counts = statuses.map(
      (status) => this.admin.applications().filter((a) => a.status === status).length,
    );

    return {
      labels: statuses.map((s) => APPLICATION_STATUS_LABEL[s]),
      datasets: [
        {
          data: counts,
          backgroundColor: ['#2b7cba', '#0F4C81', '#C9A227', '#e0bd4b', '#0E9F6E'],
          borderWidth: 0,
        },
      ],
    };
  });

  protected readonly chartOptions = {
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { callback: (value: number) => `${(value / 1000).toFixed(0)}k` },
        grid: { color: 'rgba(134, 151, 169, 0.16)' },
      },
      x: { grid: { display: false } },
    },
  };

  protected readonly doughnutOptions = {
    maintainAspectRatio: false,
    cutout: '62%',
    plugins: { legend: { position: 'right', labels: { boxWidth: 12, font: { size: 11 } } } },
  };

  /** Collection against target, for the progress meter. */
  protected readonly targetPercent = computed(() => {
    const target = this.admin.totalTarget();
    return target === 0 ? 0 : Math.round((this.admin.totalCollected() / target) * 100);
  });

  protected statusLabel(status: ApplicationStatus): string {
    return APPLICATION_STATUS_LABEL[status];
  }

  protected statusSeverity(status: ApplicationStatus): Severity {
    return APPLICATION_STATUS_SEVERITY[status];
  }

  protected prioritySeverity(priority: Priority): Severity {
    return PRIORITY_SEVERITY[priority];
  }

  protected greeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }
}
