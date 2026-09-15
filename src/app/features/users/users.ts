import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';
import { AvatarModule } from 'primeng/avatar';
import { TabsModule } from 'primeng/tabs';
import { ConfirmationService } from 'primeng/api';
import { AdminService } from '../../core/services/admin.service';
import { AuthService } from '../../core/services/auth.service';
import { ROLE_LABEL } from '../../core/data/reference.data';
import { Severity } from '../../core/services/ui.service';
import { RoleId, StaffUser } from '../../core/models';
import { ToastService } from '../../core/services/toast.service';

/** Staff accounts, departments and the actions an administrator takes on them. */
@Component({
  selector: 'app-users',
  imports: [
    RouterLink,
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    TagModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    DialogModule,
    AvatarModule,
    TabsModule,
  ],
  templateUrl: './users.html',
  styleUrls: ['../shared-page.scss', './users.scss'],
})
export class UsersPage {
  private readonly fb = inject(FormBuilder);
  protected readonly admin = inject(AdminService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmationService);

  protected readonly term = signal('');
  protected readonly roleFilter = signal<RoleId | null>(null);
  protected readonly departmentFilter = signal<string | null>(null);

  protected readonly roleOptions = this.admin.roles.map((r) => ({ value: r.id, label: r.name }));
  protected readonly departmentOptions = this.admin.departments.map((d) => ({
    value: d.name,
    label: d.name,
  }));

  protected readonly rows = computed(() => {
    const term = this.term().trim().toLowerCase();
    const role = this.roleFilter();
    const department = this.departmentFilter();

    return this.admin
      .staff()
      .filter((s) => (role ? s.role === role : true))
      .filter((s) => (department ? s.department === department : true))
      .filter((s) =>
        term
          ? `${s.firstName} ${s.lastName}`.toLowerCase().includes(term) ||
            s.email.toLowerCase().includes(term) ||
            s.staffNumber.toLowerCase().includes(term) ||
            s.designation.toLowerCase().includes(term)
          : true,
      );
  });

  protected readonly stats = computed(() => {
    const list = this.admin.staff();
    return {
      total: list.length,
      active: list.filter((s) => s.status === 'ACTIVE').length,
      suspended: list.filter((s) => s.status === 'SUSPENDED').length,
      pending: list.filter((s) => s.status === 'PENDING').length,
    };
  });

  // --- Create user ----------------------------------------------------------
  protected readonly createOpen = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', Validators.required],
    role: ['CUSTOMER_SERVICE_OFFICER' as RoleId, Validators.required],
    department: ['Records & Administration', Validators.required],
    designation: ['', Validators.required],
  });

  protected openCreate(): void {
    this.form.reset({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      role: 'CUSTOMER_SERVICE_OFFICER',
      department: 'Records & Administration',
      designation: '',
    });
    this.createOpen.set(true);
  }

  protected createUser(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.warn('Check the details', 'Every field is needed to create a staff account.');
      return;
    }

    const value = this.form.getRawValue();
    const created = this.admin.createStaff(
      { ...value, status: 'PENDING' },
      this.auth.displayName(),
    );

    this.createOpen.set(false);
    this.toast.success(
      'Staff account created',
      `${created.firstName} ${created.lastName} — ${created.staffNumber}. They must be activated before signing in.`,
    );
  }

  protected setStatus(user: StaffUser, status: StaffUser['status']): void {
    const verb = status === 'ACTIVE' ? 'Activate' : 'Deactivate';

    this.confirm.confirm({
      header: `${verb} this account?`,
      message: `${user.firstName} ${user.lastName} (${user.staffNumber}). This is recorded in the audit log.`,
      icon: status === 'ACTIVE' ? 'pi pi-check-circle' : 'pi pi-ban',
      acceptLabel: verb,
      rejectLabel: 'Cancel',
      accept: () => {
        this.admin.setStaffStatus(user.id, status, this.auth.displayName());
        this.toast.success(`Account ${status.toLowerCase()}`, `${user.firstName} ${user.lastName}.`);
      },
    });
  }

  protected resetPassword(user: StaffUser): void {
    this.confirm.confirm({
      header: 'Send a password reset?',
      message: `A reset link will be sent to ${user.email}.`,
      icon: 'pi pi-key',
      acceptLabel: 'Send reset',
      rejectLabel: 'Cancel',
      accept: () => {
        this.admin.resetStaffPassword(user.id, this.auth.displayName());
        this.toast.success('Reset sent', `A reset link has been issued to ${user.email}.`);
      },
    });
  }

  protected clear(): void {
    this.term.set('');
    this.roleFilter.set(null);
    this.departmentFilter.set(null);
  }

  protected roleName(role: RoleId): string {
    return ROLE_LABEL[role];
  }

  protected statusSeverity(status: StaffUser['status']): Severity {
    const map: Record<StaffUser['status'], Severity> = {
      ACTIVE: 'success',
      SUSPENDED: 'danger',
      PENDING: 'warn',
    };
    return map[status];
  }

  protected invalid(control: keyof typeof this.form.controls): boolean {
    const c = this.form.controls[control];
    return c.touched && c.invalid;
  }
}
