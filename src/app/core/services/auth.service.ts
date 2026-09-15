import { Injectable, computed, inject, signal } from '@angular/core';
import { ROLES } from '../data/reference.data';
import { PermissionLevel, StaffUser } from '../models';
import { ApiService } from './api.service';
import { SessionStore } from './session-store';

/** Mirrors localis-api's StaffResponse. */
export interface StaffResponse {
  id: string;
  firstname?: string;
  surname?: string;
  fullname?: string;
  emailAddress?: string;
  phoneNo?: string;
  designation?: string;
  department?: string;
  superUser: boolean;
  pendingPasswordChange: boolean;
  assemblyId: string;
  assemblyName: string;
  assemblyCode: string;
}

/** Mirrors localis-api's SessionDto. */
export interface StaffSession {
  token: string;
  expiresInSeconds: number;
  user: StaffResponse;
}

/**
 * Staff sign-in against localis-api (POST /staff/auth/login). The token and the
 * signed-in account are kept in localStorage via SessionStore so a refresh keeps
 * the officer signed in; authInterceptor attaches the token to API calls.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);

  private readonly _staff = signal<StaffResponse | null>(SessionStore.read<StaffResponse>()?.user ?? null);

  /** The raw signed-in account, including the officer's assembly. */
  readonly staff = this._staff.asReadonly();

  /** The signed-in account in the portal's StaffUser shape, for existing screens. */
  readonly user = computed<StaffUser | null>(() => {
    const staff = this._staff();
    return staff ? toStaffUser(staff) : null;
  });

  readonly isAuthenticated = computed(() => this._staff() !== null);

  readonly assemblyId = computed(() => this._staff()?.assemblyId ?? '');
  readonly assemblyName = computed(() => this._staff()?.assemblyName ?? '');
  readonly assemblyCode = computed(() => this._staff()?.assemblyCode ?? '');

  readonly displayName = computed(() => {
    const user = this.user();
    return user ? `${user.firstName} ${user.lastName}`.trim() : '';
  });

  readonly role = computed(() => {
    const user = this.user();
    return user ? ROLES.find((r) => r.id === user.role) : undefined;
  });

  /** Rejects with the HTTP error when the server refuses the credentials. */
  async login(loginId: string, password: string): Promise<StaffUser> {
    const response = await this.api.postAsync<StaffSession>('/staff/auth/login', {
      loginId: loginId.trim(),
      password,
    });
    const session = response.data as StaffSession;
    SessionStore.write<StaffResponse>({ token: session.token, user: session.user });
    this._staff.set(session.user);
    return toStaffUser(session.user);
  }

  logout(): void {
    SessionStore.clear();
    this._staff.set(null);
  }

  /**
   * Whether the signed-in officer may take an action in a module. Screens use
   * this to disable controls rather than hide them, so staff can see what the
   * system can do and who to ask.
   */
  can(moduleId: string, level: PermissionLevel): boolean {
    const permissions = this.role()?.permissions[moduleId];
    return permissions ? permissions.includes(level) : false;
  }
}

function toStaffUser(staff: StaffResponse): StaffUser {
  const firstName = staff.firstname ?? staff.fullname ?? '';
  const lastName = staff.surname ?? '';
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'ST';

  return {
    id: staff.id,
    staffNumber: staff.assemblyCode,
    firstName,
    lastName,
    email: staff.emailAddress ?? '',
    phone: staff.phoneNo ?? '',
    role: staff.superUser ? 'DISTRICT_ADMINISTRATOR' : 'BUSINESS_LICENSING_OFFICER',
    department: staff.department ?? '',
    designation: staff.designation ?? '',
    status: 'ACTIVE',
    lastLogin: '',
    createdOn: '',
    initials,
  };
}
