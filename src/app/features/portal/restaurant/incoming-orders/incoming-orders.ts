import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../../environments/environment';
import { ComponentState, createState } from '../../../../core/types/state.types';
import { executeObservable } from '../../../../core/utils/observables.utils';
import { OrderService } from '../../../../shared/services/order-service';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDialog } from '../../../../shared/dialogs/confirmation-dialog/confirmation-dialog';
import { filter, switchMap } from 'rxjs';

export type IncomingOrderStatus =
  | 'Paid'
  | 'Accepted'
  | 'Rejected'
  | 'InPreparation'
  | 'ReadyForPickup';

export type IncomingOrderLine = {
  plateId: string;
  plateName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
};

export type IncomingOrder = {
  id: string;
  clientName: string;
  clientPhone?: string;
  orderLines: IncomingOrderLine[];
  orderSubtotal: number;
  deliveryFee: number;
  tipAmount: number;
  totalPrice: number;
  status: IncomingOrderStatus;
  receivedAt: Date;
};

@Component({
  selector: 'app-incoming-orders',
  imports: [DatePipe, CurrencyPipe, FormsModule],
  templateUrl: './incoming-orders.html',
  styleUrl: './incoming-orders.css',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IncomingOrders implements OnInit {
  private readonly orderService = inject(OrderService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialog = inject(MatDialog);

  readonly orders = signal<ComponentState<IncomingOrder[]>>(createState());
  readonly selectedOrderId = signal<string | null>(null);
  readonly acceptState = signal<ComponentState<void>>(createState());
  readonly rejectState = signal<ComponentState<void>>(createState());
  readonly progressionState = signal<ComponentState<void>>(createState());

  readonly showEstimationInput = signal(false);
  readonly estimationMinutes = signal<number | null>(null);
  readonly estimationError = signal<string | null>(null);


  readonly pendingOrders = computed(() =>
    (this.orders().data ?? [])
      .filter((o) => o.status === 'Paid')
      .sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()),
  );

  readonly activeOrders = computed(() => {
    const statusOrder: Record<string, number> = {
      ReadyForPickup: 0,
      InPreparation: 1,
      Accepted: 2,
    };
    return (this.orders().data ?? [])
      .filter((o) => ['Accepted', 'InPreparation', 'ReadyForPickup'].includes(o.status))
      .sort((a, b) => (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99));
  });

  readonly selectedOrder = computed(
    () => this.orders().data?.find((o) => o.id === this.selectedOrderId()) ?? null,
  );

  readonly selectedOrderContext = computed<'pending' | 'active' | null>(() => {
    const order = this.selectedOrder();
    if (!order) return null;
    if (order.status === 'Paid') return 'pending';
    return 'active';
  });

  private eventSource: EventSource | null = null;

  ngOnInit(): void {
    this.loadInitialOrders();
    this.connectSSE();
    this.destroyRef.onDestroy(() => this.disconnectSSE());
  }

  selectOrder(orderId: string): void {
    this.selectedOrderId.set(orderId);
    this.showEstimationInput.set(false);
    this.estimationMinutes.set(null);
    this.estimationError.set(null);
  }

  onAcceptClick(): void {
    this.showEstimationInput.set(true);
  }

  confirmAccept(): void {
    const minutes = this.estimationMinutes();
    if (!minutes || minutes <= 0 || !Number.isInteger(minutes)) {
      this.estimationError.set('Please enter a valid preparation time in minutes.');
      return;
    }

    const orderId = this.selectedOrderId();
    if (!orderId) return;

    this.estimationError.set(null);

    executeObservable(this.orderService.acceptOrder$(orderId, minutes), {
      state: this.acceptState,
      destroyRef: this.destroyRef,
      onSuccess: () => {
        this.updateOrderStatus(orderId, 'Accepted');
        this.showEstimationInput.set(false);
        this.selectedOrderId.set(null);
      },
    });
  }

  rejectOrder(): void {
    const orderId = this.selectedOrderId();
    if (!orderId) return;

    const rejection$ = this.dialog
      .open(ConfirmationDialog, {
        data: {
          title: 'Are you sure?',
          message: 'Are you sure you want to reject this order? This action cannot be undone.',
          cancelLabel: 'Cancel',
          actionLabel: 'Reject',
          variant: 'danger',
        },
      })
      .afterClosed()
      .pipe(
        filter((result) => result === true),
        switchMap(() => this.orderService.rejectOrder$(orderId)),
      );

    executeObservable(rejection$, {
      state: this.rejectState,
      destroyRef: this.destroyRef,
      onSuccess: () => {
        this.updateOrderStatus(orderId, 'Rejected');
        this.selectedOrderId.set(null);
      },
    });
  }

  startPreparation(): void {
    const orderId = this.selectedOrderId();
    if (!orderId) return;

    executeObservable(this.orderService.startPreparation$(orderId), {
      state: this.progressionState,
      destroyRef: this.destroyRef,
      onSuccess: () => {
        this.updateOrderStatus(orderId, 'InPreparation');
      },
    });
  }

  markReadyForPickup(): void {
    const orderId = this.selectedOrderId();
    if (!orderId) return;

    executeObservable(this.orderService.markReadyForPickup$(orderId), {
      state: this.progressionState,
      destroyRef: this.destroyRef,
      onSuccess: () => {
        this.updateOrderStatus(orderId, 'ReadyForPickup');
      },
    });
  }

  cancelEstimation(): void {
    this.showEstimationInput.set(false);
    this.estimationMinutes.set(null);
    this.estimationError.set(null);
  }

  isNew(order: IncomingOrder): boolean {
    const diffMs = Date.now() - new Date(order.receivedAt).getTime();
    return diffMs < 10 * 60 * 1000;
  }

  totalItems(order: IncomingOrder): number {
    return order.orderLines.reduce((sum, l) => sum + l.quantity, 0);
  }

  private loadInitialOrders(): void {
    executeObservable(this.orderService.getIncomingOrders$(), {
      state: this.orders,
      destroyRef: this.destroyRef,
    });
  }

  private connectSSE(): void {
    const token = localStorage.getItem('access_token') ?? '';
    const url = `${environment.apiUrl}/sse/restaurant/orders?token=${token}`;

    this.eventSource = new EventSource(url);

    this.eventSource.addEventListener('NEW_ORDER', (event: MessageEvent) => {
      const newOrder = {
        ...(JSON.parse(event.data) as IncomingOrder),
        receivedAt: new Date(),
      };
      this.orders.update((state) => ({
        ...state,
        data: state.data?.some((o) => o.id === newOrder.id)
          ? state.data
          : [newOrder, ...(state.data ?? [])],
      }));
    });

    this.eventSource.onerror = () => {
      this.disconnectSSE();
      setTimeout(() => this.connectSSE(), 3000);
    };
  }

  private disconnectSSE(): void {
    this.eventSource?.close();
    this.eventSource = null;
  }

  private updateOrderStatus(orderId: string, status: IncomingOrderStatus): void {
    this.orders.update((state) => ({
      ...state,
      data: state.data?.map((o) => (o.id === orderId ? { ...o, status } : o)) ?? [],
    }));
  }
}
