import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
  WritableSignal,
} from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RestaurantMenuService } from './restaurant-menu.service';
import { AuthStore } from '../../../../store/auth.store';
import { RestaurantUserType } from '../../../../core/types/user.type';
import { ComponentState, createState } from '../../../../core/types/state.types';
import { executeObservable } from '../../../../core/utils/observables.utils';
import { AllergenType, CreatePlateRequest, PlateResponse, UpdatePlateRequest } from './restaurant-menu.types';

@Component({
  selector: 'app-restaurant-menu',
  imports: [FormsModule, ReactiveFormsModule],
  templateUrl: './restaurant-menu.html',
  styleUrl: './restaurant-menu.css',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RestaurantMenu implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly menuService = inject(RestaurantMenuService);
  private readonly authStore = inject(AuthStore);

  protected readonly Math = Math;
  protected readonly selectedPlate = signal<PlateResponse | null>(null);
  protected readonly allergens = signal<AllergenType[]>([]);
  protected readonly selectedAllergen = signal<AllergenType | ''>('');
  protected readonly AllergenType = AllergenType;
  protected readonly allergenOptions = Object.values(AllergenType);
  protected readonly searchQuery = signal('');

  protected readonly platesState: WritableSignal<ComponentState<PlateResponse[]>> = signal(
    createState<PlateResponse[]>(),
  );
  protected readonly mutationState: WritableSignal<ComponentState<void>> = signal(
    createState<void>(),
  );

  protected readonly filteredPlates = computed(() => {
    const q = this.searchQuery().toLowerCase();
    return (this.platesState().data ?? []).filter((p) =>
      p.name.toLowerCase().includes(q),
    );
  });

  protected readonly plateForm = this.fb.group({
    name: this.fb.nonNullable.control('', [Validators.required]),
    description: this.fb.nonNullable.control('', [Validators.required]),
    dailyStock: this.fb.nonNullable.control(0, [Validators.required, Validators.min(0)]),
    unitPrice: this.fb.nonNullable.control(0, [Validators.required, Validators.min(0.01)]),
    imageUrl: this.fb.control(''),
  });

  private get restaurantId(): string {
    return (this.authStore.user() as RestaurantUserType).restaurantId;
  }

  ngOnInit(): void {
    this.loadPlates();
  }

  protected loadPlates(): void {
    executeObservable(this.menuService.getPlates$(this.restaurantId), {
      state: this.platesState,
      destroyRef: this.destroyRef,
    });
  }

  selectPlate(plate: PlateResponse): void {
    this.selectedPlate.set(plate);
    this.allergens.set((plate.allergens ?? []) as AllergenType[]);
    this.plateForm.patchValue({
      name: plate.name,
      description: plate.description,
      dailyStock: plate.dailyStock,
      unitPrice: plate.unitPrice,
      imageUrl: plate.imageUrl ?? '',
    });
  }

  clearSelection(): void {
    this.selectedPlate.set(null);
    this.allergens.set([]);
    this.selectedAllergen.set('');
    this.plateForm.reset();
  }

  addAllergen(): void {
    const val = this.selectedAllergen();
    if (val && !this.allergens().includes(val)) {
      this.allergens.update((a) => [...a, val]);
    }
    this.selectedAllergen.set('');
  }

  removeAllergen(allergen: AllergenType): void {
    this.allergens.update((a) => a.filter((x) => x !== allergen));
  }

  onCreate(): void {
    if (this.plateForm.invalid) {
      this.plateForm.markAllAsTouched();
      return;
    }
    const value = this.plateForm.getRawValue();
    const payload: CreatePlateRequest = {
      name: value.name,
      description: value.description,
      dailyStock: value.dailyStock,
      unitPrice: value.unitPrice,
      allergens: this.allergens(),
      ...(value.imageUrl ? { imageUrl: value.imageUrl } : {}),
    };

    executeObservable(this.menuService.createPlate$(this.restaurantId, payload), {
      state: this.mutationState,
      destroyRef: this.destroyRef,
      onSuccess: () => {
        this.clearSelection();
        this.loadPlates();
      },
    });
  }

  onSaveChanges(): void {
    if (this.plateForm.invalid) {
      this.plateForm.markAllAsTouched();
      return;
    }
    const value = this.plateForm.getRawValue();
    const payload: UpdatePlateRequest = {
      name: value.name,
      description: value.description,
      dailyStock: value.dailyStock,
      unitPrice: value.unitPrice,
      imageUrl: value.imageUrl ?? undefined,
      allergens: this.allergens(),
    };

    executeObservable(
      this.menuService.updatePlate$(this.restaurantId, this.selectedPlate()!.id, payload),
      {
        state: this.mutationState,
        destroyRef: this.destroyRef,
        onSuccess: () => {
          this.clearSelection();
          this.loadPlates();
        },
      },
    );
  }

  onDelete(): void {
    executeObservable(
      this.menuService.deletePlate$(this.restaurantId, this.selectedPlate()!.id),
      {
        state: this.mutationState,
        destroyRef: this.destroyRef,
        onSuccess: () => {
          this.clearSelection();
          this.loadPlates();
        },
      },
    );
  }
}
