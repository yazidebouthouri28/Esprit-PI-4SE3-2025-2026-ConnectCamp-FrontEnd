import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RouterLink } from '@angular/router';

interface Campsite {
  id: number;
  name: string;
  location: string;
  image: string;
  rating: number;
  reviews: number;
  price: number;
  amenities: string[];
  distance: number;
}

@Component({
  selector: 'app-campsite-listings',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './campsite-listings.component.html',
  styleUrls: ['./campsite-listings.component.css'],
})
export class CampsiteListingsComponent {
  campsites: Campsite[] = [
    { id: 1, name: 'Zaghouan Mountain Retreat', location: 'Djebel Zaghouan, Tunisia', image: 'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?q=80&w=1080', rating: 4.8, reviews: 324, price: 45, amenities: ['wifi', 'campfire', 'hiking', 'water'], distance: 2.5 },
    { id: 2, name: 'Ain Draham Forest Camp', location: 'Kroumirie Mountains, Tunisia', image: 'https://images.unsplash.com/photo-1763771056927-557d39cb5e02?q=80&w=1080', rating: 4.9, reviews: 512, price: 55, amenities: ['wifi', 'campfire', 'water', 'group'], distance: 3.2 },
    { id: 3, name: 'Beni M Tir Eco-Village', location: 'Fernana, Tunisia', image: 'https://images.unsplash.com/photo-1693954100560-36dbf3d1623c?q=80&w=1080', rating: 4.7, reviews: 289, price: 40, amenities: ['campfire', 'hiking', 'water'], distance: 5.8 },
    { id: 4, name: 'Haouaria Cliffside Camp', location: 'Cap Bon, Tunisia', image: 'https://images.unsplash.com/photo-1747447597297-0716bbd5b049?q=80&w=1080', rating: 4.6, reviews: 178, price: 38, amenities: ['campfire', 'hiking', 'group'], distance: 4.3 },
    { id: 5, name: 'Boukornine Nature Spot', location: 'Hammam Lif, Tunisia', image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1080', rating: 4.9, reviews: 456, price: 50, amenities: ['wifi', 'campfire', 'hiking', 'water', 'group'], distance: 1.8 },
    { id: 6, name: 'Ghar El Melh Beach Front', location: 'Bizerte, Tunisia', image: 'https://images.unsplash.com/photo-1506466010722-395aa2bef877?q=80&w=1080', rating: 4.8, reviews: 367, price: 48, amenities: ['wifi', 'water', 'group'], distance: 3.7 },
  ];

  recommendedCampsites: Campsite[] = [
    { id: 2, name: 'Ain Draham Forest Camp', location: 'Kroumirie Mountains, Tunisia', image: 'https://images.unsplash.com/photo-1763771056927-557d39cb5e02?q=80&w=1080', rating: 4.9, reviews: 512, price: 55, amenities: ['wifi', 'campfire', 'water', 'group'], distance: 3.2 },
    { id: 5, name: 'Boukornine Nature Spot', location: 'Hammam Lif, Tunisia', image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1080', rating: 4.9, reviews: 456, price: 50, amenities: ['wifi', 'campfire', 'hiking', 'water', 'group'], distance: 1.8 },
  ];

  amenityLabels: Record<string, string> = {
    wifi: 'WiFi',
    campfire: 'Campfire',
    hiking: 'Hiking',
    water: 'Water',
    group: 'Group',
  };
}
