import { inject, Injectable } from '@angular/core';
import { ApiService } from '../../../../../core/http/api.service';
import { map, Observable } from 'rxjs';
import {
  RestaurantInfoType,
  RestaurantWithDistance,
} from '../../../restaurant/types/restaurant-profile.types';
import { HttpResult } from '../../../../../core/types/api.types';
import { PlateResponse } from '../../../restaurant/types/restaurant-menu.types';

@Injectable({
  providedIn: 'root',
})
export class RestaurantsService {
  private readonly apiService: ApiService = inject(ApiService);

  getNearbyRestaurantsList(): Observable<RestaurantWithDistance[]> {
    return this.apiService
      .get<HttpResult<RestaurantWithDistance[]>>('restaurants/nearby')
      .pipe(map((response) => response.data));
  }

  getRestaurantById$(restaurantId: string): Observable<RestaurantInfoType> {
    return this.apiService
      .get<HttpResult<RestaurantInfoType>>(`restaurants/${restaurantId}`)
      .pipe(map((response) => response.data));
  }

  getRestaurantPlates$(restaurantId: string): Observable<PlateResponse[]> {
    return this.apiService
      .get<HttpResult<PlateResponse[]>>(`restaurants/${restaurantId}/plates`)
      .pipe(map((response) => response.data));
  }
}
