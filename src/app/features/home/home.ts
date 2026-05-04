import { Component, inject, OnInit } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';
import { RestaurantNavigation } from '../portal/restaurant/restaurant-navigation/restaurant-navigation.component';
import { AuthStore } from '../../store/auth.store';
import { Router, RouterOutlet } from '@angular/router';
import { tap } from 'rxjs';
import { UserRoles } from '../../core/auth/auth.types';
import { RestaurantProfile } from '../portal/restaurant/restaurant-profile/restaurant-profile';

@Component({
  selector: 'app-home',
  imports: [RestaurantNavigation, RestaurantProfile, RouterOutlet],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);

  protected readonly userData = this.authStore.user;

  ngOnInit(): void {
    const user = this.authStore.user();
    if (user) {
      this.redirectByRole(user.role);
      return;
    }

    this.authService
      .me$()
      .pipe(tap((fetchedUser) => this.authStore.setUser(fetchedUser)))
      .subscribe((fetchedUser) => this.redirectByRole(fetchedUser.role));
  }

  private redirectByRole(role: UserRoles): void {
    const routeMap: Record<UserRoles, string> = {
      client: '/client',
      restaurant: '/restaurant',
      deliverer: '/deliverer',
    };
    this.router.navigate([routeMap[role]]);
  }
}
