import { Component, inject, OnInit } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-home',
  imports: [],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home  {
  private readonly authService = inject(AuthService);
  protected readonly userData = toSignal(this.authService.me$(), { initialValue: null });
}
