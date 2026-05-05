import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
  WritableSignal,
} from '@angular/core';
import { AuthBg } from '../../shared/components/auth-bg/auth-bg';
import { AddressAutocomplete, PhotonAddress } from '../../shared/components/address-autocomplete/address-autocomplete';
import { AuthService } from '../../core/auth/auth.service';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SignupDto, UserRoles } from '../../core/auth/auth.types';
import { ComponentState, createState } from '../../core/types/state.types';
import { executeObservable } from '../../core/utils/observables.utils';
import { Router } from '@angular/router';
import { from, switchMap } from 'rxjs';

export enum SignupTabs {
  CLIENT = 'CLIENT',
  RESTAURANT = 'RESTAURANT',
  DELIVERER = 'DELIVERER',
}

const TABS_WITH_ADDRESS = [SignupTabs.CLIENT, SignupTabs.RESTAURANT];

@Component({
  selector: 'app-signup',
  imports: [AuthBg, ReactiveFormsModule, AddressAutocomplete],
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
    ...this.createUserFields().controls,
    defaultAddress: this.createAddressFields(),
  });

  protected readonly delivererForm: FormGroup = this.createUserFields();

  protected readonly restaurantForm: FormGroup = this.formBuilder.group({
    restaurantName: this.formBuilder.nonNullable.control('', [Validators.required]),
    restaurantOwner: this.createUserFields(),
    address: this.createAddressFields(),
  });

  private createUserFields(): FormGroup {
    return this.formBuilder.group({
      username: this.formBuilder.nonNullable.control('', [
        Validators.required,
        Validators.minLength(3),
      ]),
      email: this.formBuilder.nonNullable.control('', [Validators.required, Validators.email]),
      password: this.formBuilder.nonNullable.control('', [
        Validators.required,
        Validators.minLength(8),
      ]),
      phoneNumber: this.formBuilder.nonNullable.control('', [Validators.required]),
    });
  }

  private createAddressFields(): FormGroup {
    return this.formBuilder.group({
      streetNumber: this.formBuilder.control<number | null>(null, [
        Validators.required,
        Validators.min(1),
      ]),
      addressLine: this.formBuilder.nonNullable.control('', [Validators.required]),
      city: this.formBuilder.nonNullable.control('', [Validators.required]),
      zipCode: this.formBuilder.nonNullable.control('', [Validators.required]),
      latitude: this.formBuilder.nonNullable.control(0),
      longitude: this.formBuilder.nonNullable.control(0),
      addressLineExtra: this.formBuilder.nonNullable.control(''),
    });
  }

  protected get activeForm(): FormGroup {
    switch (this.activeTab()) {
      case SignupTabs.CLIENT:
        return this.clientForm;
      case SignupTabs.DELIVERER:
        return this.delivererForm;
      case SignupTabs.RESTAURANT:
        return this.restaurantForm;
    }
  }

  onClientAddressSelected(addr: PhotonAddress): void {
    this.clientForm.get('defaultAddress')?.patchValue({
      streetNumber: addr.streetNumber ? parseInt(addr.streetNumber, 10) : null,
      addressLine: addr.addressLine,
      city: addr.city,
      zipCode: addr.zipCode,
      latitude: addr.latitude,
      longitude: addr.longitude,
    });
  }

  onRestaurantAddressSelected(addr: PhotonAddress): void {
    this.restaurantForm.get('address')?.patchValue({
      streetNumber: addr.streetNumber ? parseInt(addr.streetNumber, 10) : null,
      addressLine: addr.addressLine,
      city: addr.city,
      zipCode: addr.zipCode,
      latitude: addr.latitude,
      longitude: addr.longitude,
    });
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

    const tab = this.activeTab();
    const geocode$ = TABS_WITH_ADDRESS.includes(tab)
      ? from(this.geocodeAddress(tab))
      : from(Promise.resolve(null));

    executeObservable(
      geocode$.pipe(
        switchMap((coords) => {
          if (coords) this.patchCoords(tab, coords);
          return this.authService.signup$(form.getRawValue() as SignupDto, this.getRole(tab));
        }),
      ),
      {
        state: this.state,
        destroyRef: this.destroyRef,
        onSuccess: () => this.handleSignupSuccess(),
        onError: (error) => console.error('Signup failed:', error),
      },
    )
  }

  private async geocodeAddress(
    tab: SignupTabs,
  ): Promise<{ latitude: number; longitude: number } | null> {
    const addressGroup =
      tab === SignupTabs.CLIENT
        ? this.activeForm.get('defaultAddress')
        : this.activeForm.get('address');

    if (!addressGroup) return null;

    const { streetNumber, addressLine, city, zipCode } = addressGroup.value;
    const query = `${streetNumber} ${addressLine}, ${city}, ${zipCode}`;
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;

    try {
      const res = await fetch(url, {
        headers: { 'Accept-Language': 'en' },
      });
      const [result] = await res.json();
      if (!result) return null;

      return {
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
      };
    } catch {
      return null;
    }
  }

  private patchCoords(tab: SignupTabs, coords: { latitude: number; longitude: number }): void {
    const addressPath = tab === SignupTabs.CLIENT ? 'defaultAddress' : 'address';
    this.activeForm.get(addressPath)?.patchValue(coords);
  }

  private handleSignupSuccess(): void {
    console.log('Success !')
    const { email, password } = this.getCredentials();
    this.router.navigate(['/login'], {
     state: { prefill: { email, password, userRole: this.getRole(this.activeTab()), displayActivationDialog: true } },
    });
  }

  private getCredentials(): { email: string; password: string } {
    const prefix = this.activeTab() === SignupTabs.RESTAURANT ? 'restaurantOwner.' : '';
    return {
      email: this.activeForm.get(`${prefix}email`)?.value ?? '',
      password: this.activeForm.get(`${prefix}password`)?.value ?? '',
    };
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
