import { ChangeDetectionStrategy, Component, inject, Signal, WritableSignal } from '@angular/core';
import { AuthStore } from '../../../../store/auth.store';
import { RestaurantUserType } from '../../../../core/types/user.type';
import { RouterLink, RouterLinkActive } from '@angular/router';

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
  protected readonly userData = this.authStore.user as Signal<RestaurantUserType | null>;
}
