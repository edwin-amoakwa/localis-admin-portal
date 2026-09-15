import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { AdminService } from '../../core/services/admin.service';
import { AuthService } from '../../core/services/auth.service';
import { PermissionLevel, Role } from '../../core/models';
import { ToastService } from '../../core/services/toast.service';

/** Roles and the permission matrix behind them. */
@Component({
  selector: 'app-roles',
  imports: [RouterLink, ButtonModule, TagModule, TooltipModule],
  templateUrl: './roles.html',
  styleUrls: ['../shared-page.scss', './roles.scss'],
})
export class RolesPage {
  protected readonly admin = inject(AdminService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  protected readonly levels: PermissionLevel[] = ['VIEW', 'CREATE', 'EDIT', 'APPROVE', 'DELETE'];

  protected readonly selectedId = signal<string>('BUSINESS_LICENSING_OFFICER');

  protected readonly selected = computed(
    () => this.admin.roles.find((r) => r.id === this.selectedId()) ?? this.admin.roles[0],
  );

  /** Permission modules grouped for the matrix. */
  protected readonly moduleGroups = computed(() => {
    const groups = new Map<string, typeof this.admin.permissionModules>();
    for (const module of this.admin.permissionModules) {
      groups.set(module.group, [...(groups.get(module.group) ?? []), module]);
    }
    return [...groups.entries()].map(([name, modules]) => ({ name, modules }));
  });

  protected has(role: Role, moduleId: string, level: PermissionLevel): boolean {
    return role.permissions[moduleId]?.includes(level) ?? false;
  }

  /** How many of the five levels this role holds in a module. */
  protected levelCount(role: Role, moduleId: string): number {
    return role.permissions[moduleId]?.length ?? 0;
  }

  protected totalPermissions(role: Role): number {
    return Object.values(role.permissions).reduce((sum, levels) => sum + levels.length, 0);
  }

  protected notImplemented(): void {
    this.toast.info(
      'Demonstration build',
      'Editing the permission matrix is not wired up. In the live portal this is restricted to System Administrators.',
    );
  }

  protected levelLabel(level: PermissionLevel): string {
    const map: Record<PermissionLevel, string> = {
      VIEW: 'View',
      CREATE: 'Create',
      EDIT: 'Edit',
      APPROVE: 'Approve',
      DELETE: 'Delete',
    };
    return map[level];
  }
}
