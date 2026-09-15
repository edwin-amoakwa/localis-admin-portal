import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Toast } from 'primeng/toast';
import { ConfirmDialog } from 'primeng/confirmdialog';

/**
 * Application root. Toast and ConfirmDialog live here so any feature can raise
 * one through MessageService / ConfirmationService without mounting its own.
 */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Toast, ConfirmDialog],
  template: `
    <a class="skip-link" href="#main-content">Skip to main content</a>
    <p-toast position="top-right" [breakpoints]="{ '640px': { width: '92vw', right: '4vw' } }" />
    <p-confirmdialog [style]="{ width: '30rem' }" />
    <router-outlet />
  `,
})
export class App {}
