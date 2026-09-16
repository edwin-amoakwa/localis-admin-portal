import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

/** The envelope every localis-api endpoint answers with (stately-common's ApiResponse). */
export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message?: string;
  data?: T;
}

/**
 * Every HTTP call to localis-api goes through here. The bearer token is added by
 * authInterceptor. `get`/`post` return the raw envelope; `getData` unwraps it.
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  get<T>(path: string): Observable<ApiResponse<T>> {
    return this.http.get<ApiResponse<T>>(`${environment.baseUrl}${path}`);
  }

  post<T>(path: string, body: unknown): Observable<ApiResponse<T>> {
    return this.http.post<ApiResponse<T>>(`${environment.baseUrl}${path}`, body);
  }

  async getData<T>(path: string): Promise<T> {
    return (await firstValueFrom(this.get<T>(path))).data as T;
  }

  /** Resolves with the whole envelope so callers can show the server's message. */
  postAsync<T>(path: string, body: unknown): Promise<ApiResponse<T>> {
    return firstValueFrom(this.post<T>(path, body));
  }

  putAsync<T>(path: string, body: unknown): Promise<ApiResponse<T>> {
    return firstValueFrom(this.http.put<ApiResponse<T>>(`${environment.baseUrl}${path}`, body));
  }

  deleteAsync<T>(path: string): Promise<ApiResponse<T>> {
    return firstValueFrom(this.http.delete<ApiResponse<T>>(`${environment.baseUrl}${path}`));
  }
}

/** The server's own message when it rejected the request, else a generic one. */
export function apiErrorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    const body = typeof error.error === 'string' ? safeParse(error.error) : error.error;
    if (body?.message) {
      return body.message;
    }
    if (error.status === 0) {
      return 'Could not reach the server. Check your connection and try again.';
    }
  }
  return 'Something went wrong. Please try again.';
}

function safeParse(text: string): { message?: string } | null {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
