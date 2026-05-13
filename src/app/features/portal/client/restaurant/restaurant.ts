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
import { CurrencyPipe, NgClass } from '@angular/common';
import { RestaurantsService } from '../../../../shared/services/restaurants-service';
import { ComponentState, createState } from '../../../../core/types/state.types';
import { executeObservable } from '../../../../core/utils/observables.utils';
import { PlateResponse } from '../../../../shared/types/restaurant-menu.types';
import { RestaurantInfoType } from '../../../../shared/types/restaurant-profile.types';
import { Observable } from 'rxjs';
import { CartService } from '../../../../shared/services/cart.service.ts.ts';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDialog } from '../../../../shared/dialogs/confirmation-dialog/confirmation-dialog';
import { FeedbackDisplayDialog } from '../../../../shared/dialogs/feedback-display-dialog/feedback-display-dialog';
import { OrderService } from '../../../../shared/services/order-service';

@Component({
  selector: 'app-restaurant',
  imports: [RouterLink, CurrencyPipe, NgClass],
  templateUrl: './restaurant.html',
  styleUrl: './restaurant.css',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Restaurant implements OnInit {
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly restaurantService = inject(RestaurantsService);
  private readonly cartService = inject(CartService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly orderService = inject(OrderService);

  private readonly restaurantId = this.activatedRoute.snapshot.params['id'] as string;

  protected readonly restaurantState = signal<ComponentState<RestaurantInfoType>>(createState());
  protected readonly platesState = signal<ComponentState<PlateResponse[]>>(createState());

  protected readonly cartFetchState = signal<ComponentState<any>>(createState());
  protected readonly cartMutationState = signal<ComponentState<any>>(createState());
  readonly submitOrderState = signal(createState())

  protected readonly cartItems = signal<any[]>([]);
  protected readonly cartCount = computed(() =>
    this.cartItems().reduce((sum, i) => sum + i.quantity, 0),
  );

  protected readonly cartTotal = computed(() =>
    this.cartItems().reduce((sum, i) => sum + Number(i.unitPrice) * i.quantity, 0),
  );

  protected readonly cartRestaurant = signal<{ name: string; id: string } | null>(null);

  protected readonly expandedPlateId = signal<string | null>(null);
  protected readonly plateColumns = computed<[PlateResponse[], PlateResponse[]]>(() => {
    const plates = this.platesState().data ?? [];
    return [plates.filter((_, i) => i % 2 === 0), plates.filter((_, i) => i % 2 === 1)];
  });

  ngOnInit(): void {
    executeObservable(this.restaurantService.getRestaurantById$(this.restaurantId), {
      state: this.restaurantState,
      destroyRef: this.destroyRef,
    });

    executeObservable(this.restaurantService.getRestaurantPlates$(this.restaurantId), {
      state: this.platesState,
      destroyRef: this.destroyRef,
    });

    executeObservable(this.cartService.getCartState$(), {
      state: this.cartFetchState,
      destroyRef: this.destroyRef,
      onSuccess: (cartState) => this.syncCartItems(cartState),
    });
  }

  addToCart(plate: PlateResponse): void {
    const action$ =
      this.cartCount() === 0
        ? this.cartService.createCart$({
            currentRestaurantId: this.restaurantId,
            plateId: plate.id,
            plateQuantity: 1,
          })
        : this.cartService.addItem$({
            restaurantId: this.restaurantId,
            plateId: plate.id,
            plateQuantity: 1,
          });

    this.mutateAndSync(action$);
  }

  increment(plateId: string): void {
    this.mutateAndSync(this.cartService.incrementItem$(plateId));
  }

  decrement(plateId: string): void {
    this.mutateAndSync(this.cartService.decrementItem$(plateId));
  }

  removeFromCart(plateId: string): void {
    const quantity = this.quantityOf(plateId);
    this.mutateAndSync(this.cartService.removeItem$(plateId, quantity));
  }

  quantityOf(plateId: string): number {
    return this.cartItems().find((plate) => plate.plateId === plateId)?.quantity ?? 0;
  }

  toggleExpand(plateId: string): void {
    this.expandedPlateId.update((id) => (id === plateId ? null : plateId));
  }

  formatAddress(restaurant: RestaurantInfoType): string {
    const a = restaurant.address;
    if (!a) return '';
    return `${a.streetNumber} ${a.addressLine}, ${a.city}`;
  }

  submitOrder(): void {
      executeObservable(this.orderService.submitOrder$(), {
        state: this.submitOrderState,
        destroyRef: this.destroyRef,
        onSuccess: (response) => this.router.navigate(['/portal/order/payment', response.orderId]),
        onError: () => console.error('Failed to submit order'),
      })
  }

  private mutateAndSync(mutation$: Observable<any>): void {
    executeObservable(mutation$, {
      state: this.cartMutationState,
      destroyRef: this.destroyRef,
      onSuccess: (cartState) => {
        this.syncCartItems(cartState);
      },
      onError: (error) => {
        console.error('Error mutating cart:', error.status);
        this.handleCartMutationErrors(error.status);
      },
    });
  }

  private syncCartItems(cartState: any): void {
    this.cartRestaurant.set({
      name: cartState?.restaurantName,
      id: cartState?.restaurantId,
    });
    this.cartItems.set(cartState?.items ?? []);
  }

  private handleCartMutationErrors(errorStatus: number): void {
    if (errorStatus === 409) {
      this.dialog
        .open(ConfirmationDialog, {
          hasBackdrop: false,
          data: {
            title: 'Cannot mix restaurants',
            message:
              'Adding items from a different restaurant will clear your current cart. Do you want to continue?',
            actionLabel: 'Clear cart',
            cancelLabel: 'Keep cart and return to restaurant',
            variant: 'warning',
          },
        })
        .afterClosed()
        .subscribe((confirmed: boolean) => {
          if (!confirmed) {
            window.location.href = `/portal/restaurant/${this.cartFetchState().data?.restaurantId}`;
            return;
          }

          executeObservable(this.cartService.clearCart$(), {
            state: this.cartMutationState,
            destroyRef: this.destroyRef,
            onSuccess: () => {
              this.cartItems.set([]);
              this.cartRestaurant.set(null);
            },
          });
        });
    }

    if (errorStatus === 422) {
      this.dialog.open(FeedbackDisplayDialog, {data: {
        message: 'This item is out of stock and no longer available for the moment',
        variant: 'error'
        }})
    }
  }
}
