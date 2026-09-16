import { Injectable, inject } from '@angular/core';
import { ApiResponse, ApiService } from './api.service';

export type AssemblyTypeName = 'METROPOLITAN' | 'MUNICIPAL' | 'DISTRICT';

export interface AssemblyProfile {
  id: string;
  /** Read-only: only the platform may rename an assembly. */
  assemblyName: string;
  assemblyCode: string;
  assemblyType: AssemblyTypeName;
  regionId?: string;
  regionName?: string;
  capital?: string;
  postalAddress?: string;
  physicalAddress?: string;
  contactNo?: string;
  emailAddress?: string;
  website?: string;
  bankName?: string;
  bankAccountNo?: string;
  momoNumber?: string;
  coordinatingDirector?: string;
  chiefExecutive?: string;
  permitNumberPrefix?: string;
  inspectionRequired: boolean;
  paymentBeforeIssue: boolean;
  logoDataUri?: string;
  signatureDataUri?: string;
  signatureFileName?: string;
}

export interface LookupRegion {
  id: string;
  regionName: string;
}

/** The signed-in officer's own assembly, and the chief executive's signature. */
@Injectable({ providedIn: 'root' })
export class AssemblyProfileService {
  private readonly api = inject(ApiService);

  profile(): Promise<AssemblyProfile> {
    return this.api.getData<AssemblyProfile>('/staff/assembly');
  }

  regions(): Promise<LookupRegion[]> {
    return this.api.getData<LookupRegion[]>('/lookup/regions');
  }

  update(profile: Partial<AssemblyProfile>): Promise<ApiResponse<AssemblyProfile>> {
    return this.api.putAsync<AssemblyProfile>('/staff/assembly', profile);
  }

  uploadSignature(file: {
    data: string;
    contentType: string;
    fileName: string;
  }): Promise<ApiResponse<AssemblyProfile>> {
    return this.api.postAsync<AssemblyProfile>('/staff/assembly/signature', file);
  }

  removeSignature(): Promise<ApiResponse<AssemblyProfile>> {
    return this.api.deleteAsync<AssemblyProfile>('/staff/assembly/signature');
  }
}
