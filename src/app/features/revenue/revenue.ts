import { Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, PercentPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { ChartModule } from 'primeng/chart';
import { ProgressBarModule } from 'primeng/progressbar';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../core/services/admin.service';
import { ToastService } from '../../core/services/toast.service';

/** Revenue by head: collections against target, arrears and the monthly curve. */
@Component({
  selector: 'app-revenue',
  imports: [
    RouterLink,
    FormsModule,
    CurrencyPipe,
    PercentPipe,
    ButtonModule,
    TableModule,
    ChartModule,
    ProgressBarModule,
    SelectModule,
  ],
  templateUrl: './revenue.html',
  styleUrls: ['../shared-page.scss', './revenue.scss'],
})
export class RevenuePage {
  protected readonly admin = inject(AdminService);
  private readonly toast = inject(ToastService);

  protected readonly selectedHeadId = signal<string>('rev-1');

  protected readonly heads = computed(() =>
    [...this.admin.revenueHeads()].sort((a, b) => b.collectedYtd - a.collectedYtd),
  );

  protected readonly selectedHead = computed(
    () => this.admin.revenueHeads().find((h) => h.id === this.selectedHeadId()) ?? this.heads()[0],
  );

  protected readonly headOptions = computed(() =>
    this.heads().map((h) => ({ value: h.id, label: h.name })),
  );

  protected readonly totals = computed(() => {
    const heads = this.admin.revenueHeads();
    const collected = heads.reduce((sum, h) => sum + h.collectedYtd, 0);
    const target = heads.reduce((sum, h) => sum + h.target, 0);
    const outstanding = heads.reduce((sum, h) => sum + h.outstanding, 0);
    const transactions = heads.reduce((sum, h) => sum + h.transactions, 0);

    return {
      collected,
      target,
      outstanding,
      transactions,
      percent: target ? Math.round((collected / target) * 100) : 0,
    };
  });

  private readonly months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];

  /** The top five heads, month by month — where the money actually comes from. */
  protected readonly trendChart = computed(() => {
    const palette = ['#0F4C81', '#0E9F6E', '#C9A227', '#2b7cba', '#84d8bb'];

    return {
      labels: this.months,
      datasets: this.heads()
        .slice(0, 5)
        .map((head, i) => ({
          label: head.name,
          data: head.monthly.slice(0, 7),
          borderColor: palette[i],
          backgroundColor: palette[i],
          tension: 0.35,
          borderWidth: 2,
          pointRadius: 2,
          fill: false,
        })),
    };
  });

  /** Share of total collections, by head. */
  protected readonly mixChart = computed(() => {
    const top = this.heads().slice(0, 6);
    const rest = this.heads().slice(6).reduce((sum, h) => sum + h.collectedYtd, 0);

    return {
      labels: [...top.map((h) => h.name), 'Other heads'],
      datasets: [
        {
          data: [...top.map((h) => h.collectedYtd), rest],
          backgroundColor: ['#0F4C81', '#0E9F6E', '#C9A227', '#2b7cba', '#84d8bb', '#e0bd4b', '#b9c5d1'],
          borderWidth: 0,
        },
      ],
    };
  });

  /** The selected head's own monthly curve. */
  protected readonly headChart = computed(() => ({
    labels: this.months,
    datasets: [
      {
        label: this.selectedHead()?.name ?? '',
        data: this.selectedHead()?.monthly.slice(0, 7) ?? [],
        backgroundColor: '#0F4C81',
        borderRadius: 6,
      },
    ],
  }));

  protected readonly lineOptions = {
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

  protected readonly barOptions = {
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
    cutout: '60%',
    plugins: { legend: { position: 'right', labels: { boxWidth: 12, font: { size: 11 } } } },
  };

  protected percentOf(collected: number, target: number): number {
    return target ? Math.round((collected / target) * 100) : 0;
  }

  protected exportReport(): void {
    this.toast.info(
      'Demonstration build',
      'In the live portal this exports the revenue position to Excel.',
    );
  }
}
