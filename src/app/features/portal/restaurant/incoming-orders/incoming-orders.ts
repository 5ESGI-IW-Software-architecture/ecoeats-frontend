import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-incoming-orders',
  imports: [],
  templateUrl: './incoming-orders.html',
  styleUrl: './incoming-orders.css',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IncomingOrders {}
