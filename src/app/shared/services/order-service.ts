import { inject, Injectable } from '@angular/core';
import { ApiService } from '../../core/http/api.service';
import { HttpResult } from '../../core/types/api.types';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private readonly apiService = inject(ApiService);

  submitOrder$(): Observable<{ orderId: string; clientId: string }> {
    return this.apiService
      .post<void, HttpResult<{ orderId: string; clientId: string }>>('orders/')
      .pipe(map((response) => response.data));
  }

  getOrderForPayment$(orderId: string): Observable<any> {
    return this.apiService
      .get<HttpResult<any>>('orders/' + orderId)
      .pipe(map((response) => response.data));
  }

  submitPayment$(payload: { orderId: string; tipAmount: number }): Observable<void> {
    return this.apiService.post<{ orderId: string; tipAmount: number }, void>(
      'orders/pay',
      payload,
    );
  }

  getOrder$(orderId: string): Observable<any> {
    return this.apiService
      .get<HttpResult<any>>('orders/' + orderId + '/tracking')
      .pipe(map((response) => response.data));
  }

  getIncomingOrders$(): Observable<any> {
    return this.apiService
      .get<HttpResult<any>>('orders/incoming')
      .pipe(map((response) => response.data));
  }

  rejectOrder$(orderId: string): Observable<void> {
    return this.apiService.patch<void, void>('orders/' + orderId + '/reject');
  }

  acceptOrder$(orderId: string, estimatedPreparationTime: number): Observable<void> {
    return this.apiService.patch<{ estimatedPreparationTime: number }, void>(
      'orders/' + orderId + '/accept',
      {
        estimatedPreparationTime,
      },
    );
  }

  startPreparation$(orderId: string): Observable<void> {
    return this.apiService.patch<void, void>('orders/' + orderId + '/start-preparation');
  }

  markReadyForPickup$(orderId: string): Observable<void> {
    return this.apiService.patch<void, void>('orders/' + orderId + '/ready-for-pickup');
  }

  getReceipt$(orderId: string): Observable<{ receiptUrl: string } | null> {
    return this.apiService
      .get<HttpResult<{ receiptUrl: string } | null>>(`orders/${orderId}/receipt`)
      .pipe(map((response) => response.data));
  }
}
