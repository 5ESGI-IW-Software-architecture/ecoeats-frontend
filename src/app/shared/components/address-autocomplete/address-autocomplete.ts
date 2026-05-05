import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
  signal,
} from '@angular/core';

export interface PhotonAddress {
  streetNumber: string;
  addressLine: string;
  city: string;
  zipCode: string;
  latitude: number;
  longitude: number;
}

interface PhotonFeature {
  geometry: { coordinates: [number, number] };
  properties: {
    name?: string;
    street?: string;
    housenumber?: string;
    city?: string;
    town?: string;
    village?: string;
    postcode?: string;
    country?: string;
  };
}

@Component({
  selector: 'app-address-autocomplete',
  templateUrl: './address-autocomplete.html',
  styleUrl: './address-autocomplete.css',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddressAutocomplete {
  @Input() placeholder = 'Search for an address…';
  @Input() inputClass = '';
  @Output() addressSelected = new EventEmitter<PhotonAddress>();

  protected readonly query = signal('');
  protected readonly suggestions = signal<PhotonFeature[]>([]);
  protected readonly loading = signal(false);
  protected readonly open = signal(false);

  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private readonly el: ElementRef) {}

  @HostListener('document:click', ['$event.target'])
  onDocumentClick(target: EventTarget | null): void {
    if (target instanceof HTMLElement && !this.el.nativeElement.contains(target)) {
      this.open.set(false);
    }
  }

  onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.query.set(value);
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    if (value.trim().length < 3) {
      this.suggestions.set([]);
      this.open.set(false);
      return;
    }
    this.debounceTimer = setTimeout(() => this.search(value.trim()), 350);
  }

  private async search(q: string): Promise<void> {
    this.loading.set(true);
    try {
      const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=5`);
      const data: { features: PhotonFeature[] } = await res.json();
      this.suggestions.set(data.features ?? []);
      this.open.set((data.features ?? []).length > 0);
    } catch {
      this.suggestions.set([]);
      this.open.set(false);
    } finally {
      this.loading.set(false);
    }
  }

  protected select(feature: PhotonFeature): void {
    const p = feature.properties;
    const [lng, lat] = feature.geometry.coordinates;
    this.addressSelected.emit({
      streetNumber: p.housenumber ?? '',
      addressLine: p.street ?? p.name ?? '',
      city: p.city ?? p.town ?? p.village ?? '',
      zipCode: p.postcode ?? '',
      latitude: lat,
      longitude: lng,
    });
    this.query.set(this.formatLabel(feature));
    this.open.set(false);
    this.suggestions.set([]);
  }

  protected formatLabel(feature: PhotonFeature): string {
    const p = feature.properties;
    const street = p.housenumber
      ? `${p.housenumber} ${p.street ?? ''}`.trim()
      : (p.street ?? p.name ?? '');
    return [street, p.city ?? p.town ?? p.village, p.postcode, p.country]
      .filter(Boolean)
      .join(', ');
  }
}
