export interface Campsite {
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

export interface Event {
  id: number;
  title: string;
  type: 'workshop' | 'trip' | 'festival';
  date: string;
  time: string;
  location: string;
  image: string;
  participants: number;
  maxParticipants: number;
  price: number;
  organizer: string;
}

export interface Product {
  id: number;
  name: string;
  category: string;
  image: string;
  price: number;
  rentalPrice?: number;
  rating: number;
  reviews: number;
  inStock: boolean;
  loyaltyPoints: number;
  featured: boolean;
}

export interface Booking {
  id: number;
  name: string;
  location: string;
  checkIn: string;
  checkOut: string;
  status: string;
  nights: number;
  total: number;
}

export interface Order {
  id: number;
  item: string;
  type: 'Purchase' | 'Rental';
  date: string;
  price: number;
  status: string;
}
