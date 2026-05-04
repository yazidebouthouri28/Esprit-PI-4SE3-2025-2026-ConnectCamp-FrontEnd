import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReservationRecord, ReservationService } from '../../services/reservation.service';

interface ReservationCard {
    id: number;
    reservationNumber: string;
    customer: string;
    type: 'Campsite';
    date: string;
    status: string;
    amount: number;
    checkIn: string;
    checkOut: string;
    guests: number;
}

@Component({
    selector: 'app-reservations-management',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './reservations-management.component.html',
    styleUrls: ['./reservations-management.component.css']
})
export class ReservationsManagementComponent implements OnInit {
    reservations: ReservationCard[] = [];
    isLoading = false;
    message = '';

    constructor(private reservationService: ReservationService) {}

    ngOnInit(): void {
        this.loadReservations();
    }

    loadReservations(): void {
        this.isLoading = true;
        this.message = '';
        this.reservationService.getAllReservations().subscribe({
            next: (records) => {
                this.reservations = records.map((r) => this.toCard(r));
                this.isLoading = false;
            },
            error: () => {
                this.reservations = [];
                this.message = 'Unable to load reservations right now.';
                this.isLoading = false;
            }
        });
    }

    confirmReservation(id: number): void {
        this.reservationService.confirmReservation(id).subscribe({
            next: () => this.loadReservations(),
            error: () => this.message = 'Unable to confirm this reservation.'
        });
    }

    cancelReservation(id: number): void {
        this.reservationService.cancelReservation(id).subscribe({
            next: () => this.loadReservations(),
            error: () => this.message = 'Unable to cancel this reservation.'
        });
    }

    private toCard(r: ReservationRecord): ReservationCard {
        const checkInDate = r.checkInDate ? new Date(r.checkInDate) : null;
        const checkOutDate = r.checkOutDate ? new Date(r.checkOutDate) : null;
        return {
            id: Number(r.id),
            reservationNumber: r.reservationNumber || `RES-${r.id}`,
            customer: r.userName || 'Guest',
            type: 'Campsite',
            date: r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '',
            status: this.normalizeStatus(r.status),
            amount: Number(r.totalPrice || 0),
            checkIn: checkInDate ? checkInDate.toLocaleDateString() : '-',
            checkOut: checkOutDate ? checkOutDate.toLocaleDateString() : '-',
            guests: Number(r.numberOfGuests || 1)
        };
    }

    private normalizeStatus(status?: string): string {
        const value = String(status || 'PENDING').toUpperCase();
        if (value === 'CONFIRMED') return 'Confirmed';
        if (value === 'CANCELLED') return 'Cancelled';
        if (value === 'COMPLETED') return 'Completed';
        return 'Pending';
    }

    getStatusClass(status: string): string {
        switch (status) {
            case 'Confirmed': return 'bg-blue-100 text-blue-700';
            case 'Pending': return 'bg-yellow-100 text-yellow-700';
            case 'Completed': return 'bg-green-100 text-green-700';
            case 'Cancelled': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    }
}
