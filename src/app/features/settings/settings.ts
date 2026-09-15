import { Component, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { TabsModule } from 'primeng/tabs';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { DialogModule } from 'primeng/dialog';
import { AdminService } from '../../core/services/admin.service';
import { AuthService } from '../../core/services/auth.service';
import { UiService } from '../../core/services/ui.service';
import { FeeScheduleLine, MessageTemplate } from '../../core/models';
import { ToastService } from '../../core/services/toast.service';

/** Assembly information, fee schedule, templates, branding and preferences. */
@Component({
  selector: 'app-settings',
  imports: [
    RouterLink,
    FormsModule,
    ReactiveFormsModule,
    CurrencyPipe,
    ButtonModule,
    TagModule,
    TableModule,
    TabsModule,
    InputTextModule,
    InputNumberModule,
    TextareaModule,
    SelectModule,
    ToggleSwitchModule,
    DialogModule,
  ],
  templateUrl: './settings.html',
  styleUrls: ['../shared-page.scss', './settings.scss'],
})
export class SettingsPage {
  private readonly fb = inject(FormBuilder);
  protected readonly admin = inject(AdminService);
  protected readonly ui = inject(UiService);
  protected readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  protected readonly savingProfile = signal(false);

  // --- Assembly information -------------------------------------------------
  protected readonly assemblyForm = this.fb.nonNullable.group({
    name: [this.admin.assembly.name, Validators.required],
    code: [this.admin.assembly.code, Validators.required],
    type: [this.admin.assembly.type, Validators.required],
    region: [this.admin.assembly.region, Validators.required],
    capital: [this.admin.assembly.capital],
    postalAddress: [this.admin.assembly.postalAddress],
    physicalAddress: [this.admin.assembly.physicalAddress],
    phone: [this.admin.assembly.phone],
    email: [this.admin.assembly.email, Validators.email],
    website: [this.admin.assembly.website],
    coordinatingDirector: [this.admin.assembly.coordinatingDirector],
    bankName: [this.admin.assembly.bankName],
    bankAccount: [this.admin.assembly.bankAccount],
    momoNumber: [this.admin.assembly.momoNumber],
    permitPrefix: [this.admin.assembly.permitPrefix],
  });

  protected readonly inspectionRequired = signal(this.admin.assembly.inspectionRequired);
  protected readonly paymentBeforeIssue = signal(this.admin.assembly.paymentBeforeIssue);

  protected readonly assemblyTypes = ['Metropolitan Assembly', 'Municipal Assembly', 'District Assembly'];

  protected saveAssembly(): void {
    if (this.assemblyForm.invalid) {
      this.assemblyForm.markAllAsTouched();
      return;
    }

    this.savingProfile.set(true);

    setTimeout(() => {
      this.savingProfile.set(false);
      this.admin.recordAudit(
        this.auth.displayName(),
        'Assembly information updated',
        'SETTINGS',
        this.assemblyForm.controls.name.value,
        'Assembly profile and payment details amended.',
      );
      this.toast.success('Settings saved', 'Assembly information updated.');
    }, 600);
  }

  protected toggleRule(rule: 'inspection' | 'payment', value: boolean): void {
    if (rule === 'inspection') {
      this.inspectionRequired.set(value);
    } else {
      this.paymentBeforeIssue.set(value);
    }

    this.admin.recordAudit(
      this.auth.displayName(),
      'Workflow rule changed',
      'SETTINGS',
      rule === 'inspection' ? 'Inspection required' : 'Payment before issue',
      `Set to ${value ? 'on' : 'off'}.`,
    );

    this.toast.success('Rule updated');
  }

  // --- Fee schedule ---------------------------------------------------------
  protected readonly feeOpen = signal(false);
  protected readonly editingFee = signal<FeeScheduleLine | null>(null);

  protected readonly feeForm = this.fb.nonNullable.group({
    category: ['', Validators.required],
    grade: ['Grade B', Validators.required],
    year: [2026, Validators.required],
    permitFee: [0, [Validators.required, Validators.min(0)]],
    registrationFee: [0],
    inspectionFee: [0],
    penalty: [0],
  });

  protected readonly grades = ['Grade A', 'Grade B', 'Grade C', 'Grade D', 'Flat Rate'];

  protected openFee(line?: FeeScheduleLine): void {
    this.editingFee.set(line ?? null);
    this.feeForm.reset(
      line
        ? {
            category: line.category,
            grade: line.grade,
            year: line.year,
            permitFee: line.permitFee,
            registrationFee: line.registrationFee,
            inspectionFee: line.inspectionFee,
            penalty: line.penalty,
          }
        : {
            category: '',
            grade: 'Grade B',
            year: 2026,
            permitFee: 0,
            registrationFee: 0,
            inspectionFee: 0,
            penalty: 0,
          },
    );
    this.feeOpen.set(true);
  }

  protected saveFee(): void {
    if (this.feeForm.invalid) {
      this.feeForm.markAllAsTouched();
      this.toast.warn('Check the fee line', 'A category and a permit fee are required.');
      return;
    }

    const value = this.feeForm.getRawValue();
    const existing = this.editingFee();

    this.admin.saveFeeLine(
      {
        id: existing?.id ?? `fee-${Math.random().toString(36).slice(2, 8)}`,
        active: existing?.active ?? true,
        ...value,
      },
      this.auth.displayName(),
    );

    this.feeOpen.set(false);
    this.toast.success(
      existing ? 'Fee line updated' : 'Fee line added',
      `${value.category} · ${value.grade} · ${value.year}`,
    );
  }

  // --- Templates ------------------------------------------------------------
  protected readonly templateOpen = signal(false);
  protected readonly viewingTemplate = signal<MessageTemplate | null>(null);

  protected viewTemplate(template: MessageTemplate): void {
    this.viewingTemplate.set(template);
    this.templateOpen.set(true);
  }

  protected notImplemented(what: string): void {
    this.toast.info('Demonstration build', `${what} is not wired up in this build.`);
  }
}
