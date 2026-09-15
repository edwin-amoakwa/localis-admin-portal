import { Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { DrawerModule } from 'primeng/drawer';
import { ChartModule } from 'primeng/chart';
import { AdminService } from '../../core/services/admin.service';
import { Severity } from '../../core/services/ui.service';
import { PropertyRecord } from '../../core/models';
import { ToastService } from '../../core/services/toast.service';

/** The valuation list: property records, rate history and arrears. */
@Component({
  selector: 'app-properties',
  imports: [
    FormsModule,
    CurrencyPipe,
    DatePipe,
    DecimalPipe,
    TableModule,
    TagModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    DrawerModule,
    ChartModule,
  ],
  templateUrl: './properties.html',
  styleUrls: ['../shared-page.scss', './properties.scss'],
})
export class PropertiesPage {
  protected readonly admin = inject(AdminService);
  private readonly toast = inject(ToastService);

  protected readonly term = signal('');
  protected readonly useFilter = signal<string | null>(null);
  protected readonly subMetroFilter = signal<string | null>(null);
  protected readonly arrearsOnly = signal(false);

  protected readonly useOptions = ['Residential', 'Commercial', 'Industrial', 'Mixed use'].map(
    (value) => ({ value, label: value }),
  );

  protected readonly subMetroOptions = computed(() =>
    this.admin.subMetros.map((value) => ({ value, label: value })),
  );

  protected readonly rows = computed(() => {
    const term = this.term().trim().toLowerCase();
    const use = this.useFilter();
    const subMetro = this.subMetroFilter();
    const arrears = this.arrearsOnly();

    return this.admin
      .properties()
      .filter((p) => (use ? p.use === use : true))
      .filter((p) => (subMetro ? p.subMetro === subMetro : true))
      .filter((p) => (arrears ? p.outstanding > 0 : true))
      .filter((p) =>
        term
          ? p.propertyNumber.toLowerCase().includes(term) ||
            p.owner.toLowerCase().includes(term) ||
            p.location.toLowerCase().includes(term) ||
            p.digitalAddress.toLowerCase().includes(term)
          : true,
      );
  });

  protected readonly stats = computed(() => {
    const list = this.admin.properties();
    return {
      total: list.length,
      rated: list.filter((p) => p.status === 'RATED').length,
      demand: list.reduce((sum, p) => sum + p.currentRate, 0),
      arrears: list.reduce((sum, p) => sum + p.outstanding, 0),
    };
  });

  /** Rateable value split by use, for the valuation summary. */
  protected readonly useChart = computed(() => {
    const uses = ['Residential', 'Commercial', 'Industrial', 'Mixed use'];
    const values = uses.map((use) =>
      this.admin
        .properties()
        .filter((p) => p.use === use)
        .reduce((sum, p) => sum + p.rateableValue, 0),
    );

    return {
      labels: uses,
      datasets: [
        {
          data: values,
          backgroundColor: ['#0F4C81', '#0E9F6E', '#C9A227', '#2b7cba'],
          borderWidth: 0,
        },
      ],
    };
  });

  protected readonly doughnutOptions = {
    maintainAspectRatio: false,
    cutout: '60%',
    plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } } },
  };

  // --- Detail drawer --------------------------------------------------------
  protected readonly detailOpen = signal(false);
  protected readonly selected = signal<PropertyRecord | null>(null);

  protected openDetail(property: PropertyRecord): void {
    this.selected.set(property);
    this.detailOpen.set(true);
  }

  protected clear(): void {
    this.term.set('');
    this.useFilter.set(null);
    this.subMetroFilter.set(null);
    this.arrearsOnly.set(false);
  }

  protected exportCsv(): void {
    this.toast.info(
      'Demonstration build',
      `In the live portal this exports ${this.rows().length} properties to CSV.`,
    );
  }

  protected statusSeverity(status: PropertyRecord['status']): Severity {
    const map: Record<PropertyRecord['status'], Severity> = {
      RATED: 'success',
      UNRATED: 'warn',
      EXEMPT: 'secondary',
    };
    return map[status];
  }
}
