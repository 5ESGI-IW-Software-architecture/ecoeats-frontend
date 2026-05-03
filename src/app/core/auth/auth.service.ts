import { inject, Injectable } from '@angular/core';
import { ApiService } from '../http/api.service';
import { Observable, tap } from 'rxjs';
import { AuthTokens, LoginDto, SignupDto, UserRoles } from './auth.types';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly apiService: ApiService = inject(ApiService);

  signup$(payload: SignupDto, userRole: UserRoles): Observable<void> {
    switch (userRole) {
      case 'client':
        return this.apiService.post<SignupDto, void>('clients', payload);
      case 'deliverer':
        return this.apiService.post<SignupDto, void>('deliverers', payload);
      case 'restaurant':
        return this.apiService.post<SignupDto, void>('restaurants', payload);
    }
  }

  login$(payload: LoginDto): Observable<AuthTokens> {
    return this.apiService.post<LoginDto, AuthTokens>('auth/login', payload).pipe(
      tap((tokens: AuthTokens) => this.saveTokens(tokens)),
    )
  }

  saveTokens(tokens: AuthTokens) {
    localStorage.setItem('access_token', tokens.accessToken);
    localStorage.setItem('refresh_token', tokens.refreshToken);
  }

  getAccessTokens() {
    return localStorage.getItem('access_token');
  }

  getRefreshTokens() {
    return localStorage.getItem('refresh_token');
  }
}
