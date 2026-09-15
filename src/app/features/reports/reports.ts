import { Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { AdminService } from '../../core/services/admin.service';
import { ToastService } from '../../core/services/toast.service';

interface ReportDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  tint: string;
  columns: string[];
}

/** Standard reports, with a preview and (mock) export. */
@Component({
  selector: 'app-reports',
  imports: [
    FormsModule,
    CurrencyPipe,
    DatePipe,
    ButtonModule,
    SelectModule,
    DatePickerModule,
    TableModule,
    TagModule,
  ],
  templateUrl: './reports.html',
  styleUrls: ['../shared-page.scss', './reports.scss'],
})
export class ReportsPage {
  protected readonly admin = inject(AdminService);
  private readonly toast = inject(ToastService);

  protected readonly reports: ReportDefinition[] = [
    {
      id: 'revenue',
      name: 'Revenue Report',
      description: 'Collections by head, against target, for the selected period.',
      icon: 'pi pi-chart-bar',
      tint: 'tint-green',
      columns: ['Revenue head', 'Collected', 'Target', 'Achieved', 'Outstanding'],
    },
    {
      id: 'permit',
      name: 'Permit Report',
      description: 'Permits issued, by category and month, with the fee collected.',
      icon: 'pi pi-verified',
      tint: 'tint-blue',
      columns: ['Category', 'Issued', 'Fees collected', 'Average fee'],
    },
    {
      id: 'application',
      name: 'Application Report',
      description: 'Applications received, decided and outstanding, by service and officer.',
      icon: 'pi pi-file-edit',
      tint: 'tint-blue',
      columns: ['Service', 'Received', 'Approved', 'Rejected', 'Open'],
    },
    {
      id: 'inspection',
      name: 'Inspection Report',
      description: 'Inspections carried out, outcomes and re-inspection rate.',
      icon: 'pi pi-search',
      tint: 'tint-gold',
      columns: ['Inspector', 'Carried out', 'Passed', 'Failed', 'Pass rate'],
    },
    {
      id: 'business',
      name: 'Business Report',
      description: 'The business register by category, grade and permit status.',
      icon: 'pi pi-briefcase',
      tint: 'tint-blue',
      columns: ['Category', 'Businesses', 'Valid permits', 'Expired', 'Arrears'],
    },
    {
      id: 'property',
      name: 'Property Report',
      description: 'The valuation list by use and sub-metro, with demand and arrears.',
      icon: 'pi pi-home',
      tint: 'tint-green',
      columns: ['Sub-metro', 'Properties', 'Rateable value', 'Demand', 'Arrears'],
    },
    {
      id: 'citizen',
      name: 'Citizen Report',
      description: 'Portal accounts by type and sub-metro, and how actively they are used.',
      icon: 'pi pi-users',
      tint: 'tint-grey',
      columns: ['Account type', 'Accounts', 'Active', 'Applications filed'],
    },
  ];

  protected readonly selectedId = signal('revenue');
  protected readonly from = signal<Date | null>(new Date(2026, 0, 1));
  protected readonly to = signal<Date | null>(new Date(2026, 6, 31));

  protected readonly selected = computed(
    () => this.reports.find((r) => r.id === this.selectedId()) ?? this.reports[0],
  );

  /**
   * Preview rows for the chosen report, derived from the same signals the rest
   * of the portal reads — so a report never disagrees with the screen it
   * summarises.
   */
  protected readonly preview = computed<Record<string, string | number>[]>(() => {
    switch (this.selectedId()) {
      case 'revenue':
        return this.admin.revenueHeads().map((head) => ({
          'Revenue head': head.name,
          Collected: head.collectedYtd,
          Target: head.target,
          Achieved: `${Math.round((head.collectedYtd / head.target) * 100)}%`,
          Outstanding: head.outstanding,
        }));

      case 'permit': {
        const rows = new Map<string, { issued: number; fees: number }>();
        for (const application of this.admin.applications().filter((a) => a.status === 'ISSUED')) {
          const key = application.serviceName;
          const current = rows.get(key) ?? { issued: 0, fees: 0 };
          rows.set(key, { issued: current.issued + 1, fees: current.fees + application.amountPaid });
        }
        return [...rows.entries()].map(([category, v]) => ({
          Category: category,
          Issued: v.issued,
          'Fees collected': v.fees,
          'Average fee': v.issued ? Math.round(v.fees / v.issued) : 0,
        }));
      }

      case 'application': {
        const rows = new Map<string, { received: number; approved: number; rejected: number; open: number }>();
        for (const application of this.admin.applications()) {
          const key = application.serviceName;
          const current = rows.get(key) ?? { received: 0, approved: 0, rejected: 0, open: 0 };
          current.received += 1;
          if (application.status === 'APPROVED' || application.status === 'ISSUED') current.approved += 1;
          else if (application.status === 'REJECTED') current.rejected += 1;
          else current.open += 1;
          rows.set(key, current);
        }
        return [...rows.entries()].map(([service, v]) => ({
          Service: service,
          Received: v.received,
          Approved: v.approved,
          Rejected: v.rejected,
          Open: v.open,
        }));
      }

      case 'inspection': {
        const rows = new Map<string, { done: number; passed: number; failed: number }>();
        for (const inspection of this.admin.inspections().filter((i) => i.outcome !== 'PENDING')) {
          const current = rows.get(inspection.inspector) ?? { done: 0, passed: 0, failed: 0 };
          current.done += 1;
          if (inspection.outcome === 'FAILED') current.failed += 1;
          else current.passed += 1;
          rows.set(inspection.inspector, current);
        }
        return [...rows.entries()].map(([inspector, v]) => ({
          Inspector: inspector,
          'Carried out': v.done,
          Passed: v.passed,
          Failed: v.failed,
          'Pass rate': `${Math.round((v.passed / v.done) * 100)}%`,
        }));
      }

      case 'business': {
        const rows = new Map<string, { count: number; valid: number; expired: number; arrears: number }>();
        for (const business of this.admin.businesses()) {
          const current = rows.get(business.category) ?? { count: 0, valid: 0, expired: 0, arrears: 0 };
          current.count += 1;
          if (business.permitStatus === 'VALID') current.valid += 1;
          if (business.permitStatus === 'EXPIRED') current.expired += 1;
          current.arrears += business.outstanding;
          rows.set(business.category, current);
        }
        return [...rows.entries()].map(([category, v]) => ({
          Category: category,
          Businesses: v.count,
          'Valid permits': v.valid,
          Expired: v.expired,
          Arrears: v.arrears,
        }));
      }

      case 'property': {
        const rows = new Map<string, { count: number; value: number; demand: number; arrears: number }>();
        for (const property of this.admin.properties()) {
          const current = rows.get(property.subMetro) ?? { count: 0, value: 0, demand: 0, arrears: 0 };
          current.count += 1;
          current.value += property.rateableValue;
          current.demand += property.currentRate;
          current.arrears += property.outstanding;
          rows.set(property.subMetro, current);
        }
        return [...rows.entries()].map(([subMetro, v]) => ({
          'Sub-metro': subMetro,
          Properties: v.count,
          'Rateable value': v.value,
          Demand: v.demand,
          Arrears: v.arrears,
        }));
      }

      case 'citizen': {
        const rows = new Map<string, { count: number; active: number; applications: number }>();
        for (const citizen of this.admin.citizens()) {
          const current = rows.get(citizen.accountType) ?? { count: 0, active: 0, applications: 0 };
          current.count += 1;
          if (citizen.status === 'ACTIVE') current.active += 1;
          current.applications += citizen.applications;
          rows.set(citizen.accountType, current);
        }
        return [...rows.entries()].map(([type, v]) => ({
          'Account type': type,
          Accounts: v.count,
          Active: v.active,
          'Applications filed': v.applications,
        }));
      }

      default:
        return [];
    }
  });

  /** Columns whose values should render as money. */
  private readonly moneyColumns = new Set([
    'Collected', 'Target', 'Outstanding', 'Fees collected', 'Average fee',
    'Arrears', 'Rateable value', 'Demand',
  ]);

  protected isMoney(column: string): boolean {
    return this.moneyColumns.has(column);
  }

  protected export(format: 'PDF' | 'Excel' | 'CSV'): void {
    this.toast.info(
      'Demonstration build',
      `In the live portal this exports the ${this.selected().name} as ${format}.`,
    );
  }
}
