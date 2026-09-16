import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { RouterLink } from '@angular/router';
import { ConfirmationService } from 'primeng/api';
import { ToastService } from '../../core/services/toast.service';
import {
  AssemblyProfile,
  AssemblyProfileService,
  AssemblyTypeName,
  LookupRegion,
} from '../../core/services/assembly-profile.service';

/** The assembly's own record: its details, and the signature printed on permits. */
@Component({
  selector: 'app-assembly-profile',
  imports: [RouterLink, ReactiveFormsModule, ButtonModule, InputTextModule, SelectModule, ToggleSwitchModule],
  templateUrl: './assembly-profile.html',
  styleUrl: './assembly-profile.scss',
})
export class AssemblyProfilePage {
  private readonly profiles = inject(AssemblyProfileService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmationService);
  private readonly fb = inject(FormBuilder);

  protected readonly profile = signal<AssemblyProfile | null>(null);
  protected readonly regions = signal<LookupRegion[]>([]);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly uploading = signal(false);

  protected readonly types: { value: AssemblyTypeName; label: string }[] = [
    { value: 'METROPOLITAN', label: 'Metropolitan Assembly' },
    { value: 'MUNICIPAL', label: 'Municipal Assembly' },
    { value: 'DISTRICT', label: 'District Assembly' },
  ];

  protected readonly form = this.fb.nonNullable.group({
    assemblyCode: ['', [Validators.required, Validators.maxLength(10)]],
    assemblyType: ['DISTRICT' as AssemblyTypeName, Validators.required],
    regionId: [''],
    capital: [''],
    physicalAddress: [''],
    postalAddress: [''],
    contactNo: [''],
    emailAddress: ['', Validators.email],
    website: [''],
    chiefExecutive: [''],
    coordinatingDirector: [''],
    bankName: [''],
    bankAccountNo: [''],
    momoNumber: [''],
    permitNumberPrefix: [''],
    inspectionRequired: [true],
    paymentBeforeIssue: [true],
  });

  constructor() {
    this.load();
    this.profiles
      .regions()
      .then((regions) => this.regions.set(regions))
      .catch(() => this.regions.set([]));
  }

  protected async load(): Promise<void> {
    this.loading.set(true);
    try {
      this.apply(await this.profiles.profile());
    } catch (error) {
      this.toast.error('Could not load the assembly profile', error);
    } finally {
      this.loading.set(false);
    }
  }

  private apply(profile: AssemblyProfile): void {
    this.profile.set(profile);
    this.form.reset({
      assemblyCode: profile.assemblyCode ?? '',
      assemblyType: profile.assemblyType ?? 'DISTRICT',
      regionId: profile.regionId ?? '',
      capital: profile.capital ?? '',
      physicalAddress: profile.physicalAddress ?? '',
      postalAddress: profile.postalAddress ?? '',
      contactNo: profile.contactNo ?? '',
      emailAddress: profile.emailAddress ?? '',
      website: profile.website ?? '',
      chiefExecutive: profile.chiefExecutive ?? '',
      coordinatingDirector: profile.coordinatingDirector ?? '',
      bankName: profile.bankName ?? '',
      bankAccountNo: profile.bankAccountNo ?? '',
      momoNumber: profile.momoNumber ?? '',
      permitNumberPrefix: profile.permitNumberPrefix ?? '',
      inspectionRequired: profile.inspectionRequired,
      paymentBeforeIssue: profile.paymentBeforeIssue,
    });
  }

  protected async save(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.warn('Check the details', 'Fill in the highlighted fields.');
      return;
    }

    this.saving.set(true);
    try {
      const response = await this.profiles.update(this.form.getRawValue());
      this.apply(response.data!);
      this.toast.success('Assembly profile saved', response.message);
    } catch (error) {
      this.toast.error('Could not save the assembly profile', error);
    } finally {
      this.saving.set(false);
    }
  }

  /** Reads the chosen image in the browser and posts it base64-encoded. */
  protected async onSignatureChosen(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';

    if (!file) {
      return;
    }
    if (!file.type.startsWith('image/')) {
      this.toast.warn('Choose an image', 'The signature must be a PNG or JPG image.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      this.toast.warn('That image is too large', 'Use an image under 2MB.');
      return;
    }

    this.uploading.set(true);
    try {
      const data = await this.readAsBase64(file);
      const response = await this.profiles.uploadSignature({
        data,
        contentType: file.type,
        fileName: file.name,
      });
      this.apply(response.data!);
      this.toast.success('Signature uploaded', response.message);
    } catch (error) {
      this.toast.error('Could not upload the signature', error);
    } finally {
      this.uploading.set(false);
    }
  }

  protected removeSignature(): void {
    this.confirm.confirm({
      header: 'Remove the signature?',
      message: 'Permits generated after this will print without a signature until a new one is uploaded.',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Remove',
      rejectLabel: 'Cancel',
      accept: async () => {
        try {
          const response = await this.profiles.removeSignature();
          this.apply(response.data!);
          this.toast.success('Signature removed', response.message);
        } catch (error) {
          this.toast.error('Could not remove the signature', error);
        }
      },
    });
  }

  private readAsBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }
}
