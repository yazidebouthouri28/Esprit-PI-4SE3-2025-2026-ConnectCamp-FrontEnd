import { Component, OnInit } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../models/api.models';

type UserStatus = 'Active' | 'Suspended' | 'Inactive';
type UserRoleOption = 'All' | 'Admin' | 'Organizer' | 'Camper' | 'Seller' | 'Sponsor' | 'Client';

interface UserRow {
    id: number;
    name: string;
    email: string;
    role: Exclude<UserRoleOption, 'All'>;
    joinedDate: string;
    status: UserStatus;
    avatarLabel: string;
}

/** Matches backend UserDTO + Role enum JSON */
interface UserDto {
    id: number;
    name?: string;
    email?: string;
    role?: string;
    isActive?: boolean;
    isSuspended?: boolean;
    createdAt?: string;
}

@Component({
    selector: 'app-users-management',
    standalone: true,
    imports: [CommonModule, FormsModule, NgClass],
    templateUrl: './users-management.component.html',
    styleUrl: './users-management.component.css'
})
export class UsersManagementComponent implements OnInit {
    searchTerm = '';
    filterRole: UserRoleOption = 'All';
    roleOptions: UserRoleOption[] = ['All', 'Admin', 'Organizer', 'Camper', 'Seller', 'Sponsor', 'Client'];

    users: UserRow[] = [];
    loading = true;
    loadError: string | null = null;

    constructor(private http: HttpClient) {}

    ngOnInit(): void {
        this.loadUsers();
    }

    loadUsers(): void {
        this.loading = true;
        this.loadError = null;
        this.http
            .get<ApiResponse<UserDto[]>>(`${environment.apiUrl}/api/users`)
            .pipe(finalize(() => (this.loading = false)))
            .subscribe({
                next: (res) => {
                    if (!res.success || !res.data) {
                        this.loadError = res.message || 'Failed to load users.';
                        this.users = [];
                        return;
                    }
                    this.users = res.data.map((u) => this.mapToRow(u));
                },
                error: () => {
                    this.loadError = 'Could not load users. Please try again.';
                    this.users = [];
                }
            });
    }

    private mapToRow(u: UserDto): UserRow {
        const name = (u.name ?? u.email ?? 'User').trim();
        return {
            id: u.id,
            name,
            email: u.email ?? '—',
            role: this.mapBackendRole(u.role),
            joinedDate: this.formatJoinedDate(u.createdAt),
            status: this.deriveStatus(u),
            avatarLabel: this.initialsFromName(name)
        };
    }

    private mapBackendRole(role: string | undefined): UserRow['role'] {
        const r = (role ?? '').toUpperCase();
        switch (r) {
            case 'ADMIN':
                return 'Admin';
            case 'ORGANIZER':
                return 'Organizer';
            case 'PARTICIPANT':
                return 'Camper';
            case 'SELLER':
                return 'Seller';
            case 'SPONSOR':
                return 'Sponsor';
            default:
                return 'Client';
        }
    }

    private deriveStatus(u: UserDto): UserStatus {
        if (u.isSuspended) {
            return 'Suspended';
        }
        if (u.isActive === false) {
            return 'Inactive';
        }
        return 'Active';
    }

    private formatJoinedDate(iso: string | undefined): string {
        if (!iso) {
            return '—';
        }
        const d = new Date(iso);
        if (isNaN(d.getTime())) {
            return '—';
        }
        return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    }

    private initialsFromName(name: string): string {
        const parts = name.trim().split(/\s+/).filter(Boolean);
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        if (parts.length === 1 && parts[0].length >= 2) {
            return parts[0].slice(0, 2).toUpperCase();
        }
        return (parts[0]?.[0] ?? '?').toUpperCase();
    }

    get filteredUsers(): UserRow[] {
        const term = this.searchTerm.trim().toLowerCase();

        return this.users.filter((user) => {
            const matchesSearch =
                !term || user.name.toLowerCase().includes(term) || user.email.toLowerCase().includes(term);
            const matchesRole = this.filterRole === 'All' || user.role === this.filterRole;

            return matchesSearch && matchesRole;
        });
    }

    get totalUsersCount(): number {
        return this.users.length;
    }

    get activeUsersCount(): number {
        return this.users.filter((user) => user.status === 'Active').length;
    }

    get suspendedUsersCount(): number {
        return this.users.filter((user) => user.status === 'Suspended').length;
    }

    get adminUsersCount(): number {
        return this.users.filter((user) => user.role === 'Admin').length;
    }

    getStatusClass(status: UserStatus): string {
        switch (status) {
            case 'Active':
                return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'Suspended':
                return 'bg-red-100 text-red-700 border-red-200';
            case 'Inactive':
                return 'bg-gray-100 text-gray-700 border-gray-200';
            default:
                return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    }

    getRoleClass(role: UserRow['role']): string {
        switch (role) {
            case 'Admin':
                return 'text-purple-600 bg-purple-50';
            case 'Organizer':
                return 'text-blue-600 bg-blue-50';
            case 'Seller':
                return 'text-amber-600 bg-amber-50';
            case 'Camper':
                return 'text-emerald-600 bg-emerald-50';
            case 'Sponsor':
                return 'text-rose-600 bg-rose-50';
            case 'Client':
                return 'text-slate-600 bg-slate-50';
            default:
                return 'text-gray-600 bg-gray-50';
        }
    }
}
