import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { GeolocationService } from './geolocation.service';
import { Inject } from '@angular/core';


// ---------------------------------------------------------------
// Request / Response interfaces
// ---------------------------------------------------------------

export interface PriceCalculationRequest {
  productId: number;
  variantId?: number;
  countryCode?: string;
  postalCode?: string;
  quantity?: number;
}

export interface TaxBreakdown {
  zone: string;
  rate: number;
  amount: number;
}

export interface ShippingBreakdown {
  zone: string;
  multiplier: number;
  baseCost: number;
  finalCost: number;
  isFree: boolean;
  freeShippingReason?: string;
  estimatedDeliveryMin: string;
  estimatedDeliveryMax: string;
}

export interface PriceBreakdown {
  productId: number;
  productName: string;
  variantId?: number;
  requestedCountry: string;
  basePrice: number;
  discountAmount: number;
  discountPercentage: number;
  priceAfterDiscount: number;
  tax: TaxBreakdown;
  customsFees: number;
  shipping: ShippingBreakdown;
  subtotalHT: number;
  totalTax: number;
  totalShipping: number;
  totalCustoms: number;
  totalPrice: number;
  inStock: boolean;
  availableQuantity: number;
  currency: string;
  currencySymbol: string;
}

export interface CartTotals {
  subtotal: number;
  tax: number;
  shipping: number;
  customs: number;
  total: number;
  currency: string;
  currencySymbol: string;
}

// ---------------------------------------------------------------
// Service
// ---------------------------------------------------------------

@Injectable({ providedIn: 'root' })
export class PriceCalculationService {

  private readonly baseUrl = `${environment.apiUrl}/api/products`;

  constructor(
    private http: HttpClient,
    @Inject(GeolocationService) private geoService: GeolocationService
  ) {}

  /**
   * GET /api/products/{id}/price
   * Returns full price breakdown for a product, localised to a country.
   */
  calculatePrice(request: PriceCalculationRequest): Observable<PriceBreakdown> {
    const countryCode = request.countryCode ?? this.geoService.getCurrentCountryCode();

    let params = new HttpParams()
      .set('country',  countryCode)
      .set('quantity', String(request.quantity ?? 1));

    if (request.variantId != null) params = params.set('variantId', String(request.variantId));
    if (request.postalCode)        params = params.set('postalCode', request.postalCode);

    return this.http
      .get<any>(`${this.baseUrl}/${request.productId}/price`, { params })
      .pipe(
        map(res => this.mapPriceBreakdown(res?.data ?? res)),
        catchError(() => of(this.buildFallbackBreakdown(request.productId, countryCode)))
      );
  }

  /**
   * POST /api/products/price/calculate-batch
   * Returns price breakdowns for a list of products (used in cart).
   */
  calculatePricesBatch(
    requests: PriceCalculationRequest[],
    countryCode?: string
  ): Observable<PriceBreakdown[]> {
    const country = countryCode ?? this.geoService.getCurrentCountryCode();
    const payload = requests.map(r => ({
      productId:   r.productId,
      variantId:   r.variantId ?? null,
      countryCode: country,
      postalCode:  r.postalCode ?? null,
      quantity:    r.quantity ?? 1
    }));

    return this.http
      .post<any>(`${this.baseUrl}/price/calculate-batch`, payload)
      .pipe(
        map(res => {
          const list: any[] = res?.data ?? res ?? [];
          return list.map(item => this.mapPriceBreakdown(item));
        }),
        catchError(() => of([]))
      );
  }

  /**
   * Convenience method: calculate aggregated cart totals from a list of items.
   */
  calculateCartTotals(
    items: { productId: number; quantity: number }[],
    countryCode?: string
  ): Observable<CartTotals> {
    const country = countryCode ?? this.geoService.getCurrentCountryCode();
    const requests: PriceCalculationRequest[] = items.map(i => ({
      productId:   i.productId,
      quantity:    i.quantity,
      countryCode: country
    }));

    return this.calculatePricesBatch(requests, country).pipe(
      map(prices => {
        const subtotal  = prices.reduce((s, p) => s + p.priceAfterDiscount, 0);
        const tax       = prices.reduce((s, p) => s + p.totalTax,           0);
        const shipping  = prices.reduce((s, p) => s + p.totalShipping,      0);
        const customs   = prices.reduce((s, p) => s + p.totalCustoms,       0);
        const total     = prices.reduce((s, p) => s + p.totalPrice,         0);
        const currency  = prices[0]?.currency ?? 'EUR';
        const symbol    = prices[0]?.currencySymbol
          ?? this.geoService.getCurrencyForCountry(country).symbol;

        return { subtotal, tax, shipping, customs, total, currency, currencySymbol: symbol };
      }),
      catchError(() => of(this.buildFallbackTotals(country)))
    );
  }

  // ---------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------

  private mapPriceBreakdown(data: any): PriceBreakdown {
    return {
      productId:          data?.productId          ?? 0,
      productName:        data?.productName        ?? '',
      variantId:          data?.variantId          ?? undefined,
      requestedCountry:   data?.requestedCountry   ?? 'FR',
      basePrice:          data?.basePrice          ?? 0,
      discountAmount:     data?.discountAmount      ?? 0,
      discountPercentage: data?.discountPercentage  ?? 0,
      priceAfterDiscount: data?.priceAfterDiscount  ?? 0,
      tax: {
        zone:   data?.tax?.zone   ?? 'OTHER',
        rate:   data?.tax?.rate   ?? 0,
        amount: data?.tax?.amount ?? 0
      },
      customsFees:   data?.customsFees   ?? 0,
      shipping: {
        zone:                data?.shipping?.zone                ?? 'OTHER',
        multiplier:          data?.shipping?.multiplier          ?? 1,
        baseCost:            data?.shipping?.baseCost            ?? 0,
        finalCost:           data?.shipping?.finalCost           ?? 0,
        isFree:              data?.shipping?.isFree              ?? false,
        freeShippingReason:  data?.shipping?.freeShippingReason,
        estimatedDeliveryMin: data?.shipping?.estimatedDeliveryMin ?? '',
        estimatedDeliveryMax: data?.shipping?.estimatedDeliveryMax ?? ''
      },
      subtotalHT:        data?.subtotalHT        ?? 0,
      totalTax:          data?.totalTax          ?? 0,
      totalShipping:     data?.totalShipping      ?? 0,
      totalCustoms:      data?.totalCustoms       ?? 0,
      totalPrice:        data?.totalPrice         ?? 0,
      inStock:           data?.inStock            ?? true,
      availableQuantity: data?.availableQuantity  ?? 0,
      currency:          data?.currency           ?? 'EUR',
      currencySymbol:    data?.currencySymbol      ?? '€'
    };
  }

  private buildFallbackBreakdown(productId: number, countryCode: string): PriceBreakdown {
    const currency = this.geoService.getCurrencyForCountry(countryCode);
    return {
      productId, productName: '', requestedCountry: countryCode,
      basePrice: 0, discountAmount: 0, discountPercentage: 0, priceAfterDiscount: 0,
      tax: { zone: 'OTHER', rate: 0, amount: 0 },
      customsFees: 0,
      shipping: { zone: 'OTHER', multiplier: 1, baseCost: 0, finalCost: 0,
        isFree: false, estimatedDeliveryMin: '', estimatedDeliveryMax: '' },
      subtotalHT: 0, totalTax: 0, totalShipping: 0, totalCustoms: 0, totalPrice: 0,
      inStock: true, availableQuantity: 0,
      currency: currency.code, currencySymbol: currency.symbol
    };
  }

  private buildFallbackTotals(countryCode: string): CartTotals {
    const currency = this.geoService.getCurrencyForCountry(countryCode);
    return { subtotal: 0, tax: 0, shipping: 0, customs: 0, total: 0,
      currency: currency.code, currencySymbol: currency.symbol };
  }
}
