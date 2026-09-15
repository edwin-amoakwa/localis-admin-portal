import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
import { AuthService } from '../../core/services/auth.service';
import { AdminService } from '../../core/services/admin.service';
import { PermitQueueService } from '../../core/services/permit-queue.service';
import { ToastService } from '../../core/services/toast.service';

/**
 * Sign-in for Assembly staff against localis-api. The officer signs in with the
 * email address or phone number on their staff account.
 */
@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    CheckboxModule,
    DialogModule,
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class LoginPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly admin = inject(AdminService);
  private readonly permitQueue = inject(PermitQueueService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);

  protected readonly submitting = signal(false);
  protected readonly forgotOpen = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    loginId: ['', Validators.required],
    password: ['', Validators.required],
    remember: [true],
  });

  protected readonly forgotForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  constructor() {
    if (this.route.snapshot.queryParamMap.get('expired')) {
      this.toast.info('Session expired', 'Please sign in again.');
    }
  }

  protected async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);

    try {
      const { loginId, password } = this.form.getRawValue();
      const user = await this.auth.login(loginId, password);

      this.admin.recordAudit(
        `${user.firstName} ${user.lastName}`,
        'User signed in',
        'AUTH',
        user.staffNumber,
        'Successful sign-in to the administration portal.',
      );
      this.permitQueue.refreshCounts();

      this.toast.success('Signed in', `Welcome back, ${user.firstName}.`);

      const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
      await this.router.navigateByUrl(
        returnUrl && returnUrl.startsWith('/admin') ? returnUrl : '/admin/dashboard',
      );
    } catch (error) {
      this.toast.error('Sign-in failed', error);
    } finally {
      this.submitting.set(false);
    }
  }

  protected sendReset(): void {
    if (this.forgotForm.invalid) {
      this.forgotForm.markAllAsTouched();
      return;
    }

    this.forgotOpen.set(false);
    this.toast.info(
      'Reset requested',
      `If a staff account exists for ${this.forgotForm.controls.email.value}, the ICT unit has been notified.`,
    );
    this.forgotForm.reset();
  }
}
