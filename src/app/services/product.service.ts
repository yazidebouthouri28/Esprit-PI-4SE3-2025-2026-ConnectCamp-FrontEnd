import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export const API_BASE = `${environment.apiUrl}/api`;

const unwrap = (res: any) => res?.data?.content || res?.data || res || [];
const unwrapOne = (res: any) => res?.data || res;

export interface ProductRequest {
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;
  discountPercentage?: number;
  sku?: string;
  barcode?: string;
  brand?: string;
  categoryId?: number;
  sellerId: number;
  stockQuantity?: number;
  minStockLevel?: number;
  maxStockLevel?: number;
  trackInventory?: boolean;
  images?: string[];
  thumbnail?: string;
  isFeatured?: boolean;
  isOnSale?: boolean;
  isRentable?: boolean;
  rentalPricePerDay?: number;
  weight?: number;
  dimensions?: string;
  tags?: string[];
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private url = `${API_BASE}/products`;

  constructor(private http: HttpClient) {}

  // Get all products with pagination
  getAll(page = 0, size = 10, sortBy = 'createdAt', sortDir = 'desc'): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sortBy)
      .set('sortDir', sortDir);
    return this.http.get<any>(this.url, { params }).pipe(map(res => res?.data?.content || res?.data || res || []));
  }

  getMyProducts(): Observable<any[]> {
    return this.http.get<any>(`${this.url}/my-products`).pipe(map(unwrap));
  }
  // Get product by ID
  getById(id: string): Observable<any> {
    return this.http.get<any>(`${this.url}/${id}`).pipe(map(unwrapOne));
  }

  // Get products by category
  getByCategory(categoryId: string, page = 0, size = 10): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<any>(`${this.url}/category/${categoryId}`, { params })
      .pipe(map(res => res?.data || res));
  }

  // Get products by seller
  getBySeller(sellerId: string, page = 0, size = 10): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<any>(`${this.url}/seller/${sellerId}`, { params })
      .pipe(map(res => res?.data || res));
  }

  // Search products
  search(keyword: string, page = 0, size = 10): Observable<any> {
    let params = new HttpParams()
      .set('keyword', keyword)
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<any>(`${this.url}/search`, { params })
      .pipe(map(res => res?.data || res));
  }

  // Get products by price range
  getByPriceRange(min: number, max: number, page = 0, size = 10): Observable<any> {
    let params = new HttpParams()
      .set('min', min.toString())
      .set('max', max.toString())
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<any>(`${this.url}/price-range`, { params })
      .pipe(map(res => res?.data || res));
  }

  // Get featured products
  getFeatured(): Observable<any[]> {
    return this.http.get<any>(`${this.url}/featured`).pipe(map(unwrap));
  }

  // Get top selling products
  getTopSelling(limit = 10): Observable<any[]> {
    return this.http.get<any>(`${this.url}/top-selling?limit=${limit}`).pipe(map(unwrap));
  }

  // Create product (Admin/Seller)
  create(data: ProductRequest): Observable<any> {
    return this.http.post<any>(this.url, data).pipe(map(unwrapOne));
  }

  // Update product (Admin/Seller)
  update(id: string, data: Partial<ProductRequest>): Observable<any> {
    return this.http.put<any>(`${this.url}/${id}`, data).pipe(map(unwrapOne));
  }

  // Update stock
  updateStock(id: string, quantity: number): Observable<any> {
    return this.http.patch<any>(`${this.url}/${id}/stock?quantity=${quantity}`, {})
      .pipe(map(unwrapOne));
  }

  // Delete product (soft delete)
  delete(id: string): Observable<any> {
    return this.http.delete<any>(`${this.url}/${id}`);
  }

  // Admin: Get all products (including inactive)
  getAllAdmin(page = 0, size = 50): Observable<any> {
    return this.getAll(page, size);
  }

  // Admin: Toggle featured status
  toggleFeatured(id: string): Observable<any> {
    return this.http.patch<any>(`${this.url}/${id}/feature`, {}).pipe(map(unwrapOne));
  }

  // Admin: Delete permanently
  deleteAdmin(id: string): Observable<any> {
    return this.delete(id);
  }
}
