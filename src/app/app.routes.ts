import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';

const SUFFIX = ' · ASP Administration';

/**
 * The portal is staff-only, so the index page is the sign-in screen and
 * everything else sits behind it under /admin.
 */
export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: 'Sign in' + SUFFIX,
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login').then((m) => m.LoginPage),
  },
  {
    path: 'login',
    title: 'Sign in' + SUFFIX,
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login').then((m) => m.LoginPage),
  },

  {
    path: 'admin',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/admin-shell/admin-shell').then((m) => m.AdminShell),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        title: 'Dashboard' + SUFFIX,
        loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.DashboardPage),
      },

      // --- Service delivery ---------------------------------------------------
      {
        path: 'applications',
        title: 'Applications' + SUFFIX,
        loadComponent: () =>
          import('./features/permits/permit-queue/permit-queue').then((m) => m.PermitQueuePage),
      },
      {
        path: 'applications/:id',
        title: 'Application' + SUFFIX,
        loadComponent: () =>
          import('./features/permits/permit-detail/permit-detail').then((m) => m.PermitDetailPage),
      },
      // Earlier links to the Business Permits queue.
      { path: 'permits', redirectTo: 'applications' },
      { path: 'permits/:id', redirectTo: 'applications/:id' },
      {
        // One component serves the four service desks; the category comes from
        // the route, so there is a single queue implementation to maintain.
        path: 'desk/:category',
        title: 'Service desk' + SUFFIX,
        loadComponent: () =>
          import('./features/service-desk/service-desk').then((m) => m.ServiceDeskPage),
      },
      {
        path: 'inspections',
        title: 'Inspections' + SUFFIX,
        loadComponent: () =>
          import('./features/inspections/inspections').then((m) => m.InspectionsPage),
      },
      {
        path: 'workflow',
        title: 'Workflow' + SUFFIX,
        loadComponent: () => import('./features/workflow/workflow').then((m) => m.WorkflowPage),
      },
      {
        path: 'documents',
        title: 'Documents' + SUFFIX,
        loadComponent: () => import('./features/documents/documents').then((m) => m.DocumentsPage),
      },

      // --- Revenue -----------------------------------------------------------
      {
        path: 'revenue',
        title: 'Revenue management' + SUFFIX,
        loadComponent: () => import('./features/revenue/revenue').then((m) => m.RevenuePage),
      },
      {
        path: 'payments',
        title: 'Payments' + SUFFIX,
        loadComponent: () => import('./features/payments/payments').then((m) => m.PaymentsPage),
      },

      // --- Registries ---------------------------------------------------------
      {
        path: 'businesses',
        title: 'Business registry' + SUFFIX,
        loadComponent: () =>
          import('./features/businesses/businesses').then((m) => m.BusinessesPage),
      },
      {
        path: 'properties',
        title: 'Property registry' + SUFFIX,
        loadComponent: () =>
          import('./features/properties/properties').then((m) => m.PropertiesPage),
      },
      {
        path: 'citizens',
        title: 'Citizens' + SUFFIX,
        loadComponent: () => import('./features/citizens/citizens').then((m) => m.CitizensPage),
      },

      // --- Oversight ----------------------------------------------------------
      {
        path: 'reports',
        title: 'Reports' + SUFFIX,
        loadComponent: () => import('./features/reports/reports').then((m) => m.ReportsPage),
      },
      {
        path: 'analytics',
        title: 'Analytics' + SUFFIX,
        loadComponent: () => import('./features/analytics/analytics').then((m) => m.AnalyticsPage),
      },
      {
        path: 'audit',
        title: 'Audit logs' + SUFFIX,
        loadComponent: () => import('./features/audit/audit').then((m) => m.AuditPage),
      },

      // --- Administration -----------------------------------------------------
      {
        path: 'announcements',
        title: 'Announcements' + SUFFIX,
        loadComponent: () =>
          import('./features/announcements/announcements').then((m) => m.AnnouncementsPage),
      },
      {
        path: 'users',
        title: 'Users' + SUFFIX,
        loadComponent: () => import('./features/users/users').then((m) => m.UsersPage),
      },
      {
        path: 'roles',
        title: 'Roles & permissions' + SUFFIX,
        loadComponent: () => import('./features/roles/roles').then((m) => m.RolesPage),
      },
      {
        path: 'settings',
        title: 'System settings' + SUFFIX,
        loadComponent: () => import('./features/settings/settings').then((m) => m.SettingsPage),
      },
    ],
  },

  { path: '**', redirectTo: '' },
];
