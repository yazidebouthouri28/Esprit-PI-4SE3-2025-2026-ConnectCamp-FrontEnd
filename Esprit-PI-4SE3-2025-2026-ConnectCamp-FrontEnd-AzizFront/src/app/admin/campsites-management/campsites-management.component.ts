import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Campsite {
    id: number;
    name: string;
    location: string;
    capacity: number;
    price: number;
    status: 'Available' | 'Fully Booked' | 'Maintenance';
}

@Component({
    selector: 'app-campsites-management',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './campsites-management.component.html',
    styleUrls: ['./campsites-management.component.css']
})
export class CampsitesManagementComponent {
    campsites: Campsite[] = [
        { id: 1, name: 'Zaghouan Mountain Retreat', location: 'Zaghouan', capacity: 20, price: 45, status: 'Available' },
        { id: 2, name: 'Ain Draham Forest Camp', location: 'Ain Draham', capacity: 15, price: 55, status: 'Fully Booked' },
        { id: 3, name: 'Beni M Tir Eco-Village', location: 'Beni M Tir', capacity: 10, price: 50, status: 'Available' },
        { id: 4, name: 'Haouaria Cliffside Camp', location: 'Haouaria', capacity: 12, price: 42, status: 'Maintenance' },
        { id: 5, name: 'Korbous Coastal Ridge', location: 'Korbous', capacity: 8, price: 65, status: 'Available' },
        { id: 6, name: 'Sahara Starry Dunes', location: 'Douz', capacity: 30, price: 120, status: 'Available' },
    ];

    getStatusClass(status: string): string {
        switch (status) {
            case 'Available': return 'bg-green-100 text-green-700';
            case 'Fully Booked': return 'bg-blue-100 text-blue-700';
            case 'Maintenance': return 'bg-orange-100 text-orange-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    }
}
