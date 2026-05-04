import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthBg } from '../../shared/components/auth-bg/auth-bg';
import { AuthService } from '../../core/auth/auth.service';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LoginDto, UserRoles } from '../../core/auth/auth.types';
import { SignupTabs } from '../signup/signup';
import { executeObservable } from '../../core/utils/observables.utils';
import { createState } from '../../core/types/state.types';
import { MatDialog } from '@angular/material/dialog';
import { ActivateAccountDialog } from '../../shared/dialogs/activate-account-dialog/activate-account-dialog';
import { tap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

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
  private readonly dialog = inject(MatDialog);

  protected readonly activeTab = signal(SignupTabs.CLIENT);
  protected readonly state = signal(createState<void>());

  protected readonly displaySuccessMessage: WritableSignal<boolean> = signal(false);

  protected readonly loginForm = this.formBuilder.group({
    email: this.formBuilder.nonNullable.control('', [Validators.required, Validators.email]),
    password: this.formBuilder.nonNullable.control('', [
      Validators.required,
      Validators.minLength(6),
    ]),
  });

  ngOnInit(): void {
    const prefill = (
      history.state as {
        prefill?: {
          email?: string;
          password?: string;
          userRole: UserRoles;
          displayActivationDialog?: boolean;
        };
      }
    )?.prefill;
    if (prefill?.email) this.loginForm.patchValue({ email: prefill.email });
    if (prefill?.password) this.loginForm.patchValue({ password: prefill.password });
    if (prefill?.userRole) this.activeTab.set(this.getTab(prefill.userRole));
    if (prefill?.displayActivationDialog) this.activateAccountDialog(prefill.email ?? '');
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
      onSuccess: (user) => this.redirectByRole(user.role),
    });
  }

  private redirectByRole(role: UserRoles): void {
    const map: Record<UserRoles, string> = {
      client: '/client',
      restaurant: '/restaurant/',
      deliverer: '/deliverer',
    };
    this.router.navigate([map[role]]);
  }

  private getUserRoles(tab: SignupTabs): UserRoles {
    const rolesMap: Record<SignupTabs, UserRoles> = {
      [SignupTabs.CLIENT]: 'client',
      [SignupTabs.RESTAURANT]: 'restaurant',
      [SignupTabs.DELIVERER]: 'deliverer',
    };
    return rolesMap[tab];
  }

  private getTab(userRole: UserRoles): SignupTabs {
    const rolesMap: Record<UserRoles, SignupTabs> = {
      client: SignupTabs.CLIENT,
      restaurant: SignupTabs.RESTAURANT,
      deliverer: SignupTabs.DELIVERER,
    };
    return rolesMap[userRole];
  }

  private activateAccountDialog(email: string): void {
    this.dialog
      .open(ActivateAccountDialog, {
        data: { email },
        disableClose: true,
      })
      .afterClosed()
      .pipe(
        tap((success: boolean) => {
          if (success) this.displaySuccessMessage.set(true);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  protected readonly SignupTabs = SignupTabs;
}
