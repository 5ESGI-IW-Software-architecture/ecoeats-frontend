import { ChangeDetectionStrategy, Component, inject, Signal, WritableSignal } from '@angular/core';
import { AuthStore } from '../../../../store/auth.store';
import { RestaurantUserType } from '../../../../core/types/user.type';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';

@Component({
  selector: 'app-restaurant-navigation',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './restaurant-navigation.component.html',
  styleUrl: './restaurant-navigation.component.css',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RestaurantNavigation {
  private readonly authStore = inject(AuthStore);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router)

  protected readonly userData = this.authStore.user as Signal<RestaurantUserType | null>;

  handleLogout(): void {
    this.authService.clearTokens();
    this.router.navigate(['/login']);
  }
}
