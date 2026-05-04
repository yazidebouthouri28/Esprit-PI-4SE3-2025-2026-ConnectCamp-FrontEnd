import { Component } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface ModerationItem {
  id: number;
  type: 'campsite' | 'product' | 'forum';
  title: string;
  author: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
  reports: number;
  content?: string;
  location?: string;
}

@Component({
  selector: 'app-moderation-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, NgClass],
  templateUrl: './moderation-panel.component.html',
  styleUrls: ['./moderation-panel.component.css'],
})
export class ModerationPanelComponent {
  filterType: 'all' | 'campsite' | 'product' | 'forum' = 'all';
  filterStatus: 'all' | 'pending' | 'approved' | 'rejected' = 'all';
  searchTerm = '';

  items: ModerationItem[] = [
    { id: 1, type: 'campsite', title: 'New Lakeside Campsite', author: 'Pierre Martin', date: '2026-02-01', status: 'pending', reports: 0, content: 'Beautiful location...', location: "Lake Annecy, France" },
    { id: 2, type: 'forum', title: 'Best wild camping spots?', author: 'Marie Dubois', date: '2026-01-31', status: 'pending', reports: 2, content: 'I am looking for recommendations...' },
    { id: 3, type: 'product', title: 'Ultra-light 2-person tent', author: 'Shop Outdoor Pro', date: '2026-01-30', status: 'approved', reports: 0, content: 'High quality tent...' },
    { id: 4, type: 'forum', title: 'Warning: Equipment rental scams', author: 'Thomas Bernard', date: '2026-01-29', status: 'pending', reports: 5, content: "I was a victim..." },
    { id: 5, type: 'campsite', title: 'Camping Les Pins - Update', author: 'Admin Camping Les Pins', date: '2026-01-28', status: 'approved', reports: 0, location: 'Ardèche, France' },
    { id: 6, type: 'product', title: 'Cold weather sleeping bag', author: 'Mountain Gear', date: '2026-01-27', status: 'pending', reports: 1, content: 'Comfort temperature -15°C...' },
  ];

  get pendingCount(): number {
    return this.items.filter((item) => item.status === 'pending').length;
  }
  get approvedCount(): number {
    return this.items.filter((item) => item.status === 'approved').length;
  }
  get rejectedCount(): number {
    return this.items.filter((item) => item.status === 'rejected').length;
  }
  get totalReports(): number {
    return this.items.reduce((sum, i) => sum + i.reports, 0);
  }

  get filteredItems(): ModerationItem[] {
    return this.items.filter((item) => {
      const matchType = this.filterType === 'all' || item.type === this.filterType;
      const matchStatus = this.filterStatus === 'all' || item.status === this.filterStatus;
      const matchSearch =
        !this.searchTerm ||
        item.title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        item.author.toLowerCase().includes(this.searchTerm.toLowerCase());
      return matchType && matchStatus && matchSearch;
    });
  }

  typeClass(t: string): string {
    const map: Record<string, string> = {
      campsite: 'bg-green-100 text-green-700',
      product: 'bg-blue-100 text-blue-700',
      forum: 'bg-purple-100 text-purple-700',
    };
    return map[t] ?? '';
  }
  typeLabel(t: string): string {
    const map: Record<string, string> = {
      campsite: 'Campsite',
      product: 'Product',
      forum: 'Forum Post',
    };
    return map[t] ?? t;
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
