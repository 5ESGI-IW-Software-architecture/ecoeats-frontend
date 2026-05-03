import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal, WritableSignal } from '@angular/core';
import { AuthBg } from '../../shared/components/auth-bg/auth-bg';
import { AuthService } from '../../core/auth/auth.service';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SignupDto, UserRoles } from '../../core/auth/auth.types';
import { ComponentState, createState } from '../../core/types/state.types';
import { executeObservable } from '../../core/utils/observables.utils';
import { Router } from '@angular/router';

export enum SignupTabs {
  CLIENT = 'CLIENT',
  RESTAURANT = 'RESTAURANT',
  DELIVERER = 'DELIVERER',
}

@Component({
  selector: 'app-signup',
  imports: [AuthBg, ReactiveFormsModule],
  templateUrl: './signup.html',
  styleUrl: './signup.css',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Signup {
  protected readonly activeTab: WritableSignal<SignupTabs> = signal(SignupTabs.CLIENT);
  private readonly authService = inject(AuthService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);

  protected readonly state: WritableSignal<ComponentState<void>> = signal(createState<void>());

  protected readonly clientForm: FormGroup = this.formBuilder.group({
    username: this.formBuilder.nonNullable.control('', [Validators.required, Validators.minLength(3)]),
    email: this.formBuilder.nonNullable.control('', [Validators.required, Validators.email]),
    password: this.formBuilder.nonNullable.control('', [Validators.required, Validators.minLength(8)]),
    phoneNumber: this.formBuilder.nonNullable.control('', [Validators.required]),
    defaultAddress: this.formBuilder.group({
      streetNumber: this.formBuilder.control<number | null>(null, [Validators.required, Validators.min(1)]),
      addressLine: this.formBuilder.nonNullable.control('', [Validators.required]),
      city: this.formBuilder.nonNullable.control('', [Validators.required]),
      zipCode: this.formBuilder.nonNullable.control('', [Validators.required]),
      latitude: this.formBuilder.nonNullable.control(0),
      longitude: this.formBuilder.nonNullable.control(0),
      addressLineExtra: this.formBuilder.nonNullable.control(''),
    }),
  });

  protected readonly delivererForm: FormGroup = this.formBuilder.group({
    username: this.formBuilder.nonNullable.control('', [Validators.required, Validators.minLength(3)]),
    email: this.formBuilder.nonNullable.control('', [Validators.required, Validators.email]),
    password: this.formBuilder.nonNullable.control('', [Validators.required, Validators.minLength(8)]),
    phoneNumber: this.formBuilder.nonNullable.control('', [Validators.required]),
  });

  protected readonly restaurantForm: FormGroup = this.formBuilder.group({
    restaurantName: this.formBuilder.nonNullable.control('', [Validators.required]),
    restaurantOwner: this.formBuilder.group({
      username: this.formBuilder.nonNullable.control('', [Validators.required, Validators.minLength(3)]),
      email: this.formBuilder.nonNullable.control('', [Validators.required, Validators.email]),
      password: this.formBuilder.nonNullable.control('', [Validators.required, Validators.minLength(8)]),
      phoneNumber: this.formBuilder.nonNullable.control('', [Validators.required]),
    }),
    address: this.formBuilder.group({
      streetNumber: this.formBuilder.control<number | null>(null, [Validators.required, Validators.min(1)]),
      addressLine: this.formBuilder.nonNullable.control('', [Validators.required]),
      city: this.formBuilder.nonNullable.control('', [Validators.required]),
      zipCode: this.formBuilder.nonNullable.control('', [Validators.required]),
      latitude: this.formBuilder.nonNullable.control(0),
      longitude: this.formBuilder.nonNullable.control(0),
      addressLineExtra: this.formBuilder.nonNullable.control(''),
    }),
  });

  protected get activeForm(): FormGroup {
    switch (this.activeTab()) {
      case SignupTabs.CLIENT: return this.clientForm;
      case SignupTabs.DELIVERER: return this.delivererForm;
      case SignupTabs.RESTAURANT: return this.restaurantForm;
    }
  }

  setTab(tab: SignupTabs): void {
    this.activeTab.set(tab);
    this.state.set(createState<void>());
  }

  handleSignupClick(): void {
    const form = this.activeForm;
    if (form.invalid) {
      form.markAllAsTouched();
      return;
    }

    const role = this.getRole(this.activeTab());
    executeObservable(
      this.authService.signup$(form.getRawValue() as SignupDto, role),
      {
        state: this.state,
        destroyRef: this.destroyRef,
        onSuccess: () => this.handleSignupSuccess(),
        onError: () => this.handleSignupFailure(),
      },
    );
  }

  private handleSignupSuccess(): void {
    let email = '';
    let password = '';

    if (this.activeTab() === SignupTabs.RESTAURANT) {
      email = this.restaurantForm.get('restaurantOwner.email')?.value ?? '';
      password = this.restaurantForm.get('restaurantOwner.password')?.value ?? '';
    } else {
      email = this.activeForm.get('email')?.value ?? '';
      password = this.activeForm.get('password')?.value ?? '';
    }

    this.router.navigate(['/login'], {
      state: { prefill: { email, password } },
    });
  }

  private handleSignupFailure(): void {
    // state().error is already populated by executeObservable
  }

  private getRole(tab: SignupTabs): UserRoles {
    const rolesMap: Record<SignupTabs, UserRoles> = {
      [SignupTabs.CLIENT]: 'client',
      [SignupTabs.RESTAURANT]: 'restaurant',
      [SignupTabs.DELIVERER]: 'deliverer',
    };
    return rolesMap[tab];
  }

  protected readonly SignupTabs = SignupTabs;
}
