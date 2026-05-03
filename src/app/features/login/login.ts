import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthBg } from '../../shared/components/auth-bg/auth-bg';
import { AuthService } from '../../core/auth/auth.service';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LoginDto, UserRoles } from '../../core/auth/auth.types';
import { SignupTabs } from '../signup/signup';
import { executeObservable } from '../../core/utils/observables.utils';
import { createState } from '../../core/types/state.types';

@Component({
  selector: 'app-login',
  imports: [AuthBg, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);

  protected readonly activeTab = signal(SignupTabs.CLIENT);
  protected readonly state = signal(createState<void>());

  protected readonly loginForm = this.formBuilder.group({
    email: this.formBuilder.nonNullable.control('', [Validators.required, Validators.email]),
    password: this.formBuilder.nonNullable.control('', [Validators.required, Validators.minLength(6)]),
  });

  ngOnInit(): void {
    const prefill = (history.state as { prefill?: { email?: string; password?: string } })?.prefill;
    if (prefill?.email) this.loginForm.patchValue({ email: prefill.email });
    if (prefill?.password) this.loginForm.patchValue({ password: prefill.password });
  }

  setTab(tab: SignupTabs): void {
    this.activeTab.set(tab);
    this.state.set(createState<void>());
  }

  handleLoginClick(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const payload: LoginDto = {
      ...this.loginForm.getRawValue(),
      userRole: this.getUserRoles(this.activeTab()),
    };

    executeObservable(this.authService.login$(payload), {
      state: this.state,
      destroyRef: this.destroyRef,
      onSuccess: () => this.router.navigate(['/']),
    });
  }

  private getUserRoles(tab: SignupTabs): UserRoles {
    const rolesMap: Record<SignupTabs, UserRoles> = {
      [SignupTabs.CLIENT]: 'client',
      [SignupTabs.RESTAURANT]: 'restaurant',
      [SignupTabs.DELIVERER]: 'deliverer',
    };
    return rolesMap[tab];
  }

  protected readonly SignupTabs = SignupTabs;
}
