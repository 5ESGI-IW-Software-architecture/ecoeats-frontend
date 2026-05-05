import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiService } from '../../../../core/http/api.service';
import { HttpResult } from '../../../../core/types/api.types';
import {
  ChangePasswordDto,
  RestaurantProfileResponse,
  SetResetTimeDto,
  UpdateRestaurantDto,
} from '../types/restaurant-profile.types';

@Injectable({ providedIn: 'root' })
export class RestaurantProfileService {
  private readonly apiService = inject(ApiService);

  getProfile$(restaurantId: string): Observable<RestaurantProfileResponse> {
    return this.apiService
      .get<HttpResult<RestaurantProfileResponse>>(`restaurants/${restaurantId}`)
      .pipe(map((r) => r.data));
  }

  updateProfile$(restaurantId: string, payload: UpdateRestaurantDto): Observable<void> {
    return this.apiService
      .put<UpdateRestaurantDto, HttpResult<void>>(`restaurants/${restaurantId}`, payload)
      .pipe(map(() => undefined));
  }

  changePassword$(restaurantId: string, payload: ChangePasswordDto): Observable<void> {
    return this.apiService
      .post<ChangePasswordDto, HttpResult<void>>(
        `restaurants/${restaurantId}/change-password`,
        payload,
      )
      .pipe(map(() => undefined));
  }

  setResetTime$(restaurantId: string, resetTime: string): Observable<void> {
    return this.apiService
      .patch<SetResetTimeDto, HttpResult<void>>(
        `restaurants/${restaurantId}/reset-time`,
        { resetTime, restaurantId },
      )
      .pipe(map(() => undefined));
  }

  deleteProfile$(restaurantId: string): Observable<void> {
    return this.apiService.delete<void>(`restaurants/${restaurantId}`);
  }
}
