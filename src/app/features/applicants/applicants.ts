import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Applicant, ApplicantService, ApplicantSource } from '../../core/services/applicant.service';

/** Ghana numbers as people write them: 024 000 0000 or +233 24 000 0000. */
const PHONE_PATTERN = /^(\+233|0)\s?\d{2}\s?\d{3}\s?\d{4}$/;

/**
 * The applicants on this assembly's list. An account is national — registering
 * one here creates it and puts them on the list; an existing account is linked.
 */
@Component({
  selector: 'app-applicants',
  imports: [DatePipe, ReactiveFormsModule, TableModule, TagModule, ButtonModule, InputTextModule, DialogModule],
  templateUrl: './applicants.html',
  styleUrl: './applicants.scss',
})
export class ApplicantsPage {
  private readonly applicants = inject(ApplicantService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  protected readonly assemblyName = this.auth.assemblyName;
  protected readonly rows = signal<Applicant[]>([]);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly search = signal('');

  protected readonly dialogOpen = signal(false);
  /** Set after a registration, so the officer can read the one-time password out. */
  protected readonly registered = signal<Applicant | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    firstname: ['', Validators.required],
    surname: ['', Validators.required],
    phoneNo: ['', [Validators.required, Validators.pattern(PHONE_PATTERN)]],
    emailAddress: ['', Validators.email],
    ghanaCardNo: [''],
    residentialAddress: [''],
    digitalAddress: [''],
  });

  protected readonly withBusinesses = computed(() => this.rows().filter((a) => a.businesses > 0).length);

  constructor() {
    this.load();
  }

  protected async load(): Promise<void> {
    this.loading.set(true);
    try {
      this.rows.set(await this.applicants.list());
    } catch (error) {
      this.toast.error('Could not load applicants', error);
    } finally {
      this.loading.set(false);
    }
  }

  protected add(): void {
    this.registered.set(null);
    this.form.reset();
    this.dialogOpen.set(true);
  }

  protected async save(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.warn('Check the details', 'Fill in the highlighted fields.');
      return;
    }

    this.saving.set(true);
    try {
      const response = await this.applicants.register(this.form.getRawValue());
      this.dialogOpen.set(false);
      this.registered.set(response.data ?? null);
      this.toast.success('Applicant registered', response.message);
      await this.load();
    } catch (error) {
      this.toast.error('Could not register the applicant', error);
    } finally {
      this.saving.set(false);
    }
  }

  protected sourceSeverity(source: ApplicantSource): 'info' | 'success' | 'warn' {
    return { SIGN_UP: 'info' as const, ASSEMBLY: 'success' as const, APPLICATION: 'warn' as const }[source] ?? 'info';
  }
}
