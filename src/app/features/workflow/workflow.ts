import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TimelineModule } from 'primeng/timeline';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../core/services/admin.service';
import { WorkflowStage } from '../../core/models';
import { ToastService } from '../../core/services/toast.service';

/** The permit workflow as a visual pipeline, with SLA configuration. */
@Component({
  selector: 'app-workflow',
  imports: [
    RouterLink,
    FormsModule,
    ButtonModule,
    TagModule,
    TimelineModule,
    TableModule,
    DialogModule,
    InputNumberModule,
    SelectModule,
    ToggleSwitchModule,
  ],
  templateUrl: './workflow.html',
  styleUrls: ['../shared-page.scss', './workflow.scss'],
})
export class WorkflowPage {
  protected readonly admin = inject(AdminService);
  private readonly toast = inject(ToastService);

  protected readonly stages = signal<WorkflowStage[]>([...this.admin.workflowStages]);

  /** The busiest stage — where a bottleneck would show first. */
  protected readonly busiest = computed(() =>
    [...this.stages()]
      .filter((s) => s.id !== 'certificate' && s.id !== 'renewal')
      .sort((a, b) => b.count - a.count)[0],
  );

  protected readonly inFlight = computed(() =>
    this.stages()
      .filter((s) => !['certificate', 'renewal'].includes(s.id))
      .reduce((sum, s) => sum + s.count, 0),
  );

  protected readonly totalSla = computed(() =>
    this.stages()
      .filter((s) => !s.automatic)
      .reduce((sum, s) => sum + s.slaDays, 0),
  );

  // --- Stage configuration --------------------------------------------------
  protected readonly configOpen = signal(false);
  protected readonly working = signal<WorkflowStage | null>(null);
  protected readonly sla = signal(0);
  protected readonly owner = signal('');
  protected readonly automatic = signal(false);

  protected readonly ownerOptions = [
    'System',
    'Applicant',
    'Records Officer',
    'Licensing Officer',
    'Physical Planning Officer',
    'Environmental Health Officer',
    'Inspector',
    'Finance Officer',
    'District Administrator',
  ];

  protected openConfig(stage: WorkflowStage): void {
    this.working.set(stage);
    this.sla.set(stage.slaDays);
    this.owner.set(stage.owner);
    this.automatic.set(stage.automatic);
    this.configOpen.set(true);
  }

  protected saveConfig(): void {
    const stage = this.working();
    if (!stage) {
      return;
    }

    this.stages.update((list) =>
      list.map((s) =>
        s.id === stage.id
          ? { ...s, slaDays: this.sla(), owner: this.owner(), automatic: this.automatic() }
          : s,
      ),
    );

    this.configOpen.set(false);
    this.toast.success(
      'Stage updated',
      `${stage.name} — ${this.sla()} day service standard, owned by ${this.owner()}.`,
    );
  }

  protected barWidth(count: number): number {
    const max = Math.max(...this.stages().map((s) => s.count));
    return max ? Math.round((count / max) * 100) : 0;
  }
}
