import { inject, Injectable, signal, WritableSignal } from '@angular/core';
import { UserType } from '../core/types/user.type';
import { UserRoles } from '../core/auth/auth.types';


@Injectable({ providedIn: 'root' })
export class AuthStore {

  private readonly _user: WritableSignal<UserType | null> = signal(null);
  readonly user = this._user.asReadonly();

  setUser(user: UserType): void {
    this._user.set(user);
  }

  clearUser(): void {
    this._user.set(null);
  }

  getRole(): UserRoles | null {
    return this._user()?.role ?? null;
  }

}
