import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RestaurantNavigation } from '../restaurant-navigation/restaurant-navigation.component';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-restaurant-shell',
  imports: [RestaurantNavigation, RouterOutlet],
  template: `
    <div class="w-screen h-screen flex flex-col" style="background: #0d1a0f;">
      <div class="h-[7%] w-full shrink-0"><app-restaurant-navigation /></div>
      <div class="flex-1 min-h-0 overflow-hidden">
        <div class="px-32 mx-auto h-full">
          <router-outlet />
        </div>
      </div>
    </div>
  `,
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RestaurantShell {}
