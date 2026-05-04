import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Campsite } from '../../models/campsite.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Hero Section -->
    <section class="relative h-[600px] overflow-hidden">
      <div class="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=1920&q=80"
          alt="Mountain camping"
          class="w-full h-full object-cover"
        />
        <div class="absolute inset-0 bg-gradient-to-r from-forest-green/80 to-forest-green/40"></div>
      </div>

      <div class="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-center">
        <div class="max-w-3xl">
          <h1 class="mb-6 text-4xl md:text-5xl lg:text-6xl font-bold text-cream-beige leading-tight">
            CAMP IS MORE THAN JUST A WORD,<br />IT'S AN EXPERIENCE!
          </h1>
          <p class="mb-8 text-lg md:text-xl text-cream-beige/90">
            Discover unforgettable camping locations and create memories that last a lifetime.
          </p>

          <div class="bg-white rounded-xl shadow-2xl p-6">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="Where to?"
                [(ngModel)]="searchLocation"
                class="px-4 py-3 border border-sage-green rounded-lg focus:outline-none focus:ring-2 focus:ring-olive-green"
              />
              <input
                type="date"
                [(ngModel)]="searchDate"
                class="px-4 py-3 border border-sage-green rounded-lg focus:outline-none focus:ring-2 focus:ring-olive-green"
              />
              <button class="bg-forest-green text-cream-beige py-3 rounded-lg font-medium hover:bg-olive-green transition-colors">
                Search
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Featured Campsites -->
    <section class="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <h2 class="text-3xl font-bold text-forest-green mb-8">Featured Campsites</h2>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div *ngFor="let campsite of campsites"
             class="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
          <img [src]="campsite.image" [alt]="campsite.name" class="w-full h-48 object-cover" />

          <div class="p-4">
            <h3 class="text-xl font-bold text-forest-green mb-2">{{campsite.name}}</h3>
            <p class="text-olive-green text-sm mb-3">📍 {{campsite.location}}</p>

            <div class="flex justify-between items-center">
              <span class="text-2xl font-bold text-forest-green">\${{campsite.price}}/night</span>
              <span class="text-yellow-500">⭐ {{campsite.rating}}</span>
            </div>

            <button class="mt-4 w-full bg-forest-green text-cream-beige py-2 rounded-lg hover:bg-olive-green transition-colors">
              View Details
            </button>
          </div>
        </div>
      </div>
    </section>
  `
})
export class HomeComponent {
  searchLocation = '';
  searchDate = '';

  campsites: Campsite[] = [
    {
      id: 1,
      name: 'Pine Valley Campground',
      location: 'Yosemite National Park, CA',
      image: 'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=800&q=80',
      rating: 4.8,
      reviews: 324,
      price: 45,
      amenities: ['WiFi', 'Campfire'],
      distance: 2.5
    },
    {
      id: 2,
      name: 'Crystal Lake Retreat',
      location: 'Tahoe National Forest, CA',
      image: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&q=80',
      rating: 4.9,
      reviews: 512,
      price: 55,
      amenities: ['WiFi', 'Water'],
      distance: 3.2
    },
    {
      id: 3,
      name: 'Mountain Peak Base Camp',
      location: 'Rocky Mountain NP, CO',
      image: 'https://images.unsplash.com/photo-1537225228614-56cc3556d7ed?w=800&q=80',
      rating: 4.7,
      reviews: 289,
      price: 40,
      amenities: ['Hiking'],
      distance: 5.8
    }
  ];
}
