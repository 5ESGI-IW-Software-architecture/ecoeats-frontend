import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
  WritableSignal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { from, switchMap } from 'rxjs';
import { AuthStore } from '../../../../store/auth.store';
import { RestaurantUserType } from '../../../../core/types/user.type';
import { ComponentState, createState } from '../../../../core/types/state.types';
import { executeObservable } from '../../../../core/utils/observables.utils';
import { RestaurantProfileService } from './restaurant-profile.service';
import { RestaurantProfileResponse } from './restaurant-profile.types';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';

@Component({
  selector: 'app-restaurant-profile',
  imports: [ReactiveFormsModule],
  templateUrl: './restaurant-profile.html',
  styleUrl: './restaurant-profile.css',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RestaurantProfile implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly profileService = inject(RestaurantProfileService);
  private readonly authStore = inject(AuthStore);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly isEditMode = signal(false);
  protected readonly showDeleteConfirm = signal(false);

  protected readonly profileState: WritableSignal<ComponentState<RestaurantProfileResponse>> =
    signal(createState<RestaurantProfileResponse>());
  protected readonly identityState: WritableSignal<ComponentState<void>> = signal(createState());
  protected readonly addressState: WritableSignal<ComponentState<void>> = signal(createState());
  protected readonly passwordState: WritableSignal<ComponentState<void>> = signal(createState());
  protected readonly configState: WritableSignal<ComponentState<void>> = signal(createState());
  protected readonly deleteState: WritableSignal<ComponentState<void>> = signal(createState());

  protected readonly identityForm = this.fb.group({
    restaurantName: this.fb.nonNullable.control('', [Validators.required]),
    username: this.fb.nonNullable.control('', [Validators.required]),
    email: this.fb.nonNullable.control('', [Validators.required, Validators.email]),
    phoneNumber: this.fb.nonNullable.control('', [Validators.required]),
  });

  protected readonly addressForm = this.fb.group({
    streetNumber: this.fb.nonNullable.control(0, [Validators.required]),
    addressLine: this.fb.nonNullable.control('', [Validators.required]),
    addressLineExtra: this.fb.nonNullable.control(''),
    city: this.fb.nonNullable.control('', [Validators.required]),
    zipCode: this.fb.nonNullable.control('', [Validators.required]),
  });

  protected readonly passwordForm = this.fb.group({
    currentPassword: this.fb.nonNullable.control('', [Validators.required]),
    newPassword: this.fb.nonNullable.control('', [
      Validators.required,
      Validators.minLength(8),
    ]),
    confirmPassword: this.fb.nonNullable.control('', [Validators.required]),
  });

  protected readonly configForm = this.fb.group({
    resetTime: this.fb.nonNullable.control('00:00', [Validators.required]),
  });

  private get restaurantId(): string {
    return (this.authStore.user() as RestaurantUserType).restaurantId;
  }

  ngOnInit(): void {
    this.prefillFromStore();
    this.loadProfile();
  }

  private prefillFromStore(): void {
    const user = this.authStore.user() as RestaurantUserType;
    this.identityForm.patchValue({
      restaurantName: user.restaurantName,
      username: user.username,
      email: user.email,
      phoneNumber: user.phoneNumber,
    });
    if (user.restaurantAddress) {
      this.addressForm.patchValue({
        streetNumber: user.restaurantAddress.streetNumber,
        addressLine: user.restaurantAddress.addressLine,
        addressLineExtra: user.restaurantAddress.addressLineExtra,
        city: user.restaurantAddress.city,
        zipCode: user.restaurantAddress.zipCode,
      });
    }
    if (user.dailyStockResetTime) {
      this.configForm.patchValue({ resetTime: user.dailyStockResetTime });
    }
  }

  private loadProfile(): void {
    executeObservable(this.profileService.getProfile$(this.restaurantId), {
      state: this.profileState,
      destroyRef: this.destroyRef,
      onSuccess: (profile) => {
        this.identityForm.patchValue({ restaurantName: profile.name });
        if (profile.address) {
          this.addressForm.patchValue({
            streetNumber: profile.address.streetNumber,
            addressLine: profile.address.addressLine,
            addressLineExtra: profile.address.addressLineExtra,
            city: profile.address.city,
            zipCode: profile.address.zipCode,
          });
        }
      },
    });
  }

  protected enterEditMode(): void {
    this.isEditMode.set(true);
    this.showDeleteConfirm.set(false);
  }

  protected cancelEditMode(): void {
    this.isEditMode.set(false);
    this.showDeleteConfirm.set(false);
    this.passwordForm.reset();

    const user = this.authStore.user() as RestaurantUserType;
    this.identityForm.patchValue({
      username: user.username,
      email: user.email,
      phoneNumber: user.phoneNumber,
    });

    const profile = this.profileState().data;
    if (profile) {
      this.identityForm.patchValue({ restaurantName: profile.name });
      if (profile.address) {
        this.addressForm.patchValue({
          streetNumber: profile.address.streetNumber,
          addressLine: profile.address.addressLine,
          addressLineExtra: profile.address.addressLineExtra,
          city: profile.address.city,
          zipCode: profile.address.zipCode,
        });
      }
    } else {
      this.prefillFromStore();
    }
  }

  protected onSaveIdentity(): void {
    if (this.identityForm.invalid) {
      this.identityForm.markAllAsTouched();
      return;
    }
    const { restaurantName, username, email, phoneNumber } = this.identityForm.getRawValue();
    executeObservable(
      this.profileService.updateProfile$(this.restaurantId, {
        restaurantName,
        restaurantOwner: { username, email, phoneNumber },
      }),
      { state: this.identityState, destroyRef: this.destroyRef },
    );
  }

  protected onSaveAddress(): void {
    if (this.addressForm.invalid) {
      this.addressForm.markAllAsTouched();
      return;
    }
    const addr = this.addressForm.getRawValue();
    executeObservable(
      from(this.geocodeAddress(addr)).pipe(
        switchMap((coords) =>
          this.profileService.updateProfile$(this.restaurantId, {
            address: {
              ...addr,
              latitude: coords?.latitude ?? 0,
              longitude: coords?.longitude ?? 0,
            },
          }),
        ),
      ),
      { state: this.addressState, destroyRef: this.destroyRef },
    );
  }

  protected onChangePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }
    const { currentPassword, newPassword, confirmPassword } = this.passwordForm.getRawValue();
    if (newPassword !== confirmPassword) {
      return;
    }
    executeObservable(
      this.profileService.changePassword$(this.restaurantId, { currentPassword, newPassword }),
      {
        state: this.passwordState,
        destroyRef: this.destroyRef,
        onSuccess: () => this.passwordForm.reset(),
      },
    );
  }

  protected onSaveConfig(): void {
    if (this.configForm.invalid) {
      this.configForm.markAllAsTouched();
      return;
    }
    const { resetTime } = this.configForm.getRawValue();
    executeObservable(
      this.profileService.setResetTime$(this.restaurantId, resetTime),
      { state: this.configState, destroyRef: this.destroyRef },
    );
  }

  protected requestDelete(): void {
    this.showDeleteConfirm.set(true);
  }

  protected cancelDelete(): void {
    this.showDeleteConfirm.set(false);
  }

  protected confirmDelete(): void {
    executeObservable(this.profileService.deleteProfile$(this.restaurantId), {
      state: this.deleteState,
      destroyRef: this.destroyRef,
      onSuccess: () => {
        this.authService.clearTokens();
        this.authStore.clearUser();
        this.router.navigate(['/login']);
      },
    });
  }

  protected get passwordMismatch(): boolean {
    const { newPassword, confirmPassword } = this.passwordForm.getRawValue();
    return !!confirmPassword && !!newPassword && newPassword !== confirmPassword;
  }

  private async geocodeAddress(addr: {
    streetNumber: number;
    addressLine: string;
    city: string;
    zipCode: string;
  }): Promise<{ latitude: number; longitude: number } | null> {
    const query = `${addr.streetNumber} ${addr.addressLine}, ${addr.city}, ${addr.zipCode}`;
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
    try {
      const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
      const [result] = await res.json();
      if (!result) return null;
      return { latitude: parseFloat(result.lat), longitude: parseFloat(result.lon) };
    } catch {
      return null;
    }
  }
}
