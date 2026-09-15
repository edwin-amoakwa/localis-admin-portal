import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { SelectModule } from 'primeng/select';
import { AdminService } from '../../core/services/admin.service';
import { Severity } from '../../core/services/ui.service';
import { AuditEntry } from '../../core/models';
import { ToastService } from '../../core/services/toast.service';

/** The system activity log. Read-only by design. */
@Component({
  selector: 'app-audit',
  imports: [
    FormsModule,
    TableModule,
    TagModule,
    ButtonModule,
    InputTextModule,
    MultiSelectModule,
    SelectModule,
  ],
  templateUrl: './audit.html',
  styleUrls: ['../shared-page.scss', './audit.scss'],
})
export class AuditPage {
  protected readonly admin = inject(AdminService);
  private readonly toast = inject(ToastService);

  protected readonly term = signal('');
  protected readonly categoryFilter = signal<AuditEntry['category'][]>([]);
  protected readonly actorFilter = signal<string | null>(null);

  protected readonly categoryOptions: { value: AuditEntry['category']; label: string }[] = [
    { value: 'AUTH', label: 'Authentication' },
    { value: 'APPLICATION', label: 'Applications' },
    { value: 'PAYMENT', label: 'Payments' },
    { value: 'INSPECTION', label: 'Inspections' },
    { value: 'USER', label: 'Users' },
    { value: 'ROLE', label: 'Roles' },
    { value: 'SETTINGS', label: 'Settings' },
  ];

  protected readonly actorOptions = computed(() =>
    [...new Set(this.admin.audit().map((a) => a.actor))].sort().map((value) => ({
      value,
      label: value,
    })),
  );

  protected readonly rows = computed(() => {
    const term = this.term().trim().toLowerCase();
    const categories = this.categoryFilter();
    const actor = this.actorFilter();

    return this.admin
      .audit()
      .filter((a) => (categories.length ? categories.includes(a.category) : true))
      .filter((a) => (actor ? a.actor === actor : true))
      .filter((a) =>
        term
          ? a.action.toLowerCase().includes(term) ||
            a.target.toLowerCase().includes(term) ||
            a.detail.toLowerCase().includes(term) ||
            a.actor.toLowerCase().includes(term)
          : true,
      );
  });

  protected readonly stats = computed(() => {
    const list = this.admin.audit();
    const today = new Date().toISOString().slice(0, 10);
    return {
      total: list.length,
      today: list.filter((a) => a.timestamp.startsWith(today)).length,
      actors: new Set(list.map((a) => a.actor)).size,
      failedLogins: list.filter((a) => a.action === 'Failed sign-in attempt').length,
    };
  });

  protected clear(): void {
    this.term.set('');
    this.categoryFilter.set([]);
    this.actorFilter.set(null);
  }

  protected export(): void {
    this.toast.info(
      'Demonstration build',
      `In the live portal this exports ${this.rows().length} log entries for the auditor.`,
    );
  }

  protected categorySeverity(category: AuditEntry['category']): Severity {
    const map: Record<AuditEntry['category'], Severity> = {
      AUTH: 'secondary',
      APPLICATION: 'info',
      PAYMENT: 'success',
      INSPECTION: 'warn',
      USER: 'contrast',
      ROLE: 'contrast',
      SETTINGS: 'secondary',
    };
    return map[category];
  }

  protected categoryIcon(category: AuditEntry['category']): string {
    const map: Record<AuditEntry['category'], string> = {
      AUTH: 'pi pi-sign-in',
      APPLICATION: 'pi pi-file-edit',
      PAYMENT: 'pi pi-credit-card',
      INSPECTION: 'pi pi-search',
      USER: 'pi pi-user',
      ROLE: 'pi pi-lock',
      SETTINGS: 'pi pi-cog',
    };
    return map[category];
  }
}
