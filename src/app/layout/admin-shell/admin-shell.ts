import { Component, computed, inject, signal } from '@angular/core';
import { LowerCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';
import { MenuModule } from 'primeng/menu';
import { TooltipModule } from 'primeng/tooltip';
import { DrawerModule } from 'primeng/drawer';
import { TagModule } from 'primeng/tag';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { MenuItem } from 'primeng/api';
import { AdminService } from '../../core/services/admin.service';
import { AuthService } from '../../core/services/auth.service';
import { UiService } from '../../core/services/ui.service';
import { PermitQueueService } from '../../core/services/permit-queue.service';

interface NavItem {
  label: string;
  icon: string;
  path: string;
  badge?: () => number;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

interface SearchHit {
  label: string;
  detail: string;
  icon: string;
  link: string;
}

/**
 * Chrome for the administration portal: top bar with global search and the
 * three overlays staff live in (notifications, messages, tasks), plus the
 * grouped sidebar.
 */
@Component({
  selector: 'app-admin-shell',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    FormsModule,
    LowerCasePipe,
    ButtonModule,
    AvatarModule,
    BadgeModule,
    MenuModule,
    TooltipModule,
    DrawerModule,
    TagModule,
    AutoCompleteModule,
  ],
  templateUrl: './admin-shell.html',
  styleUrl: './admin-shell.scss',
})
export class AdminShell {
  private readonly router = inject(Router);
  protected readonly admin = inject(AdminService);
  protected readonly auth = inject(AuthService);
  protected readonly ui = inject(UiService);
  private readonly permitQueue = inject(PermitQueueService);

  protected readonly user = this.auth.user;
  protected readonly roleName = computed(() => this.auth.role()?.name ?? '');
  /** The signed-in officer's own assembly, falling back to the demo record. */
  protected readonly assemblyName = computed(() => this.auth.assemblyName() || this.admin.assembly.name);

  constructor() {
    // Also covers a restored session after a page refresh.
    this.permitQueue.refreshCounts();
  }

  // --- Overlays -------------------------------------------------------------
  protected readonly notificationsOpen = signal(false);
  protected readonly messagesOpen = signal(false);
  protected readonly tasksOpen = signal(false);

  // --- Global search --------------------------------------------------------
  protected readonly query = signal('');
  protected readonly suggestions = signal<SearchHit[]>([]);

  protected readonly navGroups: NavGroup[] = [
    {
      label: 'Overview',
      items: [{ label: 'Dashboard', icon: 'pi pi-th-large', path: '/admin/dashboard' }],
    },
    {
      label: 'Service delivery',
      items: [
        {
          label: 'Applications',
          icon: 'pi pi-file-edit',
          path: '/admin/applications',
          badge: () => this.permitQueue.actionable(),
        },
        { label: 'Property Rates', icon: 'pi pi-home', path: '/admin/desk/property' },
        { label: 'Building Permits', icon: 'pi pi-building', path: '/admin/desk/building' },
        { label: 'Environmental Health', icon: 'pi pi-shield', path: '/admin/desk/environmental' },
        {
          label: 'Inspections',
          icon: 'pi pi-search',
          path: '/admin/inspections',
          badge: () => this.admin.inspectionsScheduled(),
        },
        { label: 'Workflow', icon: 'pi pi-sitemap', path: '/admin/workflow' },
        { label: 'Documents', icon: 'pi pi-folder-open', path: '/admin/documents' },
      ],
    },
    {
      label: 'Revenue',
      items: [
        { label: 'Revenue Management', icon: 'pi pi-chart-bar', path: '/admin/revenue' },
        { label: 'Payments', icon: 'pi pi-credit-card', path: '/admin/payments' },
        { label: 'Payment Accounts', icon: 'pi pi-wallet', path: '/admin/payment-accounts' },
      ],
    },
    {
      label: 'Registries',
      items: [
        { label: 'Businesses', icon: 'pi pi-building-columns', path: '/admin/businesses' },
        { label: 'Properties', icon: 'pi pi-map', path: '/admin/properties' },
        { label: 'Applicants', icon: 'pi pi-users', path: '/admin/applicants' },
      ],
    },
    {
      label: 'Oversight',
      items: [
        { label: 'Reports', icon: 'pi pi-file', path: '/admin/reports' },
        { label: 'Analytics', icon: 'pi pi-chart-line', path: '/admin/analytics' },
        { label: 'Audit Logs', icon: 'pi pi-history', path: '/admin/audit' },
      ],
    },
    {
      label: 'Administration',
      items: [
        { label: 'Assembly Profile', icon: 'pi pi-id-card', path: '/admin/assembly-profile' },
        { label: 'Announcements', icon: 'pi pi-megaphone', path: '/admin/announcements' },
        { label: 'Users', icon: 'pi pi-user-edit', path: '/admin/users' },
        { label: 'Roles', icon: 'pi pi-lock', path: '/admin/roles' },
        { label: 'Settings', icon: 'pi pi-cog', path: '/admin/settings' },
      ],
    },
  ];

  protected readonly profileMenu: MenuItem[] = [
    { label: 'My profile', icon: 'pi pi-user', command: () => this.router.navigate(['/admin/users']) },
    { label: 'System settings', icon: 'pi pi-cog', command: () => this.router.navigate(['/admin/settings']) },
    { label: 'Audit logs', icon: 'pi pi-history', command: () => this.router.navigate(['/admin/audit']) },
    { separator: true },
    { label: 'Sign out', icon: 'pi pi-sign-out', command: () => this.logout() },
  ];

  /**
   * Global search across applications, businesses, properties and staff.
   * Capped per group so one large registry cannot crowd the others out.
   */
  protected search(event: { query: string }): void {
    const term = event.query.trim().toLowerCase();

    if (!term) {
      this.suggestions.set([]);
      return;
    }

    const hits: SearchHit[] = [];

    for (const application of this.admin.applications()) {
      if (
        application.applicationNumber.toLowerCase().includes(term) ||
        application.applicant.toLowerCase().includes(term) ||
        application.subject.toLowerCase().includes(term)
      ) {
        hits.push({
          label: application.applicationNumber,
          detail: `${application.applicant} · ${application.serviceName}`,
          icon: 'pi pi-file-edit',
          link: `/admin/applications/${application.id}`,
        });
      }
      if (hits.length >= 5) break;
    }

    let count = 0;
    for (const business of this.admin.businesses()) {
      if (
        business.businessName.toLowerCase().includes(term) ||
        business.businessNumber.toLowerCase().includes(term) ||
        business.owner.toLowerCase().includes(term)
      ) {
        hits.push({
          label: business.businessName,
          detail: `${business.businessNumber} · ${business.owner}`,
          icon: 'pi pi-briefcase',
          link: '/admin/businesses',
        });
        if (++count >= 4) break;
      }
    }

    count = 0;
    for (const property of this.admin.properties()) {
      if (
        property.propertyNumber.toLowerCase().includes(term) ||
        property.owner.toLowerCase().includes(term)
      ) {
        hits.push({
          label: property.propertyNumber,
          detail: `${property.owner} · ${property.location}`,
          icon: 'pi pi-home',
          link: '/admin/properties',
        });
        if (++count >= 4) break;
      }
    }

    count = 0;
    for (const staff of this.admin.staff()) {
      if (
        `${staff.firstName} ${staff.lastName}`.toLowerCase().includes(term) ||
        staff.staffNumber.toLowerCase().includes(term)
      ) {
        hits.push({
          label: `${staff.firstName} ${staff.lastName}`,
          detail: `${staff.designation} · ${staff.department}`,
          icon: 'pi pi-user',
          link: '/admin/users',
        });
        if (++count >= 3) break;
      }
    }

    this.suggestions.set(hits);
  }

  protected openHit(hit: SearchHit): void {
    this.query.set('');
    this.suggestions.set([]);
    this.router.navigate([hit.link]);
  }

  protected markNotificationsRead(): void {
    this.admin.markAllNotificationsRead();
  }

  protected markMessagesRead(): void {
    this.admin.markAllMessagesRead();
  }

  protected completeTask(id: string): void {
    this.admin.setTaskStatus(id, 'DONE');
  }

  protected toggleSidebar(): void {
    this.ui.mobileMenuOpen.update((open) => !open);
  }

  protected closeSidebar(): void {
    this.ui.mobileMenuOpen.set(false);
  }

  protected logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
