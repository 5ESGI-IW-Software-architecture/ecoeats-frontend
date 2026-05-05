import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';


@Component({
  selector: 'app-client-shell',
  imports: [RouterOutlet],
  styleUrl: './client-shell.css',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-screen h-screen flex flex-col" style="background: #0d1a0f;">
      <div class="flex-1 min-h-0 overflow-hidden">
        <div class="px-32 mx-auto h-full">
          <router-outlet />
        </div>
      </div>
    </div>
  `,
})
export class ClientShell {}

