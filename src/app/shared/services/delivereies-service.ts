import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiService } from '../../core/http/api.service';
import { HttpResult } from '../../core/types/api.types';
import {
  AcceptDeliveryResponse,
  ActiveDelivery,
  DeliveryProposal,
} from '../../features/portal/deliverer/dashboard/dashboard';

@Injectable({ providedIn: 'root' })
export class DeliveriesService {
  private readonly apiService = inject(ApiService);

  updateAvailability$(isAvailable: boolean): Observable<void> {
    return this.apiService.patch('deliverers/availability', { isAvailable });
  }

  getDeliveries$(): Observable<DeliveryProposal[]> {
    return this.apiService
      .get<HttpResult<DeliveryProposal[]>>('deliverers/deliveries')
      .pipe(map((response) => response.data ?? []));
  }

  getActiveDeliveries$(): Observable<ActiveDelivery[]> {
    return this.apiService
      .get<HttpResult<ActiveDelivery[]>>('deliverers/deliveries/active')
      .pipe(map((response) => response.data ?? []));
  }

  acceptDelivery$(orderId: string): Observable<AcceptDeliveryResponse | null> {
    return this.apiService
      .patch<never, HttpResult<AcceptDeliveryResponse | null>>(
        `deliverers/deliveries/${orderId}/accept`,
      )
      .pipe(map((response) => response.data ?? null));
  }

  markPickedUp$(deliveryId: string): Observable<void> {
    return this.apiService.patch(`deliverers/deliveries/${deliveryId}/pickup`);
  }

  markDelivered$(deliveryId: string): Observable<void> {
    return this.apiService.patch(`deliverers/deliveries/${deliveryId}/deliver`, {});
  }
}
