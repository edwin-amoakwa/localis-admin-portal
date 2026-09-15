import { Component, computed, inject, input, model } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { DialogModule } from 'primeng/dialog';

/**
 * Shows a server-generated PDF in a dialog — the browser's own PDF viewer
 * handles zoom, download and print. Pair with ReportData.
 */
@Component({
  selector: 'app-report-viewer',
  imports: [DialogModule],
  template: `
    <p-dialog
      [header]="title()"
      [visible]="visible()"
      (visibleChange)="visible.set($event)"
      [modal]="true"
      [maximizable]="true"
      [draggable]="false"
      [style]="{ width: '90vw', maxWidth: '1000px' }"
      [breakpoints]="{ '960px': '98vw' }"
    >
      @if (safeUrl(); as url) {
        <iframe class="report-viewer-frame" [src]="url" [title]="title()"></iframe>
      }
    </p-dialog>
  `,
  styles: `
    .report-viewer-frame {
      display: block;
      width: 100%;
      height: 78vh;
      border: 0;
      border-radius: 6px;
      background: #525659;
    }
  `,
})
export class ReportViewer {
  private readonly sanitizer = inject(DomSanitizer);

  readonly title = input('Report Viewer');
  readonly pdfUrl = input<string | null>(null);
  readonly visible = model(false);

  protected readonly safeUrl = computed(() => {
    const url = this.pdfUrl();
    return url ? this.sanitizer.bypassSecurityTrustResourceUrl(url) : null;
  });
}
