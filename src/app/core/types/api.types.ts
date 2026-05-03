import { HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';

export type ApiRequestOptions<PAYLOAD> = {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  endpointUrl: string;
  body?: PAYLOAD;
  params?:
    | HttpParams
    | Record<string, string | number | boolean | readonly (string | number | boolean)[]>;
  headers?: HttpHeaders | Record<string, string | string[]>;
  withCredentials?: boolean;
};

export type ApiConfig = {
  apiBaseUrl: string;
  defaultTimeout?: number;
  defaultRetries?: number;
  defaultHeaders?: Record<string, string>;
};

export interface ApiError {
  errorCode: number;
  errorMessage: string;
  exception: unknown;
}

export function getApiError(httpError: HttpErrorResponse): ApiError {
  return {
    errorCode: httpError.status,
    errorMessage: httpError.error.message,
    exception: httpError,
  };
}
