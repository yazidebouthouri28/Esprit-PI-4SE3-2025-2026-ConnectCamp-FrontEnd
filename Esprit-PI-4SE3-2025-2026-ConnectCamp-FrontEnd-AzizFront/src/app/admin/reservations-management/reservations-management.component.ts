import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Reservation {
    id: string;
    customer: string;
    type: 'Campsite' | 'Gear Rental' | 'Tour';
    date: string;
    status: 'Confirmed' | 'Pending' | 'Cancelled' | 'Completed';
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
export class ReservationsManagementComponent {
    reservations: Reservation[] = [
        { id: 'RES-001', customer: 'Ahmed Ben Salem', type: 'Campsite', date: '2026-02-20', status: 'Confirmed', amount: 135, checkIn: '14:00', checkOut: '11:00', guests: 2 },
        { id: 'RES-002', customer: 'Mariem Guezguez', type: 'Gear Rental', date: '2026-02-22', status: 'Pending', amount: 45, checkIn: '10:00', checkOut: '17:00', guests: 1 },
        { id: 'RES-003', customer: 'Yassine Trabelsi', type: 'Tour', date: '2026-02-15', status: 'Completed', amount: 250, checkIn: '08:00', checkOut: '18:00', guests: 4 },
        { id: 'RES-004', customer: 'Selim Riahi', type: 'Campsite', date: '2026-03-05', status: 'Cancelled', amount: 90, checkIn: '14:00', checkOut: '11:00', guests: 3 },
        { id: 'RES-005', customer: 'Amel Karoui', type: 'Campsite', date: '2026-02-18', status: 'Confirmed', amount: 180, checkIn: '14:00', checkOut: '11:00', guests: 2 },
        { id: 'RES-006', customer: 'Khaled Jendoubi', type: 'Tour', date: '2026-02-28', status: 'Pending', amount: 320, checkIn: '07:30', checkOut: '19:00', guests: 12 },
    ];

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
