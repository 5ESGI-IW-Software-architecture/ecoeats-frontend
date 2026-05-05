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
import { CurrencyPipe, NgClass } from '@angular/common';
import { RestaurantsService } from '../client-home/service/restaurants.service';
import { ComponentState, createState } from '../../../../core/types/state.types';
import { executeObservable } from '../../../../core/utils/observables.utils';
import { PlateResponse } from '../../restaurant/types/restaurant-menu.types';
import { RestaurantInfoType } from '../../restaurant/types/restaurant-profile.types';
import { Observable } from 'rxjs';
import { CartService } from '../cart.service.ts';

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

  private readonly restaurantId = this.activatedRoute.snapshot.params['id'] as string;

  protected readonly restaurantState = signal<ComponentState<RestaurantInfoType>>(createState());
  protected readonly platesState = signal<ComponentState<PlateResponse[]>>(createState());

  protected readonly cartFetchState = signal<ComponentState<any>>(createState());
  protected readonly cartMutationState = signal<ComponentState<any>>(createState());

  protected readonly cartItems = signal<any[]>([]);
  protected readonly cartCount = computed(() =>
    this.cartItems().reduce((sum, i) => sum + i.quantity, 0),
  );

  protected readonly cartTotal = computed(() =>
    this.cartItems().reduce((sum, i) => sum + Number(i.unitPrice) * i.quantity, 0),
  );

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
    this.mutateAndSync(this.cartService.removeItem$(plateId));
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

  private mutateAndSync(mutation$: Observable<any>): void {
    executeObservable(mutation$, {
      state: this.cartMutationState,
      destroyRef: this.destroyRef,
      onSuccess: (cartState) => this.syncCartItems(cartState),
    });
  }
  private syncCartItems(cartState: any): void {
    this.cartItems.set(cartState?.items ?? []);
  }
}
