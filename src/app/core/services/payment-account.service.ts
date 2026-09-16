import { Injectable, inject } from '@angular/core';
import { ApiResponse, ApiService } from './api.service';

export type PaymentAccountType = 'MOBILE_MONEY' | 'BANK' | 'CASH';

export interface PaymentAccount {
  id: string;
  accountType: PaymentAccountType;
  accountTypeLabel: string;
  accountName: string;
  accountNumber?: string;
  providerName?: string;
  instructions?: string;
  active: boolean;
}

/** What the applicant pays into: the assembly's Mobile Money, bank and cash accounts. */
export type PaymentAccountInput = Omit<PaymentAccount, 'id' | 'accountTypeLabel'>;

@Injectable({ providedIn: 'root' })
export class PaymentAccountService {
  private readonly api = inject(ApiService);

  list(): Promise<PaymentAccount[]> {
    return this.api.getData<PaymentAccount[]>('/staff/payment-accounts');
  }

  create(account: PaymentAccountInput): Promise<ApiResponse<PaymentAccount>> {
    return this.api.postAsync<PaymentAccount>('/staff/payment-accounts', account);
  }

  update(id: string, account: PaymentAccountInput): Promise<ApiResponse<PaymentAccount>> {
    return this.api.putAsync<PaymentAccount>(`/staff/payment-accounts/${id}`, account);
  }

  remove(id: string): Promise<ApiResponse<unknown>> {
    return this.api.deleteAsync(`/staff/payment-accounts/${id}`);
  }
}
