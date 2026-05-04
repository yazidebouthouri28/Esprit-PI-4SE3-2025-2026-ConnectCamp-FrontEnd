import { Component, OnInit, OnDestroy, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { GeolocationService, CountryInfo } from '../../services/geolocation.service';

@Component({
  selector: 'app-country-selector',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="relative inline-block" #selectorRef>

      <!-- Trigger button -->
      <button
        type="button"
        (click)="toggleDropdown()"
        class="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300
               rounded-lg shadow-sm text-sm font-medium text-gray-700
               hover:border-blue-400 hover:bg-gray-50 transition-colors duration-150
               focus:outline-none focus:ring-2 focus:ring-blue-400">
        <span class="text-xl leading-none">{{ getFlag(selectedCountry?.code ?? 'FR') }}</span>
        <span class="hidden sm:inline">{{ selectedCountry?.name ?? 'France' }}</span>
        <span class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold
                     bg-green-100 text-green-800">
          {{ selectedCountry?.vatRate ?? 20 }}% TVA
        </span>
        <svg class="w-4 h-4 text-gray-400 transition-transform duration-150"
             [class.rotate-180]="isOpen"
             fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
        </svg>
      </button>

      <!-- Dropdown -->
      <div *ngIf="isOpen"
           class="absolute right-0 mt-1 w-72 bg-white border border-gray-200
                  rounded-xl shadow-xl z-50 overflow-hidden">

        <!-- Search -->
        <div class="p-2 border-b border-gray-100">
          <input
            type="text"
            [(ngModel)]="searchTerm"
            placeholder="Rechercher un pays…"
            autofocus
            class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg
                   focus:outline-none focus:ring-2 focus:ring-blue-400"/>
        </div>

        <!-- Detecting indicator -->
        <div *ngIf="isDetecting"
             class="flex items-center gap-2 px-4 py-3 text-sm text-gray-500">
          <svg class="animate-spin w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          Détection en cours…
        </div>

        <!-- Country list -->
        <ul class="max-h-64 overflow-y-auto divide-y divide-gray-50">
          <li *ngFor="let country of filteredCountries">
            <button
              type="button"
              (click)="selectCountry(country)"
              class="w-full flex items-center gap-3 px-4 py-2.5 text-sm
                     hover:bg-blue-50 transition-colors duration-100 text-left"
              [class.bg-blue-50]="country.code === selectedCountry?.code"
              [class.font-semibold]="country.code === selectedCountry?.code">
              <span class="text-xl w-6 text-center leading-none">{{ getFlag(country.code) }}</span>
              <span class="flex-1 text-gray-800">{{ country.name }}</span>
              <span class="text-xs font-semibold px-2 py-0.5 rounded-full"
                    [class.bg-green-100]="country.vatRate > 0"
                    [class.text-green-700]="country.vatRate > 0"
                    [class.bg-gray-100]="country.vatRate === 0"
                    [class.text-gray-500]="country.vatRate === 0">
                {{ country.vatRate > 0 ? country.vatRate + '% TVA' : 'Hors taxe' }}
              </span>
              <svg *ngIf="country.code === selectedCountry?.code"
                   class="w-4 h-4 text-blue-500 flex-shrink-0"
                   fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
            </button>
          </li>
          <li *ngIf="filteredCountries.length === 0"
              class="px-4 py-3 text-sm text-gray-400 text-center">
            Aucun pays trouvé
          </li>
        </ul>
      </div>

    </div>
  `
})
export class CountrySelectorComponent implements OnInit, OnDestroy {

  @Output() countryChange = new EventEmitter<string>();

  isOpen = false;
  isDetecting = false;
  searchTerm = '';
  selectedCountry: CountryInfo | null = null;
  countries: CountryInfo[] = [];

  private destroy$ = new Subject<void>();

  private readonly flags: Record<string, string> = {
    FR: '🇫🇷', DE: '🇩🇪', ES: '🇪🇸', IT: '🇮🇹', BE: '🇧🇪', NL: '🇳🇱', LU: '🇱🇺',
    TN: '🇹🇳', US: '🇺🇸', CA: '🇨🇦', GB: '🇬🇧', CN: '🇨🇳', JP: '🇯🇵', AE: '🇦🇪',
    MA: '🇲🇦', DZ: '🇩🇿', SA: '🇸🇦', QA: '🇶🇦', KR: '🇰🇷', SG: '🇸🇬'
  };

  constructor(private geoService: GeolocationService) {}

  ngOnInit(): void {
    // Load country list
    this.geoService.getAvailableCountries()
      .pipe(takeUntil(this.destroy$))
      .subscribe(countries => { this.countries = countries; });

    // Subscribe to reactive location changes
    this.geoService.location$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loc => {
        const match = this.countries.find(c => c.code === loc.countryCode);
        if (match) this.selectedCountry = match;
      });

    // Trigger detection
    this.isDetecting = true;
    this.geoService.detectLocation()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: loc => {
          this.isDetecting = false;
          const match = this.countries.find(c => c.code === loc.countryCode);
          if (match && !this.selectedCountry) {
            this.selectedCountry = match;
            this.countryChange.emit(match.code);
          }
        },
        error: () => { this.isDetecting = false; }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get filteredCountries(): CountryInfo[] {
    if (!this.searchTerm.trim()) return this.countries;
    const term = this.searchTerm.toLowerCase();
    return this.countries.filter(c =>
      c.name.toLowerCase().includes(term) || c.code.toLowerCase().includes(term)
    );
  }

  toggleDropdown(): void {
    this.isOpen = !this.isOpen;
    if (!this.isOpen) this.searchTerm = '';
  }

  selectCountry(country: CountryInfo): void {
    this.selectedCountry = country;
    this.geoService.setCountry(country.code);
    this.countryChange.emit(country.code);
    this.isOpen = false;
    this.searchTerm = '';
  }

  getFlag(code: string): string {
    return this.flags[code] ?? '🌍';
  }

  /** Close dropdown when clicking outside */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('app-country-selector')) {
      this.isOpen = false;
      this.searchTerm = '';
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.isOpen = false;
    this.searchTerm = '';
  }
}
