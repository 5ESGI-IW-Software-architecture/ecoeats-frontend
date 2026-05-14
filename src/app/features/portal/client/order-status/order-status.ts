import { ChangeDetectionStrategy, Component } from '@angular/core';
import { inject, signal, computed, DestroyRef, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { filter, map, switchMap, tap } from 'rxjs';
import { OrderService } from '../../../../shared/services/order-service';
import { ComponentState, createState } from '../../../../core/types/state.types';
import { executeObservable } from '../../../../core/utils/observables.utils';
import { DatePipe } from '@angular/common';
import { SafeUrlPipe } from '../../../../shared/pipes/safe-url.pipe';
import { environment } from '../../../../../environments/environment';

export type OrderStatusEnum =
  | 'Pending'
  | 'Paid'
  | 'Accepted'
  | 'Rejected'
  | 'InPreparation'
  | 'ReadyForPickup'
  | 'Closed'
  | 'Cancelled';

export type DeliveryStatus = 'Accepted' | 'PickedUp' | 'Delivered';

interface TimelineStep<T> {
  status: T;
  label: string;
  description: string;
  completedAt?: Date;
}

@Component({
  selector: 'app-order-status',
  imports: [DatePipe, SafeUrlPipe, RouterLink],
  templateUrl: './order-status.html',
  styleUrl: './order-status.css',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderStatus implements OnInit {
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly orderService = inject(OrderService);
  private readonly destroyRef = inject(DestroyRef);

  readonly orderState = signal<ComponentState<any>>(createState());
  readonly currentOrderStatus = signal<OrderStatusEnum>('Pending');
  readonly currentDeliveryStatus = signal<DeliveryStatus | null>(null);
  readonly estimatedPreparationTime = signal<number | null>(null);

  readonly receiptUrl = signal<string | null>(null);
  readonly receiptState = signal<ComponentState<any>>(createState());

  readonly hasReceipt = computed(() => !!this.receiptUrl() && this.receiptUrl() !== '');

  readonly mapRawUrl = computed(() => {
    const order = this.orderState().data;
    if (!order) return '';
    const origin = `${order.restaurantAddressLine}, ${order.restaurantZipCode} ${order.restaurantCity}`;
    const dest = `${order.deliveryStreetNumber} ${order.deliveryAddressLine}, ${order.deliveryZipCode} ${order.deliveryCity}`;
    return `https://www.google.com/maps/embed/v1/directions?key=${environment.googleMapsApiKey}&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(dest)}&mode=driving`;
  });

  readonly orderSteps = signal<TimelineStep<OrderStatusEnum>[]>([
    { status: 'Pending', label: 'Order Placed', description: 'Waiting for payment confirmation' },
    { status: 'Paid', label: 'Payment Confirmed', description: 'Your payment has been processed' },
    {
      status: 'Accepted',
      label: 'Restaurant Accepted',
      description: 'The restaurant confirmed your order',
    },
    {
      status: 'InPreparation',
      label: 'Being Prepared',
      description: 'The kitchen is working on your order',
    },
    {
      status: 'ReadyForPickup',
      label: 'Ready for Pickup',
      description: 'Your order is packed and waiting for the driver',
    },
  ]);

  readonly deliverySteps = signal<TimelineStep<DeliveryStatus>[]>([
    {
      status: 'Accepted',
      label: 'Driver Assigned',
      description: 'A deliverer is heading to the restaurant',
    },
    { status: 'PickedUp', label: 'Picked Up', description: 'The driver has collected your order' },
    { status: 'Delivered', label: 'Delivered', description: 'Your order has arrived — enjoy!' },
  ]);

  protected readonly orderStatusIndex: Record<OrderStatusEnum, number> = {
    Pending: 0,
    Paid: 1,
    Accepted: 2,
    InPreparation: 3,
    ReadyForPickup: 4,
    Closed: 5,
    Rejected: -1,
    Cancelled: -1,
  };

  private readonly deliveryStatusIndex: Record<DeliveryStatus, number> = {
    Accepted: 0,
    PickedUp: 1,
    Delivered: 2,
  };

  readonly isCancelled = computed(() => this.currentOrderStatus() === 'Cancelled');
  readonly isRejected = computed(() => this.currentOrderStatus() === 'Rejected');
  readonly isCompleted = computed(() => this.currentDeliveryStatus() === 'Delivered');

  readonly showDeliveryPhase = computed(() => {
    const idx = this.orderStatusIndex[this.currentOrderStatus()];
    return idx >= 4;
  });

  readonly statusLabel = computed(() => {
    const ds = this.currentDeliveryStatus();
    if (ds) {
      const labels: Record<DeliveryStatus, string> = {
        Accepted: 'Driver on the way',
        PickedUp: 'Order picked up',
        Delivered: 'Order delivered!',
      };
      return labels[ds];
    }
    const labels: Record<OrderStatusEnum, string> = {
      Pending: 'Placing your order…',
      Paid: 'Payment confirmed',
      Accepted: 'Restaurant accepted',
      Rejected: 'Order rejected',
      InPreparation: 'Being prepared',
      ReadyForPickup: 'Ready for pickup',
      Closed: 'Order complete',
      Cancelled: 'Order cancelled',
    };
    return labels[this.currentOrderStatus()];
  });

  readonly statusDescription = computed(() => {
    const ds = this.currentDeliveryStatus();
    if (ds) {
      const descs: Record<DeliveryStatus, string> = {
        Accepted: 'Your driver is heading to the restaurant to collect your order.',
        PickedUp: 'Your food is on the way — almost there!',
        Delivered: 'Your food has arrived. Bon appétit!',
      };
      return descs[ds];
    }
    const descs: Record<OrderStatusEnum, string> = {
      Pending: "We're processing your order. This won't take long.",
      Paid: 'Your payment went through. Waiting for the restaurant.',
      Accepted: 'Great news — the restaurant is on it.',
      Rejected: "Unfortunately, the restaurant couldn't fulfill this order.",
      InPreparation: 'Your food is being freshly prepared.',
      ReadyForPickup: 'Your order is ready and waiting for a driver.',
      Closed: "Everything's done. Thank you for ordering!",
      Cancelled: 'This order has been cancelled.',
    };
    return descs[this.currentOrderStatus()];
  });

  readonly progressPercent = computed(() => {
    const totalSteps = 8;
    const ds = this.currentDeliveryStatus();
    if (ds) {
      const deliveryIdx = this.deliveryStatusIndex[ds];
      return Math.round(((5 + deliveryIdx + 1) / totalSteps) * 100);
    }
    const orderIdx = this.orderStatusIndex[this.currentOrderStatus()];
    if (orderIdx < 0) return 0;
    return Math.round(((orderIdx + 1) / totalSteps) * 100);
  });

  isOrderStepCompleted(status: OrderStatusEnum): boolean {
    const current = this.orderStatusIndex[this.currentOrderStatus()];
    const step = this.orderStatusIndex[status];
    if (current < 0 || step < 0) return false;
    return step < current + 1;
  }

  isOrderStepActive(status: OrderStatusEnum): boolean {
    return this.currentOrderStatus() === status && !this.isCancelled() && !this.isRejected();
  }

  isOrderStepFailed(status: OrderStatusEnum): boolean {
    if (this.isRejected() && status === 'Accepted') return true;
    return this.isCancelled() && status === this.currentOrderStatus();
  }

  isDeliveryStepCompleted(status: DeliveryStatus): boolean {
    const ds = this.currentDeliveryStatus();
    if (!ds) return false;
    return this.deliveryStatusIndex[status] < this.deliveryStatusIndex[ds] + 1;
  }

  isDeliveryStepActive(status: DeliveryStatus): boolean {
    return this.currentDeliveryStatus() === status;
  }

  private eventSource: EventSource | null = null;

  ngOnInit(): void {
    executeObservable(
      this.activatedRoute.params.pipe(
        filter((params) => !!params['orderId']),
        map((params) => params['orderId'] as string),
        switchMap((orderId) => {
          this.connectSSE(orderId);
          this.fetchReceipt(orderId);
          return this.orderService.getOrder$(orderId).pipe(tap(console.log));
        }),
      ),
      {
        state: this.orderState,
        destroyRef: this.destroyRef,
        onSuccess: (order) => {
          this.currentOrderStatus.set(order.orderStatus);
          if (order.estimatedPreparationTime) {
            this.estimatedPreparationTime.set(order.estimatedPreparationTime);
          }
          if (order.deliveryStatus) {
            this.currentDeliveryStatus.set(order.deliveryStatus);
          }
        },
        onError: () => console.error('Failed to load order'),
      },
    );

    this.destroyRef.onDestroy(() => this.disconnectSSE());
  }

  downloadReceipt(): void {
    const url = this.receiptUrl();
    if (!url) return;
    const serverRoot = environment.apiUrl.replace('/api', '');
    window.open(`${serverRoot}${url}`, '_blank');
  }

  private fetchReceipt(orderId: string): void {
    executeObservable(this.orderService.getReceipt$(orderId), {
      state: this.receiptState,
      destroyRef: this.destroyRef,
      onSuccess: (response) => this.receiptUrl.set(response?.receiptUrl ?? ''),
    });
  }

  private connectSSE(orderId: string): void {
    const token = localStorage.getItem('access_token') ?? '';
    const url = `${environment.apiUrl}/sse/orders/${orderId}/status?token=${token}`;

    this.eventSource = new EventSource(url);

    this.eventSource.addEventListener('orders-status', (event: MessageEvent) => {
      console.log('Order status event received:', event);
      const data = JSON.parse(event.data) as {
        status: OrderStatusEnum;
        estimatedPreparationTime?: number;
      };
      this.currentOrderStatus.set(data.status);

      if (data.estimatedPreparationTime) {
        this.estimatedPreparationTime.set(data.estimatedPreparationTime);
      }

      this.orderSteps.update((steps) =>
        steps.map((s) => (s.status === data.status ? { ...s, completedAt: new Date() } : s)),
      );

      if (data.status === 'Paid') {
        const orderId = this.activatedRoute.snapshot.params['orderId'] as string;
        setTimeout(() => this.fetchReceipt(orderId), 2000);
      }
    });

    this.eventSource.addEventListener('delivery-status', (event: MessageEvent) => {
      console.log('Delivery status event received:', event);
      const data = JSON.parse(event.data) as { status: DeliveryStatus };
      this.currentDeliveryStatus.set(data.status);

      this.deliverySteps.update((steps) =>
        steps.map((s) => (s.status === data.status ? { ...s, completedAt: new Date() } : s)),
      );
    });

    this.eventSource.onerror = () => {
      this.disconnectSSE();
      setTimeout(() => this.connectSSE(orderId), 3000);
    };
  }

  private disconnectSSE(): void {
    this.eventSource?.close();
    this.eventSource = null;
  }
}
