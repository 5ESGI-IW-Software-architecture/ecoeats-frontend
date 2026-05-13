import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { OrderService } from '../../../../shared/services/order-service';
import { ComponentState, createState } from '../../../../core/types/state.types';
import { executeObservable } from '../../../../core/utils/observables.utils';
import { filter, map, switchMap } from 'rxjs';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { SafeUrlPipe } from '../../../../shared/pipes/safe-url.pipe';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-order-payment',
  imports: [FormsModule, CurrencyPipe, DecimalPipe, SafeUrlPipe, RouterLink, ReactiveFormsModule],
  templateUrl: './order-payment.html',
  styleUrl: './order-payment.css',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderPayment implements OnInit {
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly orderService = inject(OrderService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router)

  readonly paymentForm: FormGroup = this.fb.group({
    cardHolder: ['', [Validators.required, Validators.minLength(3)]],
    cardNumber: ['', [Validators.required, Validators.pattern(/^\d{4}\s\d{4}\s\d{4}\s\d{4}$/)]],
    cardExpiry: ['', [Validators.required, Validators.pattern(/^(0[1-9]|1[0-2])\/\d{2}$/)]],
    cardCvv: ['', [Validators.required, Validators.pattern(/^\d{3,4}$/)]],
  });

  readonly orderState = signal<ComponentState<any>>(createState());

  readonly selectedTip = signal(0);
  readonly tipOptions = [1, 2, 3, 5];

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

  submitPayment(): void {
    const orderId = this.orderState().data?.id;
    const selectedTip = this.selectedTip();

    const paymentPayload = {
      orderId: orderId,
      tipAmount: selectedTip,
    }

    if (this.paymentForm.invalid) {
      this.paymentForm.markAllAsTouched();
      return;
    }

    executeObservable(this.orderService.submitPayment$(paymentPayload), {
      state: this.paymentState,
      destroyRef: this.destroyRef,
      onSuccess: () => this.router.navigate(['/portal/orders/status/', orderId]),
      onError: () => console.error('Failed to submit payment'),
    });
  }

  formatCardNumber(event: Event): void {
    const input = event.target as HTMLInputElement;
    const raw = input.value.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.replace(/(\d{4})(?=\d)/g, '$1 ');
    this.paymentForm.get('cardNumber')?.setValue(formatted, { emitEvent: false });
  }
}
