import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-deliverer-shell',
  imports: [RouterOutlet],
  template: `
    <div class="w-screen h-screen flex flex-col" style="background: #0d1a0f;">
      <div class="flex-1 min-h-0 overflow-hidden">
        <div class="px-32 mx-auto h-full">
          <router-outlet />
        </div>
      </div>
    </div>
  `,
  styleUrl: './deliverer-shell.css',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DelivererShell {}
