import { Component } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface User {
    id: number;
    name: string;
    email: string;
    role: 'Admin' | 'Organizer' | 'Camper' | 'Seller';
    joinedDate: string;
    status: 'Active' | 'Suspended' | 'Pending';
    avatar: string;
}

@Component({
    selector: 'app-users-management',
    standalone: true,
    imports: [CommonModule, FormsModule, NgClass],
    templateUrl: './users-management.component.html',
    styleUrl: './users-management.component.css'
})
export class UsersManagementComponent {
    searchTerm = '';
    filterRole: 'All' | 'Admin' | 'Organizer' | 'Camper' | 'Seller' = 'All';

    users: User[] = [
        { id: 1, name: 'Ahmed Ben Salem', email: 'ahmed.b@gmail.com', role: 'Admin', joinedDate: '2025-05-12', status: 'Active', avatar: 'AH' },
        { id: 2, name: 'Mariem Guezguez', email: 'mariem.g@yahoo.tn', role: 'Organizer', joinedDate: '2025-08-20', status: 'Active', avatar: 'MG' },
        { id: 3, name: 'Yassine Trabelsi', email: 'yassine.t@gmail.com', role: 'Camper', joinedDate: '2025-11-05', status: 'Active', avatar: 'YT' },
        { id: 4, name: 'Selim Riahi', email: 'selim.r@outdoor.tn', role: 'Seller', joinedDate: '2026-01-15', status: 'Pending', avatar: 'SR' },
        { id: 5, name: 'Leila Jendoubi', email: 'leila.j@gmail.com', role: 'Camper', joinedDate: '2026-02-01', status: 'Suspended', avatar: 'LJ' },
        { id: 6, name: 'Unknown Saboteur', email: 'malicious@proxy.tn', role: 'Camper', joinedDate: '2026-02-14', status: 'Suspended', avatar: 'US' },
    ];

    get filteredUsers(): User[] {
        return this.users.filter(u => {
            const matchSearch = u.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                u.email.toLowerCase().includes(this.searchTerm.toLowerCase());
            const matchRole = this.filterRole === 'All' || u.role === this.filterRole;
            return matchSearch && matchRole;
        });
    }

    getStatusClass(status: string): string {
        switch (status) {
            case 'Active': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'Pending': return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'Suspended': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-gray-100 text-gray-700';
        }
    }

    getRoleClass(role: string): string {
        switch (role) {
            case 'Admin': return 'text-purple-600 bg-purple-50';
            case 'Organizer': return 'text-blue-600 bg-blue-50';
            case 'Seller': return 'text-amber-600 bg-amber-50';
            case 'Camper': return 'text-emerald-600 bg-emerald-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    }
}
