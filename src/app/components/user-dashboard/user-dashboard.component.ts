import { Component } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { ReservationRecord, ReservationService } from '../../services/reservation.service';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [CommonModule, NgClass],
  templateUrl: './user-dashboard.component.html',
  styleUrls: ['./user-dashboard.component.css'],
})
export class UserDashboardComponent {
  activeTab = 'bookings';
  bookingsLoading = false;
  bookingsError = '';
  bookingActionMessage = '';
  bookingsData: Array<{
    id: number;
    reservationNumber: string;
    name: string;
    location: string;
    checkIn: string;
    checkOut: string;
    status: string;
    nights: number;
    total: number;
    paymentStatus: string;
    canCancel: boolean;
  }> = [];

  tabs = [
    { id: 'bookings', label: 'My Bookings' },
    { id: 'purchases', label: 'Orders & Rentals' },
    { id: 'rewards', label: 'Loyalty Rewards' },
    { id: 'events', label: 'My Events' },
    { id: 'saved', label: 'Saved Locations' },
    { id: 'forum', label: 'Forum Activity' },
  ];

  ordersData = [
    {
      id: '1042',
      date: '2026-02-14',
      tracking: 'TRK-849572',
      status: 'Shipped',
      total: 149.99,
      items: [
        {
          name: 'Premium Sleeping Bag -20°C',
          image: 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?q=80&w=1080',
          qty: 1,
          price: 149.99
        }
      ]
    },
    {
      id: '1038',
      date: '2026-02-10',
      status: 'Delivered',
      total: 89.99,
      items: [
        {
          name: 'Portable Camp Stove',
          image: 'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?q=80&w=1080',
          qty: 1,
          price: 89.99
        }
      ]
    }
  ];

  orderTabs = ['All', 'Pending', 'Processing', 'Shipped', 'Delivered'];
  activeOrderTab = 'All';

  rewardsData = { currentPoints: 1245, tier: 'Gold', nextTier: 'Platinum', pointsToNext: 755, discountRate: 15, specialOffers: 3 };

  savedLocations = [
    { id: 1, name: 'Redwood Grove Campsite', location: 'Redwood National Park, CA', rating: 4.6 },
    { id: 2, name: 'Mountain Peak Base Camp', location: 'Rocky Mountain NP, CO', rating: 4.7 },
  ];

  rewardsProgress(): number {
    const total = this.rewardsData.currentPoints + this.rewardsData.pointsToNext;
    return (this.rewardsData.currentPoints / total) * 100;
  }

  get activeTabLabel(): string {
    const tab = this.tabs.find((t) => t.id === this.activeTab);
    return tab?.label ?? this.activeTab;
  }

  constructor(
    private authService: AuthService,
    private reservationService: ReservationService
  ) {
    this.loadBookings();
  }

  loadBookings(): void {
    this.bookingsLoading = true;
    this.bookingsError = '';
    this.bookingActionMessage = '';
    const currentUser = this.authService.getCurrentUser();
    const userId = currentUser?.id && /^\d+$/.test(String(currentUser.id))
      ? Number(currentUser.id)
      : null;

    if (!userId) {
      this.bookingsData = [];
      this.bookingsError = 'Please log in to view your reservations.';
      this.bookingsLoading = false;
      return;
    }

    this.reservationService.getReservationsByUser(userId).subscribe({
      next: (rows) => {
        this.bookingsData = rows.map((row) => this.toBookingCard(row));
        this.bookingsLoading = false;
      },
      error: () => {
        this.bookingsData = [];
        this.bookingsError = 'Unable to load your reservations right now.';
        this.bookingsLoading = false;
      }
    });
  }

  cancelBooking(bookingId: number): void {
    const currentUser = this.authService.getCurrentUser();
    const userId = currentUser?.id && /^\d+$/.test(String(currentUser.id))
      ? Number(currentUser.id)
      : null;
    if (!userId) return;

    this.reservationService.cancelReservationByUser(bookingId, userId, 'Cancelled by customer from dashboard').subscribe({
      next: () => {
        this.bookingActionMessage = 'Reservation cancelled successfully.';
        this.loadBookings();
      },
      error: (err) => {
        this.bookingActionMessage = err?.error?.message || 'Cancellation is allowed only within 5 hours after reservation.';
      }
    });
  }

  payNow(bookingId: number): void {
    const currentUser = this.authService.getCurrentUser();
    const userId = currentUser?.id && /^\d+$/.test(String(currentUser.id))
      ? Number(currentUser.id)
      : null;
    if (!userId) return;

    this.reservationService.payNowHardcoded(bookingId, userId).subscribe({
      next: () => {
        this.bookingActionMessage = 'Payment completed (hardcoded demo flow).';
        this.loadBookings();
      },
      error: (err) => {
        this.bookingActionMessage = err?.error?.message || 'Unable to process payment.';
      }
    });
  }

  private toBookingCard(row: ReservationRecord): {
    id: number;
    reservationNumber: string;
    name: string;
    location: string;
    checkIn: string;
    checkOut: string;
    status: string;
    nights: number;
    total: number;
    paymentStatus: string;
    canCancel: boolean;
  } {
    const createdAt = row.createdAt ? new Date(row.createdAt) : null;
    const now = new Date();
    const canCancel = !!createdAt
      && row.status?.toUpperCase() !== 'CANCELLED'
      && (now.getTime() - createdAt.getTime()) <= 5 * 60 * 60 * 1000;

    const checkIn = row.checkInDate ? new Date(row.checkInDate) : null;
    const checkOut = row.checkOutDate ? new Date(row.checkOutDate) : null;
    const nights = checkIn && checkOut
      ? Math.max(0, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)))
      : 0;

    return {
      id: Number(row.id),
      reservationNumber: row.reservationNumber || `RES-${row.id}`,
      name: row.siteName || 'Campsite reservation',
      location: '-',
      checkIn: checkIn ? checkIn.toLocaleDateString() : '-',
      checkOut: checkOut ? checkOut.toLocaleDateString() : '-',
      status: row.status || 'PENDING',
      nights,
      total: Number(row.totalPrice || 0),
      paymentStatus: row.paymentStatus || 'PENDING',
      canCancel
    };
  }
}
