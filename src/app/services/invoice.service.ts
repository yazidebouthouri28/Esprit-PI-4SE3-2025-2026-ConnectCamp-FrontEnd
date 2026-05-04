import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class InvoiceService {
  private url = `${environment.apiUrl}/api/orders`;

  constructor(private http: HttpClient) {}

  /**
   * Downloads the PDF invoice for a given order.
   * Backend: GET /api/orders/{id}/invoice/pdf
   * Returns a Blob so we can trigger a browser download.
   */
  downloadInvoicePdf(orderId: number | string): Observable<Blob> {
    return this.http.get(`${this.url}/${orderId}/invoice/pdf`, {
      responseType: 'blob'
    });
  }

  /**
   * Gets the invoice metadata (not the PDF file) for an order.
   * Backend: GET /api/orders/{id}/invoice
   */
  getInvoice(orderId: number | string): Observable<any> {
    return this.http.get<any>(`${this.url}/${orderId}/invoice`);
  }

  /**
   * Gets all invoices for a user.
   * Backend: GET /api/orders/invoices/user/{userId}
   */
  getUserInvoices(userId: number | string): Observable<any[]> {
    return this.http.get<any>(`${this.url}/invoices/user/${userId}`).pipe();
  }

  /**
   * Helper — triggers a real browser file download from a Blob.
   */
  triggerDownload(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }
}
