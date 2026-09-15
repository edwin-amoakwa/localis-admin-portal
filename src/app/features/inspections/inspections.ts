import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TabsModule } from 'primeng/tabs';
import { DialogModule } from 'primeng/dialog';
import { TextareaModule } from 'primeng/textarea';
import { CheckboxModule } from 'primeng/checkbox';
import { AdminService } from '../../core/services/admin.service';
import { AuthService } from '../../core/services/auth.service';
import { Severity } from '../../core/services/ui.service';
import { Inspection, StaffUser } from '../../core/models';
import { ToastService } from '../../core/services/toast.service';

/** The inspection diary: schedule, assignments, reports and photo evidence. */
@Component({
  selector: 'app-inspections',
  imports: [
    FormsModule,
    DatePipe,
    TableModule,
    TagModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    TabsModule,
    DialogModule,
    TextareaModule,
    CheckboxModule,
  ],
  templateUrl: './inspections.html',
  styleUrls: ['../shared-page.scss', './inspections.scss'],
})
export class InspectionsPage {
  protected readonly admin = inject(AdminService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  protected readonly term = signal('');
  protected readonly inspectorFilter = signal<string | null>(null);

  protected readonly scheduled = computed(() =>
    this.filter(this.admin.inspections().filter((i) => i.outcome === 'PENDING')).sort((a, b) =>
      a.scheduledDate.localeCompare(b.scheduledDate),
    ),
  );

  protected readonly completed = computed(() =>
    this.filter(this.admin.inspections().filter((i) => i.outcome !== 'PENDING')).sort((a, b) =>
      (b.completedOn ?? '').localeCompare(a.completedOn ?? ''),
    ),
  );

  private filter(list: Inspection[]): Inspection[] {
    const term = this.term().trim().toLowerCase();
    const inspector = this.inspectorFilter();

    return list
      .filter((i) => (inspector ? i.inspector === inspector : true))
      .filter((i) =>
        term
          ? i.reference.toLowerCase().includes(term) ||
            i.subject.toLowerCase().includes(term) ||
            i.applicationNumber.toLowerCase().includes(term) ||
            i.premises.toLowerCase().includes(term)
          : true,
      );
  }

  protected readonly inspectorOptions = computed(() =>
    [...new Set(this.admin.inspections().map((i) => i.inspector))].sort().map((value) => ({
      value,
      label: value,
    })),
  );

  protected readonly stats = computed(() => {
    const list = this.admin.inspections();
    return {
      scheduled: list.filter((i) => i.outcome === 'PENDING').length,
      passed: list.filter((i) => i.outcome === 'PASSED' || i.outcome === 'PASSED_WITH_CONDITIONS').length,
      failed: list.filter((i) => i.outcome === 'FAILED').length,
      passRate: (() => {
        const done = list.filter((i) => i.outcome !== 'PENDING');
        if (!done.length) return 0;
        const passed = done.filter((i) => i.outcome !== 'FAILED').length;
        return Math.round((passed / done.length) * 100);
      })(),
    };
  });

  // --- Dialogs --------------------------------------------------------------
  protected readonly reportOpen = signal(false);
  protected readonly assignOpen = signal(false);
  protected readonly working = signal<Inspection | null>(null);
  protected readonly chosenInspector = signal<StaffUser | null>(null);
  protected readonly outcome = signal<Inspection['outcome']>('PASSED');
  protected readonly findings = signal('');
  protected readonly checklist = signal<{ item: string; passed: boolean }[]>([]);

  protected readonly outcomeOptions: { value: Inspection['outcome']; label: string }[] = [
    { value: 'PASSED', label: 'Passed' },
    { value: 'PASSED_WITH_CONDITIONS', label: 'Passed with conditions' },
    { value: 'FAILED', label: 'Failed' },
  ];

  protected openReport(inspection: Inspection): void {
    this.working.set(inspection);
    this.outcome.set(inspection.outcome === 'PENDING' ? 'PASSED' : inspection.outcome);
    this.findings.set(inspection.findings ?? '');
    this.checklist.set(inspection.checklist.map((c) => ({ ...c })));
    this.reportOpen.set(true);
  }

  protected toggleCheck(index: number, value: boolean): void {
    this.checklist.update((list) =>
      list.map((item, i) => (i === index ? { ...item, passed: value } : item)),
    );
  }

  protected saveReport(): void {
    const inspection = this.working();
    const findings = this.findings().trim();

    if (!inspection || findings.length < 8) {
      this.toast.warn(
        'Record what you found',
        'The findings go on the report and are read by the approving officer.',
      );
      return;
    }

    this.admin.recordInspection(inspection, this.outcome(), findings, this.auth.displayName());
    this.reportOpen.set(false);

    this.toast.success(
      'Inspection recorded',
      `${inspection.reference} marked as ${this.outcome().replace(/_/g, ' ').toLowerCase()}.`,
    );
  }

  protected openAssign(inspection: Inspection): void {
    this.working.set(inspection);
    this.chosenInspector.set(null);
    this.assignOpen.set(true);
  }

  protected confirmAssign(): void {
    const inspection = this.working();
    const inspector = this.chosenInspector();

    if (!inspection || !inspector) {
      this.toast.warn('Choose an inspector');
      return;
    }

    this.admin.assignInspector(inspection, inspector, this.auth.displayName());
    this.assignOpen.set(false);

    this.toast.success(
      'Inspector assigned',
      `${inspection.reference} is now with ${inspector.firstName} ${inspector.lastName}.`,
    );
  }

  protected clear(): void {
    this.term.set('');
    this.inspectorFilter.set(null);
  }

  protected outcomeSeverity(outcome: Inspection['outcome']): Severity {
    const map: Record<Inspection['outcome'], Severity> = {
      PENDING: 'warn',
      PASSED: 'success',
      PASSED_WITH_CONDITIONS: 'info',
      FAILED: 'danger',
    };
    return map[outcome];
  }

  protected outcomeLabel(outcome: Inspection['outcome']): string {
    const map: Record<Inspection['outcome'], string> = {
      PENDING: 'Pending',
      PASSED: 'Passed',
      PASSED_WITH_CONDITIONS: 'Passed with conditions',
      FAILED: 'Failed',
    };
    return map[outcome];
  }
}
