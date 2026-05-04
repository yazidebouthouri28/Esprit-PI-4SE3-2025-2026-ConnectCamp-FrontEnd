import { CommonModule, Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Site } from '../../models/camping.models';
import { AuthService } from '../../services/auth.service';
import { ReservationService } from '../../services/reservation.service';
import { SiteService } from '../../services/site.service';

@Component({
  selector: 'app-campsite-reservation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './campsite-reservation.component.html',
  styleUrls: ['./campsite-reservation.component.css']
})
export class CampsiteReservationComponent implements OnInit {
  campsite: Site | null = null;
  siteId = 0;
  isSubmitting = false;
  error = '';
  success = '';
  selectedExtra: { id: number; name: string; price: number; type: string } | null = null;

  form = {
    checkInDate: '',
    checkOutDate: '',
    guests: 1,
    fullName: '',
    email: '',
    phone: '',
    specialRequests: '',
    paymentMethod: 'CARD'
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private siteService: SiteService,
    private reservationService: ReservationService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (!user) {
      this.router.navigate(['/auth/login']);
      return;
    }

    this.form.fullName = user.name || user.username || '';
    this.form.email = user.email || '';

    const storedExtra = localStorage.getItem('campingExtra');
    if (storedExtra) {
      try { this.selectedExtra = JSON.parse(storedExtra); } catch { this.selectedExtra = null; }
    }

    this.route.params.subscribe((params) => {
      this.siteId = Number(params['id']);
      if (!this.siteId) return;
      this.siteService.getSiteById(this.siteId).subscribe({
        next: (site) => (this.campsite = site),
        error: () => {
          this.siteService.getAllSites().subscribe({
            next: (sites) => {
              this.campsite = sites.find((site) => site.id === this.siteId) || null;
              if (!this.campsite) {
                this.error = 'Unable to load campsite information.';
              }
            },
            error: () => (this.error = 'Unable to load campsite information.')
          });
        }
      });
    });
  }

  get nights(): number {
    if (!this.form.checkInDate || !this.form.checkOutDate) return 0;
    const checkIn = new Date(this.form.checkInDate);
    const checkOut = new Date(this.form.checkOutDate);
    const ms = checkOut.getTime() - checkIn.getTime();
    return ms > 0 ? Math.ceil(ms / (1000 * 60 * 60 * 24)) : 0;
  }

  get subtotal(): number {
    return (this.campsite?.price || 0) * this.nights;
  }

  get serviceFee(): number {
    return this.subtotal > 0 ? Number((this.subtotal * 0.08).toFixed(2)) : 0;
  }

  get extraPrice(): number {
    return this.selectedExtra?.price || 0;
  }

  get total(): number {
    return Number((this.subtotal + this.serviceFee + this.extraPrice).toFixed(2));
  }

  removeExtra(): void {
    this.selectedExtra = null;
    localStorage.removeItem('campingExtra');
  }

  goBack(): void {
    this.location.back();
  }

  submitReservation(): void {
    this.error = '';
    this.success = '';

    const currentUser = this.authService.getCurrentUser();
    const numericUserId = currentUser?.id && /^\d+$/.test(String(currentUser.id)) ? Number(currentUser.id) : null;

    if (!numericUserId) {
      this.error = 'Please log in with a valid account to reserve this campsite.';
      return;
    }
    if (!this.campsite) {
      this.error = 'Campsite is not loaded yet.';
      return;
    }
    if (!this.form.checkInDate || !this.form.checkOutDate || this.nights <= 0) {
      this.error = 'Please select valid check-in and check-out dates.';
      return;
    }
    if (!this.form.fullName.trim() || !this.form.email.trim() || !this.form.phone.trim()) {
      this.error = 'Please complete your contact information.';
      return;
    }

    const checkInIso = new Date(`${this.form.checkInDate}T14:00:00`).toISOString();
    const checkOutIso = new Date(`${this.form.checkOutDate}T11:00:00`).toISOString();

    this.isSubmitting = true;
    this.reservationService.createSiteReservation({
      userId: numericUserId,
      siteId: this.campsite.id,
      checkIn: checkInIso,
      checkOut: checkOutIso,
      numberOfGuests: Math.max(1, Number(this.form.guests || 1)),
      guestName: this.form.fullName.trim(),
      guestEmail: this.form.email.trim(),
      guestPhone: this.form.phone.trim(),
      specialRequests: this.form.specialRequests
    }).subscribe({
      next: (res) => {
        this.success = `Reservation confirmed in system: ${res?.reservationNumber || `#${res?.id}`}`;
        this.isSubmitting = false;
      },
      error: (err) => {
        this.error = err?.error?.message || err?.message || 'Unable to create reservation right now.';
        this.isSubmitting = false;
      }
    });
  }
}

