import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { DialogModule } from 'primeng/dialog';
import { ConfirmationService } from 'primeng/api';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import {
  PaymentAccount,
  PaymentAccountService,
  PaymentAccountType,
} from '../../core/services/payment-account.service';

/**
 * The accounts this assembly collects money into. Applicants see the active
 * ones as "payment means" when they pay.
 */
@Component({
  selector: 'app-payment-accounts',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    TagModule,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    SelectModule,
    ToggleSwitchModule,
    DialogModule,
  ],
  templateUrl: './payment-accounts.html',
  styleUrl: './payment-accounts.scss',
})
export class PaymentAccountsPage {
  private readonly accounts = inject(PaymentAccountService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmationService);
  private readonly fb = inject(FormBuilder);

  protected readonly assemblyName = this.auth.assemblyName;
  protected readonly rows = signal<PaymentAccount[]>([]);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);

  protected readonly editing = signal<PaymentAccount | null>(null);
  protected readonly dialogOpen = signal(false);

  protected readonly types: { value: PaymentAccountType; label: string }[] = [
    { value: 'MOBILE_MONEY', label: 'Mobile Money' },
    { value: 'BANK', label: 'Bank Account' },
    { value: 'CASH', label: 'Cash Office' },
  ];

  protected readonly form = this.fb.nonNullable.group({
    accountType: ['MOBILE_MONEY' as PaymentAccountType, Validators.required],
    accountName: ['', Validators.required],
    accountNumber: [''],
    providerName: [''],
    instructions: [''],
    active: [true],
  });

  /** A cash office has no account number to quote. */
  protected readonly needsNumber = computed(() => this.form.controls.accountType.value !== 'CASH');

  protected readonly providerLabel = computed(() =>
    this.form.controls.accountType.value === 'BANK' ? 'Bank and branch' : 'Network or office',
  );

  constructor() {
    this.form.controls.accountType.valueChanges.subscribe((type) => {
      const control = this.form.controls.accountNumber;
      control.setValidators(type === 'CASH' ? null : Validators.required);
      control.updateValueAndValidity();
    });
    this.form.controls.accountNumber.setValidators(Validators.required);
    this.load();
  }

  protected async load(): Promise<void> {
    this.loading.set(true);
    try {
      this.rows.set(await this.accounts.list());
    } catch (error) {
      this.toast.error('Could not load payment accounts', error);
    } finally {
      this.loading.set(false);
    }
  }

  protected add(): void {
    this.editing.set(null);
    this.form.reset({
      accountType: 'MOBILE_MONEY',
      accountName: this.assemblyName(),
      accountNumber: '',
      providerName: '',
      instructions: '',
      active: true,
    });
    this.dialogOpen.set(true);
  }

  protected edit(account: PaymentAccount): void {
    this.editing.set(account);
    this.form.reset({
      accountType: account.accountType,
      accountName: account.accountName,
      accountNumber: account.accountNumber ?? '',
      providerName: account.providerName ?? '',
      instructions: account.instructions ?? '',
      active: account.active,
    });
    this.dialogOpen.set(true);
  }

  protected async save(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.warn('Check the details', 'Fill in the highlighted fields.');
      return;
    }

    const account = this.editing();
    this.saving.set(true);
    try {
      const response = account
        ? await this.accounts.update(account.id, this.form.getRawValue())
        : await this.accounts.create(this.form.getRawValue());
      this.dialogOpen.set(false);
      this.toast.success(account ? 'Payment account updated' : 'Payment account added', response.message);
      await this.load();
    } catch (error) {
      this.toast.error('Could not save the payment account', error);
    } finally {
      this.saving.set(false);
    }
  }

  protected toggleActive(account: PaymentAccount, active: boolean): void {
    this.saving.set(true);
    this.accounts
      .update(account.id, { ...account, active })
      .then(() => {
        this.toast.success(
          active ? 'Payment account switched on' : 'Payment account switched off',
          active
            ? `${account.accountName} is offered to applicants again.`
            : `${account.accountName} is no longer offered to applicants.`,
        );
        return this.load();
      })
      .catch((error) => this.toast.error('Could not change the payment account', error))
      .finally(() => this.saving.set(false));
  }

  protected remove(account: PaymentAccount): void {
    this.confirm.confirm({
      header: 'Remove this payment account?',
      message: `${account.accountTypeLabel} — ${account.accountName}. Applicants will no longer see it. Payments already received keep their record.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Remove',
      rejectLabel: 'Cancel',
      accept: async () => {
        try {
          const response = await this.accounts.remove(account.id);
          this.toast.success('Payment account removed', response.message);
          await this.load();
        } catch (error) {
          this.toast.error('Could not remove the payment account', error);
        }
      },
    });
  }

  protected icon(type: PaymentAccountType): string {
    return { MOBILE_MONEY: 'pi pi-mobile', BANK: 'pi pi-building-columns', CASH: 'pi pi-wallet' }[type];
  }
}
