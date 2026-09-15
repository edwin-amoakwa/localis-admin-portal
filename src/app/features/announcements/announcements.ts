import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { ConfirmationService } from 'primeng/api';
import { AdminService } from '../../core/services/admin.service';
import { AuthService } from '../../core/services/auth.service';
import { Severity } from '../../core/services/ui.service';
import { Announcement } from '../../core/models';
import { ToastService } from '../../core/services/toast.service';

/** Draft, publish and archive public announcements. */
@Component({
  selector: 'app-announcements',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    DatePipe,
    ButtonModule,
    TagModule,
    TableModule,
    DialogModule,
    InputTextModule,
    TextareaModule,
    SelectModule,
    MultiSelectModule,
  ],
  templateUrl: './announcements.html',
  styleUrls: ['../shared-page.scss', './announcements.scss'],
})
export class AnnouncementsPage {
  private readonly fb = inject(FormBuilder);
  protected readonly admin = inject(AdminService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmationService);

  protected readonly statusFilter = signal<Announcement['status'] | null>(null);

  protected readonly statusOptions: { value: Announcement['status']; label: string }[] = [
    { value: 'DRAFT', label: 'Draft' },
    { value: 'PUBLISHED', label: 'Published' },
    { value: 'ARCHIVED', label: 'Archived' },
  ];

  protected readonly audiences = [
    'All users',
    'Citizens',
    'Businesses',
    'Property owners',
    'Traders',
    'Assembly staff',
  ];

  protected readonly channels = ['Portal', 'SMS', 'Email'];

  protected readonly rows = computed(() => {
    const status = this.statusFilter();
    return this.admin
      .announcements()
      .filter((a) => (status ? a.status === status : true));
  });

  protected readonly stats = computed(() => {
    const list = this.admin.announcements();
    return {
      published: list.filter((a) => a.status === 'PUBLISHED').length,
      drafts: list.filter((a) => a.status === 'DRAFT').length,
      archived: list.filter((a) => a.status === 'ARCHIVED').length,
      views: list.reduce((sum, a) => sum + a.views, 0),
    };
  });

  // --- Editor ---------------------------------------------------------------
  protected readonly editorOpen = signal(false);
  protected readonly editing = signal<Announcement | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(6)]],
    body: ['', [Validators.required, Validators.minLength(20)]],
    audience: ['All users', Validators.required],
    channel: [['Portal'] as string[], Validators.required],
  });

  protected newAnnouncement(): void {
    this.editing.set(null);
    this.form.reset({ title: '', body: '', audience: 'All users', channel: ['Portal'] });
    this.editorOpen.set(true);
  }

  protected edit(announcement: Announcement): void {
    this.editing.set(announcement);
    this.form.reset({
      title: announcement.title,
      body: announcement.body,
      audience: announcement.audience,
      channel: [...announcement.channel],
    });
    this.editorOpen.set(true);
  }

  protected save(publish: boolean): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.warn(
        'Check the announcement',
        'A title and a body of at least a couple of sentences are required.',
      );
      return;
    }

    const value = this.form.getRawValue();
    const existing = this.editing();

    const announcement: Announcement = {
      id: existing?.id ?? `ann-${Math.random().toString(36).slice(2, 8)}`,
      title: value.title,
      body: value.body,
      audience: value.audience,
      channel: value.channel,
      status: publish ? 'PUBLISHED' : (existing?.status ?? 'DRAFT'),
      publishedOn: publish ? new Date().toISOString().slice(0, 10) : existing?.publishedOn,
      author: existing?.author ?? this.auth.displayName(),
      views: existing?.views ?? 0,
    };

    this.admin.saveAnnouncement(announcement);
    this.admin.recordAudit(
      this.auth.displayName(),
      existing ? 'Announcement updated' : 'Announcement created',
      'SETTINGS',
      announcement.title,
      publish ? 'Saved and published.' : 'Saved as a draft.',
    );

    this.editorOpen.set(false);
    this.toast.success(publish ? 'Announcement published' : 'Draft saved', announcement.title);
  }

  protected setStatus(announcement: Announcement, status: Announcement['status']): void {
    const verb = status === 'PUBLISHED' ? 'Publish' : status === 'ARCHIVED' ? 'Archive' : 'Unpublish';

    this.confirm.confirm({
      header: `${verb} this announcement?`,
      message: announcement.title,
      icon: status === 'ARCHIVED' ? 'pi pi-inbox' : 'pi pi-megaphone',
      acceptLabel: verb,
      rejectLabel: 'Cancel',
      accept: () => {
        this.admin.setAnnouncementStatus(announcement.id, status, this.auth.displayName());
        this.toast.success(`Announcement ${status.toLowerCase()}`, announcement.title);
      },
    });
  }

  protected statusSeverity(status: Announcement['status']): Severity {
    const map: Record<Announcement['status'], Severity> = {
      DRAFT: 'secondary',
      PUBLISHED: 'success',
      ARCHIVED: 'warn',
    };
    return map[status];
  }

  protected invalid(control: 'title' | 'body'): boolean {
    const c = this.form.controls[control];
    return c.touched && c.invalid;
  }
}
