import { Injectable, signal, WritableSignal } from '@angular/core';
import { UserType } from '../types/user.type';

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
}
