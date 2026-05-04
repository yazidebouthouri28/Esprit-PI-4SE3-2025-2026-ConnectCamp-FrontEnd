import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { map, catchError, shareReplay, tap } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../environments/environment';

export interface CountryInfo {
  code: string;
  name: string;
  vatRate: number;
  currency: string;
  currencySymbol: string;
  shippingZone: string;
  isEU: boolean;
}

export interface UserLocation {
  country?: string;
  countryCode: string;
  detectedVia: 'browser' | 'ip' | 'manual';
}

@Injectable({ providedIn: 'root' })
export class GeolocationService {

  private readonly STORAGE_KEY = 'connectcamp_user_location';

  private readonly defaultLocation: UserLocation = {
    countryCode: 'FR',
    country: 'France',
    detectedVia: 'manual'
  };

  private readonly vatRates: Record<string, number> = {
    FR: 20, DE: 19, ES: 21, IT: 22, BE: 21, NL: 21,
    TN: 19, US: 0, CA: 5, GB: 20, CN: 13, JP: 10, AE: 5
  };

  private readonly currencies: Record<string, { code: string; symbol: string }> = {
    FR: { code: 'EUR', symbol: '€' },
    DE: { code: 'EUR', symbol: '€' },
    ES: { code: 'EUR', symbol: '€' },
    IT: { code: 'EUR', symbol: '€' },
    TN: { code: 'TND', symbol: 'د.ت' },
    US: { code: 'USD', symbol: '$' },
    GB: { code: 'GBP', symbol: '£' },
    CA: { code: 'CAD', symbol: 'C$' },
    CN: { code: 'CNY', symbol: '¥' },
    JP: { code: 'JPY', symbol: '¥' },
    AE: { code: 'AED', symbol: 'د.إ' }
  };

  private locationSubject = new BehaviorSubject<UserLocation>(this.defaultLocation);
  location$ = this.locationSubject.asObservable();

  private countriesCache$: Observable<CountryInfo[]> | null = null;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.loadFromStorage();
  }

  // =========================
  // REQUIRED METHODS (FIX ERROR TS2339)
  // =========================

  getVatRateForCountry(code: string): number {
    return this.vatRates[code?.toUpperCase()] ?? 0;
  }

  getCurrencyForCountry(code: string) {
    return this.currencies[code?.toUpperCase()] ?? { code: 'EUR', symbol: '€' };
  }

  getAvailableCountries(): Observable<CountryInfo[]> {
    if (this.countriesCache$) return this.countriesCache$;

    this.countriesCache$ = this.http
      .get<any>(`${environment.apiUrl}/api/products/price/available-countries`)
      .pipe(
        map(res => {
          const raw: any[] = res?.data ?? res ?? [];
          return raw.map(c => ({
            code: c.countryCode ?? c.code,
            name: c.label ?? c.name,
            vatRate: c.vatRate ?? 0,
            currency: c.currency ?? 'EUR',
            currencySymbol: c.currencySymbol ?? '€',
            shippingZone: c.shippingZone ?? 'OTHER',
            isEU: c.isEU ?? false
          }));
        }),
        catchError(() => of([])),
        shareReplay(1)
      );

    return this.countriesCache$;
  }

  // =========================
  // LOCATION
  // =========================

  detectLocation(): Observable<UserLocation> {

    if (!isPlatformBrowser(this.platformId)) {
      return of(this.defaultLocation);
    }

    return new Observable<UserLocation>(observer => {

      if (!navigator.geolocation) {
        this.fallbackIP().subscribe(loc => {
          observer.next(loc);
          observer.complete();
        });
        return;
      }

      navigator.geolocation.getCurrentPosition(
        () => this.fallbackIP().subscribe(loc => {
          observer.next(loc);
          observer.complete();
        }),
        () => this.fallbackIP().subscribe(loc => {
          observer.next(loc);
          observer.complete();
        })
      );
    });
  }

  setCountry(code: string): void {
    const loc: UserLocation = {
      countryCode: code,
      detectedVia: 'manual'
    };

    this.persist(loc);
  }

  getCurrentCountryCode(): string {
    return this.locationSubject.value.countryCode;
  }

  // =========================
  // FIX TYPE ERROR (IMPORTANT)
  // =========================

  private fallbackIP(): Observable<UserLocation> {
    return this.http.get<any>('https://ipapi.co/json/').pipe(
      map(r => ({
        countryCode: r.country_code ?? 'FR',
        country: r.country_name ?? 'France',
        detectedVia: 'ip' as const   // 🔥 FIX TS2322
      })),
      catchError(() => of(this.defaultLocation))
    );
  }

  // =========================
  // STORAGE
  // =========================

  private persist(loc: UserLocation): void {
    this.locationSubject.next(loc);

    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(loc));
    }
  }

  private loadFromStorage(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const raw = localStorage.getItem(this.STORAGE_KEY);
    if (raw) {
      this.locationSubject.next(JSON.parse(raw));
    }
  }
}
