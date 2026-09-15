import { Component, computed, inject } from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { ChartModule } from 'primeng/chart';
import { TagModule } from 'primeng/tag';
import { ProgressBarModule } from 'primeng/progressbar';
import { AdminService } from '../../core/services/admin.service';
import { APPLICATION_STATUS_LABEL } from '../../core/services/ui.service';

/** Management dashboards: trends, mix, processing time and compliance. */
@Component({
  selector: 'app-analytics',
  imports: [CurrencyPipe, DecimalPipe, ChartModule, TagModule, ProgressBarModule],
  templateUrl: './analytics.html',
  styleUrls: ['../shared-page.scss', './analytics.scss'],
})
export class AnalyticsPage {
  protected readonly admin = inject(AdminService);

  private readonly months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];

  // --- Headline figures -----------------------------------------------------

  protected readonly approvalRate = computed(() => {
    const decided = this.admin
      .applications()
      .filter((a) => ['APPROVED', 'ISSUED', 'REJECTED'].includes(a.status));
    if (!decided.length) return 0;
    const approved = decided.filter((a) => a.status !== 'REJECTED').length;
    return Math.round((approved / decided.length) * 100);
  });

  /** Mean age of applications that have reached a decision. */
  protected readonly avgProcessingDays = computed(() => {
    const decided = this.admin
      .applications()
      .filter((a) => ['APPROVED', 'ISSUED', 'REJECTED'].includes(a.status));
    if (!decided.length) return 0;
    return Math.round(decided.reduce((sum, a) => sum + a.ageDays, 0) / decided.length);
  });

  protected readonly complianceRate = computed(() => {
    const businesses = this.admin.businesses();
    if (!businesses.length) return 0;
    const valid = businesses.filter((b) => b.permitStatus === 'VALID').length;
    return Math.round((valid / businesses.length) * 100);
  });

  protected readonly collectionRate = computed(() => {
    const target = this.admin.totalTarget();
    return target ? Math.round((this.admin.totalCollected() / target) * 100) : 0;
  });

  // --- Charts ---------------------------------------------------------------

  /** Revenue trend, all heads combined. */
  protected readonly revenueTrend = computed(() => {
    const totals = this.months.map((_, i) =>
      this.admin.revenueHeads().reduce((sum, head) => sum + head.monthly[i], 0),
    );

    return {
      labels: this.months,
      datasets: [
        {
          label: 'Collections',
          data: totals,
          borderColor: '#0F4C81',
          backgroundColor: 'rgba(15, 76, 129, 0.14)',
          fill: true,
          tension: 0.35,
          borderWidth: 2,
        },
      ],
    };
  });

  /** Applications by service category. */
  protected readonly byService = computed(() => {
    const counts = this.admin.serviceCategories.map(
      (category) => this.admin.applicationsByCategory(category.id).length,
    );

    return {
      labels: this.admin.serviceCategories.map((c) => c.name.replace(' Services', '')),
      datasets: [
        {
          label: 'Applications',
          data: counts,
          backgroundColor: '#0E9F6E',
          borderRadius: 6,
        },
      ],
    };
  });

  /** Processing time by category — a proxy for where files stall. */
  protected readonly processingTime = computed(() => {
    const data = this.admin.serviceCategories.map((category) => {
      const list = this.admin.applicationsByCategory(category.id);
      return list.length ? Math.round(list.reduce((s, a) => s + a.ageDays, 0) / list.length) : 0;
    });

    return {
      labels: this.admin.serviceCategories.map((c) => c.name.replace(' Services', '')),
      datasets: [
        {
          label: 'Average days',
          data,
          backgroundColor: '#C9A227',
          borderRadius: 6,
        },
      ],
    };
  });

  /** Top revenue sources. */
  protected readonly topSources = computed(() => {
    const top = [...this.admin.revenueHeads()]
      .sort((a, b) => b.collectedYtd - a.collectedYtd)
      .slice(0, 6);

    return {
      labels: top.map((h) => h.name),
      datasets: [
        {
          data: top.map((h) => h.collectedYtd),
          backgroundColor: ['#0F4C81', '#0E9F6E', '#C9A227', '#2b7cba', '#84d8bb', '#e0bd4b'],
          borderWidth: 0,
        },
      ],
    };
  });

  /** Applications by status — the shape of the open queue. */
  protected readonly byStatus = computed(() => {
    const counts = new Map<string, number>();
    for (const application of this.admin.applications()) {
      const label = APPLICATION_STATUS_LABEL[application.status];
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }

    return {
      labels: [...counts.keys()],
      datasets: [
        {
          data: [...counts.values()],
          backgroundColor: [
            '#2b7cba', '#0F4C81', '#C9A227', '#e0bd4b', '#84d8bb',
            '#0E9F6E', '#c0342c', '#8697a9', '#07724d', '#16619f',
          ],
          borderWidth: 0,
        },
      ],
    };
  });

  /** Monthly collections against a straight-line target. */
  protected readonly monthlyVsTarget = computed(() => {
    const actual = this.months.map((_, i) =>
      this.admin.revenueHeads().reduce((sum, head) => sum + head.monthly[i], 0),
    );
    const monthlyTarget = Math.round(this.admin.totalTarget() / 12);

    return {
      labels: this.months,
      datasets: [
        {
          type: 'bar' as const,
          label: 'Collected',
          data: actual,
          backgroundColor: '#0F4C81',
          borderRadius: 6,
        },
        {
          type: 'line' as const,
          label: 'Target',
          data: this.months.map(() => monthlyTarget),
          borderColor: '#C9A227',
          borderDash: [6, 6],
          borderWidth: 2,
          pointRadius: 0,
          fill: false,
        },
      ],
    };
  });

  /** Compliance by sub-metro, as a radar. */
  protected readonly complianceBySubMetro = computed(() => {
    const scores = this.admin.subMetros.map((subMetro) => {
      const list = this.admin.businesses().filter((b) => b.subMetro === subMetro);
      return list.length ? Math.round(list.reduce((s, b) => s + b.compliance, 0) / list.length) : 0;
    });

    return {
      labels: this.admin.subMetros,
      datasets: [
        {
          label: 'Compliance score',
          data: scores,
          borderColor: '#0E9F6E',
          backgroundColor: 'rgba(14, 159, 110, 0.18)',
          borderWidth: 2,
          pointBackgroundColor: '#0E9F6E',
        },
      ],
    };
  });

  // --- Chart options --------------------------------------------------------

  protected readonly moneyOptions = {
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

  protected readonly countOptions = {
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, grid: { color: 'rgba(134, 151, 169, 0.16)' } },
      x: { grid: { display: false } },
    },
  };

  protected readonly comboOptions = {
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } } },
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
    cutout: '58%',
    plugins: { legend: { position: 'right', labels: { boxWidth: 12, font: { size: 11 } } } },
  };

  protected readonly radarOptions = {
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        grid: { color: 'rgba(134, 151, 169, 0.24)' },
        pointLabels: { font: { size: 11 } },
      },
    },
  };
}
