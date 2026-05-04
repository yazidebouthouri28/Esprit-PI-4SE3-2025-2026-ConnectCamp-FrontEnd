import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Booking, Order } from '../../models/campsite.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-cream-beige py-8 px-4 sm:px-6 lg:px-8">
      <div class="max-w-7xl mx-auto">
        <h1 class="text-4xl font-bold text-forest-green mb-8">My Dashboard</h1>

        <!-- Welcome Card -->
        <div class="bg-gradient-to-r from-forest-green to-olive-green rounded-xl p-8 mb-8 text-white">
          <h2 class="text-2xl font-bold mb-2">Welcome back, Adventurer! 👋</h2>
          <p class="text-sage-green">You have {{bookings.length}} upcoming trips planned</p>
        </div>

        <!-- Tabs -->
        <div class="flex gap-4 mb-8 overflow-x-auto pb-2">
          <button *ngFor="let tab of tabs"
                  (click)="activeTab = tab.id"
                  [class.bg-forest-green]="activeTab === tab.id"
                  [class.text-cream-beige]="activeTab === tab.id"
                  [class.bg-white]="activeTab !== tab.id"
                  [class.text-forest-green]="activeTab !== tab.id"
                  class="px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors shadow-md">
            {{tab.label}}
          </button>
        </div>

        <!-- My Bookings -->
        <div *ngIf="activeTab === 'bookings'" class="space-y-4">
          <div *ngFor="let booking of bookings"
               class="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
            <div class="flex justify-between items-start">
              <div>
                <h3 class="text-xl font-bold text-forest-green mb-2">{{booking.name}}</h3>
                <p class="text-olive-green mb-4">📍 {{booking.location}}</p>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span class="text-olive-green">Check-in:</span>
                    <span class="font-medium text-forest-green ml-2">{{booking.checkIn}}</span>
                  </div>
                  <div>
                    <span class="text-olive-green">Check-out:</span>
                    <span class="font-medium text-forest-green ml-2">{{booking.checkOut}}</span>
                  </div>
                  <div>
                    <span class="text-olive-green">Nights:</span>
                    <span class="font-medium text-forest-green ml-2">{{booking.nights}}</span>
                  </div>
                  <div>
                    <span class="text-olive-green">Total:</span>
                    <span class="font-medium text-forest-green ml-2">\${{booking.total}}</span>
                  </div>
                </div>
              </div>
              <span class="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                {{booking.status}}
              </span>
            </div>
            <div class="mt-4 flex gap-2">
              <button class="px-4 py-2 bg-forest-green text-cream-beige rounded-lg hover:bg-olive-green transition-colors text-sm">
                View Details
              </button>
              <button class="px-4 py-2 bg-white border-2 border-forest-green text-forest-green rounded-lg hover:bg-sage-green/20 transition-colors text-sm">
                Modify Booking
              </button>
            </div>
          </div>
        </div>

        <!-- Orders & Rentals -->
        <div *ngIf="activeTab === 'orders'" class="space-y-4">
          <div *ngFor="let order of orders"
               class="bg-white rounded-xl p-6 shadow-md flex justify-between items-center">
            <div>
              <h3 class="text-lg font-bold text-forest-green mb-1">{{order.item}}</h3>
              <p class="text-olive-green text-sm mb-2">{{order.type}} • {{order.date}}</p>
            </div>
            <div class="text-right">
              <p class="text-2xl font-bold text-forest-green mb-1">\${{order.price}}</p>
              <span [class]="getOrderStatusBadge(order.status)"
                    class="text-xs px-2 py-1 rounded-full">
                {{order.status}}
              </span>
            </div>
          </div>
        </div>

        <!-- Loyalty Rewards -->
        <div *ngIf="activeTab === 'rewards'" class="bg-white rounded-xl p-8 shadow-md">
          <div class="text-center mb-8">
            <h2 class="text-3xl font-bold text-forest-green mb-2">🏆 {{rewardsData.tier}} Member</h2>
            <p class="text-olive-green">You have {{rewardsData.currentPoints}} points</p>
          </div>

          <div class="max-w-md mx-auto mb-8">
            <div class="bg-sage-green/20 rounded-full h-4 mb-2">
              <div class="bg-forest-green h-4 rounded-full transition-all"
                   [style.width.%]="getProgressPercentage()">
              </div>
            </div>
            <p class="text-center text-olive-green text-sm">
              {{rewardsData.pointsToNext}} points to {{rewardsData.nextTier}}
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="text-center p-6 bg-sage-green/10 rounded-lg">
              <div class="text-4xl font-bold text-forest-green mb-2">{{rewardsData.discountRate}}%</div>
              <div class="text-olive-green">Member Discount</div>
            </div>
            <div class="text-center p-6 bg-sage-green/10 rounded-lg">
              <div class="text-4xl font-bold text-forest-green mb-2">{{rewardsData.specialOffers}}</div>
              <div class="text-olive-green">Special Offers</div>
            </div>
            <div class="text-center p-6 bg-sage-green/10 rounded-lg">
              <div class="text-4xl font-bold text-forest-green mb-2">{{rewardsData.currentPoints}}</div>
              <div class="text-olive-green">Total Points</div>
            </div>
          </div>

          <div class="mt-8 text-center">
            <button class="bg-forest-green text-cream-beige px-8 py-3 rounded-lg hover:bg-olive-green transition-colors">
              Redeem Rewards
            </button>
          </div>
        </div>

        <!-- Saved Locations -->
        <div *ngIf="activeTab === 'saved'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div *ngFor="let location of savedLocations"
               class="bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow">
            <h3 class="text-lg font-bold text-forest-green mb-1">{{location.name}}</h3>
            <p class="text-olive-green text-sm mb-2">📍 {{location.location}}</p>
            <div class="flex justify-between items-center">
              <span class="text-yellow-500">⭐ {{location.rating}}</span>
              <button class="text-red-500 hover:text-red-700 text-sm">Remove</button>
            </div>
          </div>
        </div>

        <!-- My Events -->
        <div *ngIf="activeTab === 'events'" class="bg-white rounded-xl p-8 shadow-md text-center">
          <h3 class="text-2xl font-bold text-forest-green mb-4">📅 Upcoming Events</h3>
          <p class="text-olive-green mb-6">You haven't registered for any events yet</p>
          <a href="/events" class="inline-block bg-forest-green text-cream-beige px-8 py-3 rounded-lg hover:bg-olive-green transition-colors">
            Browse Events
          </a>
        </div>

        <!-- Forum Activity -->
        <div *ngIf="activeTab === 'forum'" class="bg-white rounded-xl p-8 shadow-md text-center">
          <h3 class="text-2xl font-bold text-forest-green mb-4">💬 Forum Activity</h3>
          <p class="text-olive-green mb-6">Your posts and discussions will appear here</p>
          <a href="/community" class="inline-block bg-forest-green text-cream-beige px-8 py-3 rounded-lg hover:bg-olive-green transition-colors">
            Visit Forum
          </a>
        </div>
      </div>
    </div>
  `
})
export class DashboardComponent {
  activeTab = 'bookings';

  tabs = [
    { id: 'bookings', label: 'My Bookings' },
    { id: 'orders', label: 'Orders & Rentals' },
    { id: 'rewards', label: 'Loyalty Rewards' },
    { id: 'events', label: 'My Events' },
    { id: 'saved', label: 'Saved Locations' },
    { id: 'forum', label: 'Forum Activity' }
  ];

  bookings: Booking[] = [
    {
      id: 1,
      name: 'Pine Valley Campground',
      location: 'Yosemite National Park, CA',
      checkIn: 'Mar 15, 2026',
      checkOut: 'Mar 18, 2026',
      status: 'Confirmed',
      nights: 3,
      total: 135
    },
    {
      id: 2,
      name: 'Crystal Lake Retreat',
      location: 'Tahoe National Forest, CA',
      checkIn: 'Apr 22, 2026',
      checkOut: 'Apr 25, 2026',
      status: 'Confirmed',
      nights: 3,
      total: 165
    }
  ];

  orders: Order[] = [
    {
      id: 1,
      item: '4-Person Family Tent',
      type: 'Purchase',
      date: 'Jan 15, 2026',
      price: 299,
      status: 'Delivered'
    },
    {
      id: 2,
      item: 'Premium Sleeping Bag',
      type: 'Rental',
      date: 'Feb 1-7, 2026',
      price: 175,
      status: 'Returned'
    }
  ];

  rewardsData = {
    currentPoints: 1245,
    tier: 'Gold',
    nextTier: 'Platinum',
    pointsToNext: 755,
    discountRate: 15,
    specialOffers: 3
  };

  savedLocations = [
    {
      id: 1,
      name: 'Redwood Grove Campsite',
      location: 'Redwood National Park, CA',
      rating: 4.6
    },
    {
      id: 2,
      name: 'Mountain Peak Base Camp',
      location: 'Rocky Mountain NP, CO',
      rating: 4.7
    },
    {
      id: 3,
      name: 'Sunset Vista Campground',
      location: 'Grand Canyon NP, AZ',
      rating: 4.9
    }
  ];

  getOrderStatusBadge(status: string): string {
    const badges: {[key: string]: string} = {
      'Delivered': 'bg-green-500 text-white',
      'Returned': 'bg-blue-500 text-white',
      'Pending': 'bg-yellow-500 text-white'
    };
    return badges[status] || 'bg-gray-500 text-white';
  }

  getProgressPercentage(): number {
    const total = this.rewardsData.currentPoints + this.rewardsData.pointsToNext;
    return (this.rewardsData.currentPoints / total) * 100;
  }
}
