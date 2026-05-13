import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  RestaurantInfoType,
  RestaurantWithDistance,
} from '../../../../shared/types/restaurant-profile.types';
import { ComponentState, createState } from '../../../../core/types/state.types';
import { executeObservable } from '../../../../core/utils/observables.utils';
import { DestroyRef } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { RestaurantsService } from '../../../../shared/services/restaurants-service';

@Component({
  selector: 'app-client-home',
  imports: [DecimalPipe, RouterLink],
  templateUrl: './client-home.html',
  styleUrl: './client-home.css',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientHome {
  private readonly restaurantService = inject(RestaurantsService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly state = signal<ComponentState<RestaurantWithDistance[]>>(createState());

  constructor() {
    executeObservable(this.restaurantService.getNearbyRestaurantsList(), {
      state: this.state,
      destroyRef: this.destroyRef,
    });
  }

  protected formatAddress(restaurant: RestaurantInfoType): string {
    const a = restaurant.address;
    if (!a) return '';
    return `${a.streetNumber} ${a.addressLine}, ${a.city} ${a.zipCode}`;
  }
}
