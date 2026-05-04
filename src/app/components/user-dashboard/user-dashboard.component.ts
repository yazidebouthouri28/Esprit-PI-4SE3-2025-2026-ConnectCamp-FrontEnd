import { Component } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [CommonModule, NgClass],
  templateUrl: './user-dashboard.component.html',
  styleUrls: ['./user-dashboard.component.css'],
})
export class UserDashboardComponent {
  activeTab = 'bookings';

  tabs = [
    { id: 'bookings', label: 'My Bookings' },
    { id: 'purchases', label: 'Orders & Rentals' },
    { id: 'rewards', label: 'Loyalty Rewards' },
    { id: 'events', label: 'My Events' },
    { id: 'saved', label: 'Saved Locations' },
    { id: 'forum', label: 'Forum Activity' },
  ];

  bookingsData = [
    { id: 1, name: 'Pine Valley Campground', location: 'Yosemite National Park, CA', checkIn: 'Mar 15, 2026', checkOut: 'Mar 18, 2026', status: 'Confirmed', nights: 3, total: 135 },
    { id: 2, name: 'Crystal Lake Retreat', location: 'Tahoe National Forest, CA', checkIn: 'Apr 22, 2026', checkOut: 'Apr 25, 2026', status: 'Confirmed', nights: 3, total: 165 },
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
}
