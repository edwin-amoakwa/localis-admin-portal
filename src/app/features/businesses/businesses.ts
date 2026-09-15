import { Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { DrawerModule } from 'primeng/drawer';
import { TabsModule } from 'primeng/tabs';
import { ProgressBarModule } from 'primeng/progressbar';
import { AdminService } from '../../core/services/admin.service';
import { Severity } from '../../core/services/ui.service';
import { BusinessRecord } from '../../core/models';
import { ToastService } from '../../core/services/toast.service';

/** The business register, with a full profile in a side drawer. */
@Component({
  selector: 'app-businesses',
  imports: [
    FormsModule,
    CurrencyPipe,
    DatePipe,
    TableModule,
    TagModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    DrawerModule,
    TabsModule,
    ProgressBarModule,
  ],
  templateUrl: './businesses.html',
  styleUrls: ['../shared-page.scss', './businesses.scss'],
})
export class BusinessesPage {
  protected readonly admin = inject(AdminService);
  private readonly toast = inject(ToastService);

  protected readonly term = signal('');
  protected readonly permitFilter = signal<BusinessRecord['permitStatus'] | null>(null);
  protected readonly subMetroFilter = signal<string | null>(null);

  protected readonly permitOptions = [
    { value: 'VALID', label: 'Valid permit' },
    { value: 'EXPIRED', label: 'Expired permit' },
    { value: 'PENDING', label: 'Pending' },
  ];

  protected readonly subMetroOptions = computed(() =>
    this.admin.subMetros.map((value) => ({ value, label: value })),
  );

  protected readonly rows = computed(() => {
    const term = this.term().trim().toLowerCase();
    const permit = this.permitFilter();
    const subMetro = this.subMetroFilter();

    return this.admin
      .businesses()
      .filter((b) => (permit ? b.permitStatus === permit : true))
      .filter((b) => (subMetro ? b.subMetro === subMetro : true))
      .filter((b) =>
        term
          ? b.businessName.toLowerCase().includes(term) ||
            b.businessNumber.toLowerCase().includes(term) ||
            b.owner.toLowerCase().includes(term) ||
            b.category.toLowerCase().includes(term)
          : true,
      );
  });

  protected readonly stats = computed(() => {
    const list = this.admin.businesses();
    return {
      total: list.length,
      valid: list.filter((b) => b.permitStatus === 'VALID').length,
      expired: list.filter((b) => b.permitStatus === 'EXPIRED').length,
      arrears: list.reduce((sum, b) => sum + b.outstanding, 0),
    };
  });

  // --- Profile drawer -------------------------------------------------------
  protected readonly profileOpen = signal(false);
  protected readonly selected = signal<BusinessRecord | null>(null);

  protected openProfile(business: BusinessRecord): void {
    this.selected.set(business);
    this.profileOpen.set(true);
  }

  protected clear(): void {
    this.term.set('');
    this.permitFilter.set(null);
    this.subMetroFilter.set(null);
  }

  protected exportCsv(): void {
    this.toast.info(
      'Demonstration build',
      `In the live portal this exports ${this.rows().length} businesses to CSV.`,
    );
  }

  protected permitSeverity(status: BusinessRecord['permitStatus']): Severity {
    const map: Record<BusinessRecord['permitStatus'], Severity> = {
      VALID: 'success',
      EXPIRED: 'danger',
      PENDING: 'warn',
    };
    return map[status];
  }

  protected statusSeverity(status: BusinessRecord['status']): Severity {
    const map: Record<BusinessRecord['status'], Severity> = {
      ACTIVE: 'success',
      DORMANT: 'warn',
      CLOSED: 'secondary',
    };
    return map[status];
  }

  protected complianceSeverity(score: number): Severity {
    return score >= 85 ? 'success' : score >= 70 ? 'warn' : 'danger';
  }

  protected outcomeSeverity(outcome: string): Severity {
    const map: Record<string, Severity> = {
      PASSED: 'success',
      RESOLVED: 'success',
      NOTICE: 'warn',
      FAILED: 'danger',
    };
    return map[outcome] ?? 'secondary';
  }
}
