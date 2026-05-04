import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TrackingService } from '../../services/tracking.service';
import { TrackingResponse, TrackingEvent } from '../../models/tracking.models';

@Component({
  selector: 'app-order-tracking',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './order-tracking.component.html',
  styleUrls: ['./order-tracking.component.css']
})
export class OrderTrackingComponent implements OnInit {
  @Input()  orderId!: number | string;
  @Output() close = new EventEmitter<void>();

  tracking: TrackingResponse | null = null;
  isLoading = true;
  error = '';

  constructor(public trackingService: TrackingService) {}

  ngOnInit(): void {
    this.loadTracking();
  }

  loadTracking(): void {
    this.isLoading = true;
    this.error = '';
    this.trackingService.getOrderTracking(this.orderId).subscribe({
      next: (data) => {
        this.tracking = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'Unable to load tracking information.';
        this.isLoading = false;
      }
    });
  }

  formatDateTime(isoString: string | undefined): string {
    if (!isoString) return '—';
    return new Date(isoString).toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  formatDate(isoString: string | undefined): string {
    if (!isoString) return '—';
    return new Date(isoString).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'long', year: 'numeric'
    });
  }

  openCarrierTracking(): void {
    if (this.tracking?.carrierTrackingUrl) {
      window.open(this.tracking.carrierTrackingUrl, '_blank');
    }
  }

  /** The progress percentage (0–100) for the stepper bar */
  get progressPercent(): number {
    const steps: Record<string, number> = {
      NOT_SHIPPED: 0,
      LABEL_CREATED: 15,
      PICKED_UP: 35,
      IN_TRANSIT: 55,
      OUT_FOR_DELIVERY: 75,
      AT_PICKUP_POINT: 80,
      DELIVERED: 100,
      DELIVERY_ATTEMPTED: 65,
      EXCEPTION: 50,
      RETURNED_TO_SENDER: 90,
    };
    const code = this.tracking?.currentStatus?.code ?? 'NOT_SHIPPED';
    return steps[code] ?? 0;
  }

  trackByTimestamp(_: number, ev: TrackingEvent): string {
    return ev.timestamp + ev.status;
  }
}
