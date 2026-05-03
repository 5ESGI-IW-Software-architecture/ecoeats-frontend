import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiRequestOptions } from '../types/api.types';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly httpClient = inject(HttpClient);

  private readonly API_URL = environment.apiUrl;

  private executeRequest<PAYLOAD = unknown, RESPONSE = unknown>(
    requestOptions: ApiRequestOptions<PAYLOAD>,
  ): Observable<RESPONSE> {
    const { method, endpointUrl, body, headers, params, withCredentials } = requestOptions;

    const options = {
      headers,
      params,
      withCredentials,
    };

    switch (method) {
      case 'GET':
        return this.httpClient.get<RESPONSE>(this.getRequestPath(endpointUrl), options);

      case 'POST':
        return this.httpClient.post<RESPONSE>(this.getRequestPath(endpointUrl), body, options);

      case 'PUT':
        return this.httpClient.put<RESPONSE>(this.getRequestPath(endpointUrl), body, options);

      case 'PATCH':
        return this.httpClient.patch<RESPONSE>(this.getRequestPath(endpointUrl), body, options);

      case 'DELETE':
        return this.httpClient.delete<RESPONSE>(this.getRequestPath(endpointUrl), options);

      default:
        throw new Error(`Unsupported HTTP method: ${method}`);
    }
  }

  private getRequestPath(endpointUrl: string): string {
    return `${this.API_URL}/${endpointUrl}`;
  }

  get<RESPONSE = unknown>(
    endpointUrl: string,
    params?: ApiRequestOptions<never>['params'],
    headers?: ApiRequestOptions<never>['headers'],
    withCredentials?: boolean,
  ): Observable<RESPONSE> {
    return this.executeRequest<never, RESPONSE>({
      method: 'GET',
      endpointUrl,
      params,
      headers,
      withCredentials,
    });
  }

  post<PAYLOAD, RESPONSE>(
    endpointUrl: string,
    body?: PAYLOAD,
    params?: ApiRequestOptions<PAYLOAD>['params'],
    headers?: ApiRequestOptions<PAYLOAD>['headers'],
    withCredentials?: boolean,
  ): Observable<RESPONSE> {
    return this.executeRequest<PAYLOAD, RESPONSE>({
      method: 'POST',
      endpointUrl,
      body,
      params,
      headers,
      withCredentials,
    });
  }

  put<PAYLOAD, RESPONSE>(
    endpointUrl: string,
    body?: PAYLOAD,
    params?: ApiRequestOptions<PAYLOAD>['params'],
    headers?: ApiRequestOptions<PAYLOAD>['headers'],
    withCredentials?: boolean,
  ): Observable<RESPONSE> {
    return this.executeRequest<PAYLOAD, RESPONSE>({
      method: 'PUT',
      endpointUrl,
      body,
      params,
      headers,
      withCredentials,
    });
  }

  patch<PAYLOAD, RESPONSE>(
    endpointUrl: string,
    body?: PAYLOAD,
    params?: ApiRequestOptions<PAYLOAD>['params'],
    headers?: ApiRequestOptions<PAYLOAD>['headers'],
    withCredentials?: boolean,
  ): Observable<RESPONSE> {
    return this.executeRequest<PAYLOAD, RESPONSE>({
      method: 'PATCH',
      endpointUrl,
      body,
      params,
      headers,
      withCredentials,
    });
  }

  delete<RESPONSE>(
    endpointUrl: string,
    params?: ApiRequestOptions<never>['params'],
    headers?: ApiRequestOptions<never>['headers'],
    withCredentials?: boolean,
  ): Observable<RESPONSE> {
    return this.executeRequest<never, RESPONSE>({
      method: 'DELETE',
      endpointUrl,
      params,
      headers,
      withCredentials,
    });
  }
}
