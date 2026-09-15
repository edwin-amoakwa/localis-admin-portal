import { Injectable, inject } from '@angular/core';
import { MessageService } from 'primeng/api';
import { apiErrorMessage } from './api.service';

/** One-line toasts instead of repeating `messages.add({ severity, summary, detail, life })`. */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly messages = inject(MessageService);

  success(summary: string, detail?: string): void {
    this.messages.add({ severity: 'success', summary, detail, life: 4500 });
  }

  info(summary: string, detail?: string): void {
    this.messages.add({ severity: 'info', summary, detail, life: 4500 });
  }

  warn(summary: string, detail?: string): void {
    this.messages.add({ severity: 'warn', summary, detail, life: 4500 });
  }

  /** `detail` may be a message or a caught error, in which case the server's message is shown. */
  error(summary: string, detail?: unknown): void {
    this.messages.add({
      severity: 'error',
      summary,
      detail: typeof detail === 'string' ? detail : detail === undefined ? undefined : apiErrorMessage(detail),
      life: 6000,
    });
  }
}
