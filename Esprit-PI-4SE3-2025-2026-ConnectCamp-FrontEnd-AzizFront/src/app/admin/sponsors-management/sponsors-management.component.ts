import { Component } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Sponsor {
  id: number;
  name: string;
  companyName: string;
  category: string;
  requestDate: string;
  status: 'pending' | 'approved' | 'rejected';
  budget: number;
  icon?: string;
  engagement: number;
}

@Component({
  selector: 'app-sponsors-management',
  standalone: true,
  imports: [CommonModule, FormsModule, NgClass],
  templateUrl: './sponsors-management.component.html',
  styleUrls: ['./sponsors-management.component.css'],
})
export class SponsorsManagementComponent {
  filterStatus: 'all' | 'pending' | 'approved' | 'rejected' = 'all';
  searchTerm = '';

  sponsors: Sponsor[] = [
    { id: 1, name: 'Tarek Ben Ammar', companyName: 'Carthage Adventure SA', category: 'Camping Equipment', requestDate: '2026-02-15', status: 'pending', budget: 15000, icon: '⛺', engagement: 85 },
    { id: 2, name: 'Sonia Mabrouk', companyName: 'Atlas Eco-Travel', category: 'Travel Agency', requestDate: '2026-02-12', status: 'pending', budget: 25000, icon: '🌍', engagement: 92 },
    { id: 3, name: 'Mohamed Dridi', companyName: 'North Gear Pro', category: 'Mountain Gear', requestDate: '2026-02-05', status: 'approved', budget: 20000, icon: '🏔️', engagement: 78 },
    { id: 4, name: 'Leila Trabelsi', companyName: 'Nature & Découverte TN', category: 'Outdoor Retail', requestDate: '2026-01-28', status: 'approved', budget: 30000, icon: '🌿', engagement: 95 },
    { id: 5, name: 'Anis Karray', companyName: 'Camping Services Tunisia', category: 'Camping Services', requestDate: '2026-01-15', status: 'rejected', budget: 8500, icon: '⚒️', engagement: 45 },
    { id: 6, name: 'Yasmine Belhassen', companyName: 'Sahara Glamping Experts', category: 'Luxury Camping', requestDate: '2026-02-16', status: 'pending', budget: 45000, icon: '✨', engagement: 88 },
  ];

  get filteredSponsors(): Sponsor[] {
    return this.sponsors.filter((s) => {
      const matchStatus = this.filterStatus === 'all' || s.status === this.filterStatus;
      const matchSearch =
        !this.searchTerm ||
        s.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        s.companyName.toLowerCase().includes(this.searchTerm.toLowerCase());
      return matchStatus && matchSearch;
    });
  }

  get pendingCount(): number {
    return this.sponsors.filter((s) => s.status === 'pending').length;
  }
  get approvedCount(): number {
    return this.sponsors.filter((s) => s.status === 'approved').length;
  }
  get totalBudget(): number {
    return this.sponsors.filter((s) => s.status === 'approved').reduce((sum, s) => sum + s.budget, 0);
  }

  statusClass(s: string): string {
    const map: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      approved: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
    };
    return map[s] ?? '';
  }
  statusLabel(s: string): string {
    const map: Record<string, string> = {
      pending: 'Pending',
      approved: 'Approved',
      rejected: 'Rejected',
    };
    return map[s] ?? s;
  }
}
