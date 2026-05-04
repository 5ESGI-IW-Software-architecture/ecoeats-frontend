import { inject, Injectable } from '@angular/core';
import { ApiService } from '../http/api.service';
import { map, Observable, switchMap, tap } from 'rxjs';
import { AuthTokens, LoginDto, SignupDto, UserRoles } from './auth.types';
import { HttpResult } from '../types/api.types';
import { UserType } from '../types/user.type';
import { AuthStore } from '../../store/auth.store';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly apiService: ApiService = inject(ApiService);
  private readonly authStore = inject(AuthStore);

  signup$(payload: SignupDto, userRole: UserRoles): Observable<HttpResult<void>> {
    switch (userRole) {
      case 'client':
        return this.apiService.post<SignupDto, HttpResult<void>>('clients', payload);
      case 'deliverer':
        return this.apiService.post<SignupDto, HttpResult<void>>('deliverers', payload);
      case 'restaurant':
        return this.apiService.post<SignupDto, HttpResult<void>>('restaurants', payload);
    }
  }

  login$(payload: LoginDto): Observable<UserType> {
    return this.apiService.post<LoginDto, HttpResult<AuthTokens>>('auth/login', payload).pipe(
      map((response) => response.data),
      tap((tokens) => this.saveTokens(tokens)),
      switchMap(() => this.me$()),
      tap((user) => this.authStore.setUser(user)),
    );
  }

  activate$(email: string, activationCode: number): Observable<HttpResult<void>> {
    return this.apiService.post<{ email: string; activationCode: number }, HttpResult<void>>(
      'auth/activate',
      {
        activationCode: activationCode,
        email: email,
      },
    );
  }

  me$(): Observable<UserType> {
    return this.apiService
      .get<HttpResult<UserType>>('auth/me')
      .pipe(map((response) => response.data));
  }

  saveTokens(tokens: AuthTokens) {
    localStorage.setItem('access_token', tokens.accessToken);
    localStorage.setItem('refresh_token', tokens.refreshToken);
  }

  getAccessTokens() {
    return localStorage.getItem('access_token');
  }

  clearTokens(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  getRefreshTokens() {
    return localStorage.getItem('refresh_token');
  }
}
