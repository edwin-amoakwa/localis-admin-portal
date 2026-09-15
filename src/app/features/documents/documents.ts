import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { FileUploadModule } from 'primeng/fileupload';
import { DialogModule } from 'primeng/dialog';
import { AdminService } from '../../core/services/admin.service';
import { DocumentKind, StoredDocument } from '../../core/models';
import { ToastService } from '../../core/services/toast.service';

/** The document store: permits, certificates, receipts, reports and letters. */
@Component({
  selector: 'app-documents',
  imports: [
    FormsModule,
    DatePipe,
    TableModule,
    TagModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    FileUploadModule,
    DialogModule,
  ],
  templateUrl: './documents.html',
  styleUrls: ['../shared-page.scss', './documents.scss'],
})
export class DocumentsPage {
  protected readonly admin = inject(AdminService);
  private readonly toast = inject(ToastService);

  protected readonly term = signal('');
  protected readonly kindFilter = signal<DocumentKind | null>(null);
  protected readonly uploadOpen = signal(false);

  protected readonly kinds: { value: DocumentKind; label: string; icon: string; tint: string }[] = [
    { value: 'PERMIT', label: 'Permits', icon: 'pi pi-verified', tint: 'tint-blue' },
    { value: 'CERTIFICATE', label: 'Certificates', icon: 'pi pi-bookmark', tint: 'tint-green' },
    { value: 'RECEIPT', label: 'Receipts', icon: 'pi pi-receipt', tint: 'tint-grey' },
    { value: 'INSPECTION_REPORT', label: 'Inspection reports', icon: 'pi pi-search', tint: 'tint-gold' },
    { value: 'ATTACHMENT', label: 'Application attachments', icon: 'pi pi-paperclip', tint: 'tint-grey' },
    { value: 'LETTER', label: 'Letters', icon: 'pi pi-envelope', tint: 'tint-blue' },
  ];

  protected readonly kindOptions = this.kinds.map((k) => ({ value: k.value, label: k.label }));

  protected readonly rows = computed(() => {
    const term = this.term().trim().toLowerCase();
    const kind = this.kindFilter();

    return this.admin
      .documents()
      .filter((d) => (kind ? d.kind === kind : true))
      .filter((d) =>
        term
          ? d.name.toLowerCase().includes(term) ||
            d.reference.toLowerCase().includes(term) ||
            d.relatedTo.toLowerCase().includes(term)
          : true,
      )
      .sort((a, b) => b.issuedDate.localeCompare(a.issuedDate));
  });

  /** Count per kind, for the filter cards. */
  protected readonly counts = computed(() => {
    const counts = new Map<DocumentKind, number>();
    for (const doc of this.admin.documents()) {
      counts.set(doc.kind, (counts.get(doc.kind) ?? 0) + 1);
    }
    return counts;
  });

  protected countFor(kind: DocumentKind): number {
    return this.counts().get(kind) ?? 0;
  }

  protected kindMeta(kind: DocumentKind) {
    return this.kinds.find((k) => k.value === kind)!;
  }

  protected toggleKind(kind: DocumentKind): void {
    this.kindFilter.update((current) => (current === kind ? null : kind));
  }

  protected clear(): void {
    this.term.set('');
    this.kindFilter.set(null);
  }

  protected download(doc: StoredDocument): void {
    this.toast.info(
      'Demonstration build',
      `“${doc.name}” is sample data. In the live portal this downloads a PDF.`,
    );
  }

  /** Mock upload — the file never leaves the browser. */
  protected onUpload(event: { files: File[] }): void {
    this.uploadOpen.set(false);
    this.toast.success(
      'Upload simulated',
      `${event.files.length} file(s) accepted. Nothing is stored in this build.`,
    );
  }
}
