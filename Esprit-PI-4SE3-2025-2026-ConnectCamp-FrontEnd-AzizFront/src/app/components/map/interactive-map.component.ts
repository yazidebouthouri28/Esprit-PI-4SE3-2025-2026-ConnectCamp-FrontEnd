import { Component } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';

interface MapLocation {
  id: number;
  name: string;
  type: 'campsite' | 'rental' | 'event';
  lat: number;
  lng: number;
  available: boolean;
}

type FilterType = 'all' | 'campsite' | 'rental' | 'event';

@Component({
  selector: 'app-interactive-map',
  standalone: true,
  imports: [CommonModule, NgClass],
  templateUrl: './interactive-map.component.html',
  styleUrls: ['./interactive-map.component.css'],
})
export class InteractiveMapComponent {
  selectedType: FilterType = 'all';
  showRoutes = false;

  locations: MapLocation[] = [
    { id: 1, name: 'Pine Valley', type: 'campsite', lat: 37.7, lng: -119.5, available: true },
    { id: 2, name: 'Crystal Lake', type: 'campsite', lat: 39.2, lng: -120.1, available: true },
    { id: 3, name: 'Mountain Peak', type: 'campsite', lat: 40.3, lng: -105.7, available: false },
    { id: 4, name: 'Gear Rental Shop', type: 'rental', lat: 37.9, lng: -119.8, available: true },
    { id: 5, name: 'Summer Camping Festival', type: 'event', lat: 38.5, lng: -119.3, available: true },
  ];

  get filteredLocations(): MapLocation[] {
    return this.selectedType === 'all'
      ? this.locations
      : this.locations.filter((loc) => loc.type === this.selectedType);
  }

  pinColor(type: string): string {
    switch (type) {
      case 'campsite': return 'text-forest';
      case 'rental': return 'text-olive';
      default: return 'text-sage';
    }
  }
}
