import { inject, Injectable } from '@angular/core';
import { ApiService } from '../../../core/http/api.service';
import { map, Observable, switchMap } from 'rxjs';
import { HttpResult } from '../../../core/types/api.types';

type CreateCartPayload = {
  currentRestaurantId: string;
  plateId: string;
  plateQuantity: number;
};

type AddItemPayload = {
  plateId: string;
  plateQuantity: number;
  restaurantId: string;
};

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private readonly apiService = inject(ApiService);

  getCartState$(): Observable<any> {
    return this.apiService.get<HttpResult<any>>('carts/').pipe(map((response) => response.data));
  }

  createCart$(payload: CreateCartPayload): Observable<any> {
    return this.apiService
      .post<CreateCartPayload, HttpResult<void>>('carts/', payload)
      .pipe(switchMap(() => this.getCartState$()));
  }

  addItem$(payload: AddItemPayload): Observable<any> {
    return this.apiService
      .post<AddItemPayload, HttpResult<void>>('carts/items', payload)
      .pipe(switchMap(() => this.getCartState$()));
  }

  incrementItem$(plateId: string): Observable<any> {
    return this.apiService
      .patch<void, HttpResult<void>>(`carts/items/${plateId}/increment`)
      .pipe(switchMap(() => this.getCartState$()));
  }

  decrementItem$(plateId: string): Observable<any> {
    return this.apiService
      .patch<void, HttpResult<void>>(`carts/items/${plateId}/decrement`)
      .pipe(switchMap(() => this.getCartState$()));
  }

  removeItem$(plateId: string, quantity: number): Observable<any> {
    return this.apiService
      .delete<HttpResult<void>>(`carts/items/${plateId}`, { quantity: quantity.toString() })
      .pipe(switchMap(() => this.getCartState$()));
  }

  clearCart$(): Observable<any> {
    return this.apiService
      .delete<HttpResult<void>>('carts/')
      .pipe(switchMap(() => this.getCartState$()));
  }
}
