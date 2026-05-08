import { inject, Injectable } from '@angular/core';
import { ApiService } from '../../core/http/api.service';
import { HttpResult } from '../../core/types/api.types';
import { map, Observable } from 'rxjs';

export type CreateOrderPayload = {}

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private readonly apiService = inject(ApiService);

  submitOrder$(): Observable<{ orderId: string, clientId: string }> {
    return this.apiService
      .post<void, HttpResult<{ orderId: string; clientId: string }>>('orders/')
      .pipe(map((response) => response.data));
  }

  getOrderForPayment$(orderId: string): Observable<any> {
    return this.apiService.get<HttpResult<any>>('orders/' + orderId).pipe(map((response) => response.data));
  }
}
