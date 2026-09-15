import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { AvatarModule } from 'primeng/avatar';
import { AdminService } from '../../core/services/admin.service';
import { ToastService } from '../../core/services/toast.service';

/** Public-portal accounts held by the Assembly. */
@Component({
  selector: 'app-citizens',
  imports: [
    FormsModule,
    DatePipe,
    TableModule,
    TagModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    AvatarModule,
  ],
  templateUrl: './citizens.html',
  styleUrls: ['../shared-page.scss'],
})
export class CitizensPage {
  protected readonly admin = inject(AdminService);
  private readonly toast = inject(ToastService);

  protected readonly term = signal('');
  protected readonly typeFilter = signal<string | null>(null);

  protected readonly typeOptions = ['Citizen', 'Business Owner', 'Property Owner', 'Organisation'].map(
    (value) => ({ value, label: value }),
  );

  protected readonly rows = computed(() => {
    const term = this.term().trim().toLowerCase();
    const type = this.typeFilter();

    return this.admin
      .citizens()
      .filter((c) => (type ? c.accountType === type : true))
      .filter((c) =>
        term
          ? c.name.toLowerCase().includes(term) ||
            c.ghanaCardNo.toLowerCase().includes(term) ||
            c.phone.toLowerCase().includes(term) ||
            c.email.toLowerCase().includes(term)
          : true,
      );
  });

  protected readonly stats = computed(() => {
    const list = this.admin.citizens();
    return {
      total: list.length,
      active: list.filter((c) => c.status === 'ACTIVE').length,
      withApplications: list.filter((c) => c.applications > 0).length,
      newThisMonth: list.filter((c) => c.registeredOn >= '2026-07-01').length,
    };
  });

  protected clear(): void {
    this.term.set('');
    this.typeFilter.set(null);
  }

  protected notImplemented(what: string): void {
    this.toast.info('Demonstration build', `${what} is not wired up in this build.`);
  }

  protected initials(name: string): string {
    return name
      .split(' ')
      .slice(0, 2)
      .map((p) => p.charAt(0))
      .join('')
      .toUpperCase();
  }
}
