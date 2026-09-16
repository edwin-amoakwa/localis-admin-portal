import { Injectable, inject } from '@angular/core';
import { ApiResponse, ApiService } from './api.service';

/** How an applicant came to be on this assembly's list. */
export type ApplicantSource = 'SIGN_UP' | 'ASSEMBLY' | 'APPLICATION';

export interface Applicant {
  id: string;
  fullname: string;
  phoneNo: string;
  emailAddress?: string;
  ghanaCardNo?: string;
  residentialAddress?: string;
  digitalAddress?: string;
  active: boolean;
  source: ApplicantSource;
  sourceLabel: string;
  registeredBy?: string;
  linkedDate?: string;
  businesses: number;
  /** Only on a just-registered applicant: the one-time password to hand over. */
  temporaryPassword?: string;
}

export interface ApplicantInput {
  firstname: string;
  surname: string;
  phoneNo: string;
  emailAddress?: string;
  ghanaCardNo?: string;
  residentialAddress?: string;
  postalAddress?: string;
  digitalAddress?: string;
}

/**
 * An applicant's account is national. These calls work on the link that puts
 * them on this assembly's list — registering one here creates both.
 */
@Injectable({ providedIn: 'root' })
export class ApplicantService {
  private readonly api = inject(ApiService);

  list(): Promise<Applicant[]> {
    return this.api.getData<Applicant[]>('/staff/applicants');
  }

  register(applicant: ApplicantInput): Promise<ApiResponse<Applicant>> {
    return this.api.postAsync<Applicant>('/staff/applicants', applicant);
  }
}
