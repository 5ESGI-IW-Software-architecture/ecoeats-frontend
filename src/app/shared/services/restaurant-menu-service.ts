import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiService } from '../../core/http/api.service';
import { HttpResult } from '../../core/types/api.types';
import { CreatePlateRequest, PlateResponse, UpdatePlateRequest } from '../types/restaurant-menu.types';

@Injectable({ providedIn: 'root' })
export class RestaurantMenuService {
  private readonly apiService = inject(ApiService);

  getPlates$(restaurantId: string): Observable<PlateResponse[]> {
    return this.apiService
      .get<HttpResult<PlateResponse[]>>(`restaurants/${restaurantId}/plates`)
      .pipe(map((r) => r.data));
  }

  createPlate$(restaurantId: string, payload: CreatePlateRequest): Observable<void> {
    return this.apiService
      .post<CreatePlateRequest, HttpResult<void>>(`restaurants/${restaurantId}/plates`, payload)
      .pipe(map(() => undefined));
  }

  updatePlate$(restaurantId: string, plateId: string, payload: UpdatePlateRequest): Observable<void> {
    return this.apiService
      .put<UpdatePlateRequest, HttpResult<void>>(
        `restaurants/${restaurantId}/plates/${plateId}`,
        payload,
      )
      .pipe(map(() => undefined));
  }

  deletePlate$(restaurantId: string, plateId: string): Observable<void> {
    return this.apiService.delete<void>(`restaurants/${restaurantId}/plates/${plateId}`);
  }
}
