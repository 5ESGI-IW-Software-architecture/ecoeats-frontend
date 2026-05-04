import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-active-orders',
  imports: [],
  templateUrl: './active-orders.html',
  styleUrl: './active-orders.css',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActiveOrders {}
