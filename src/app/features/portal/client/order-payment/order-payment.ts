import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { OrderService } from '../../../../shared/services/order-service';
import { ComponentState, createState } from '../../../../core/types/state.types';
import { executeObservable } from '../../../../core/utils/observables.utils';
import { filter, map, switchMap } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { DomSanitizer } from '@angular/platform-browser';
import { SafeUrlPipe } from '../../../../shared/pipes/safe-url.pipe';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-order-payment',
  imports: [FormsModule, CurrencyPipe, DecimalPipe, SafeUrlPipe, RouterLink],
  templateUrl: './order-payment.html',
  styleUrl: './order-payment.css',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderPayment implements OnInit {
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly orderService = inject(OrderService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly sanitizer = inject(DomSanitizer);

  readonly orderState = signal<ComponentState<any>>(createState());

  readonly selectedTip = signal(0);
  readonly tipOptions = [1, 2, 3, 5];

  readonly cardHolder = signal('');
  readonly cardNumber = signal('');
  readonly cardExpiry = signal('');
  readonly cardCvv = signal('');

  readonly paymentState = signal<ComponentState<any>>(createState());

  readonly finalTotal = computed(() => {
    const order = this.orderState().data;
    return order ? order.totalPrice + this.selectedTip() : 0;
  });

  readonly mapRawUrl = computed(() => {
    const order = this.orderState().data;
    if (!order) return '';

    const origin = `${order.restaurantAddressLine}, ${order.restaurantZipCode} ${order.restaurantCity}`;
    const dest = `${order.deliveryStreetNumber} ${order.deliveryAddressLine}, ${order.deliveryZipCode} ${order.deliveryCity}`;

    return `https://www.google.com/maps/embed/v1/directions?key=${environment.googleMapsApiKey}&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(dest)}&mode=driving`;
  });

  ngOnInit(): void {
    executeObservable(
      this.activatedRoute.params.pipe(
        filter((params) => !!params['orderId']),
        map((params) => params['orderId']),
        switchMap((orderId) => this.orderService.getOrderForPayment$(orderId)),
      ),
      {
        state: this.orderState,
        destroyRef: this.destroyRef,
        onSuccess: (order) => console.log('Order fetched for payment:', order),
        onError: () => console.error('Failed to fetch order for payment'),
      },
    );
  }
}
