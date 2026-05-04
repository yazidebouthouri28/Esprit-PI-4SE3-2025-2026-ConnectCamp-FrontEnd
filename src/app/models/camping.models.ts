// Camping Platform Models

// User and Profile Models
export interface User {
  id: string;
  name: string;
  avatar: string;
  role: UserRole;
  email?: string;
  status?: 'online' | 'offline' | 'typing';
  lastSeen?: string;
  bio?: string;
  coverImage?: string;
  location?: string;
  hashtags?: string[];
  followers?: string;
  gallery?: string[];
  achievements?: Achievement[];
}

export interface Achievement {
  title: string;
  icon: string;
  description?: string;
  date?: string;
}

export type UserRole = 'ADMIN' | 'ORGANIZER' | 'SELLER' | 'CAMPER' | 'CLIENT' | 'SPONSOR';

// Campsite Models
export interface Campsite {
  id: string;
  name: string;
  location: string;
  image: string;
  images?: string[];
  rating: number;
  reviews: number;
  price: number;
  priceUnit?: string;
  amenities: string[];
  distance?: string;
  description?: string;
  coordinates?: { lat: number; lng: number };
  maxGuests?: number;
  available?: boolean;
  owner?: string;
  createdAt?: Date;
    ownerId?: number;  
}

export interface CampsiteReservation {
  id: string;
  campsiteId: string;
  campsiteName?: string;
  userId: string;
  customerName?: string;
  checkIn: Date | string;
  checkOut: Date | string;
  guests: number;
  status: ReservationStatus;
  totalAmount: number;
  createdAt?: Date;
    ownerId?: number;  
}

export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

// Event Models
export interface CampingEvent {
  id: string;
  title: string;
  type: EventType;
  date: string;
  time?: string;
  location: string;
  image: string;
  participants: number;
  maxParticipants: number;
  price: number | 'Free';
  organizer: string;
  organizerId?: string;
  description?: string;
  status?: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  createdAt?: Date;
}

export type EventType = 'Workshop' | 'Trip' | 'Festival' | 'Meetup' | 'Training';

export interface EventRegistration {
  id: string;
  eventId: string;
  userId: string;
  userName?: string;
  registrationDate: Date | string;
  status: 'registered' | 'attended' | 'cancelled';
}

// Community/Messaging Models
export interface Message {
  id: string;
  senderId: string;
  senderName?: string;
  senderAvatar?: string;
  content: string;
  timestamp: Date | string;
  type: 'text' | 'image' | 'system';
  imageUrls?: string[];
  groupId?: string;
  receiverId?: string;
  read?: boolean;
}

export interface ChatGroup {
  id: string;
  name: string;
  description?: string;
  avatar: string;
  membersCount: number;
  members?: User[];
  messages?: Message[];
  mediaCount?: number;
  lastMessage?: Message;
  createdAt?: Date;
}

// Map Models
export interface MapLocation {
  id: string;
  name: string;
  type: LocationType;
  lat: number;
  lng: number;
  available?: boolean;
  price?: number;
  rating?: number;
  image?: string;
}

export type LocationType = 'campsite' | 'rental' | 'event' | 'attraction';

// Sponsor Models
export interface Sponsor {
  id: string;
  name: string;
  companyName: string;
  email?: string;
  phone?: string;
  category: SponsorCategory;
  requestDate: Date | string;
  status: SponsorStatus;
  budget?: number;
  engagement?: number;
  logo?: string;
  description?: string;
}

export type SponsorCategory = 'Outdoor Gear' | 'Food & Beverage' | 'Tourism' | 'Technology' | 'Other';
export type SponsorStatus = 'pending' | 'approved' | 'rejected' | 'active' | 'inactive';

// Reservation Models (unified)
export interface Reservation {
  id: string;
  customer: string;
  customerId?: string;
  type: ReservationType;
  date: Date | string;
  status: ReservationStatus;
  amount: number;
  checkIn?: Date | string;
  checkOut?: Date | string;
  guests?: number;
  details?: Record<string, any>;
}

export type ReservationType = 'campsite' | 'gear' | 'tour' | 'event';

// Admin Models
export interface AdminStats {
  totalUsers: number;
  totalCampsites: number;
  totalEvents: number;
  totalReservations: number;
  totalRevenue: number;
  monthlyGrowth: number;
}

export interface Report {
  id: string;
  title: string;
  type: 'revenue' | 'users' | 'reservations' | 'events';
  period: string;
  data: any;
  generatedAt: Date | string;
}

// Discovery and Management Models
export interface Site {
  id: number;
  name: string;
  location: string;
  latitude: number;
  longitude: number;
  averageRating: number;
  image: string;
  /** Platform verification (certification approved). */
  verified?: boolean;
  capacity?: number;
  price?: number;
  status?: string;
  description?: string;
  type?: string;
  address?: string;
  city?: string;
  country?: string;
  images?: string[];
  amenities?: string[];
  contactPhone?: string;
  contactEmail?: string;
  isActive?: boolean;
  pricePerNight?: number;
  reviewCount?: number;
  checkInTime?: string;
  checkOutTime?: string;
  houseRules?: string;
    ownerId?: number;  
}

export interface Review {
  id: number;
  rating: number;
  comment: string;
  siteId: number;
  createdAt: Date | string;
  title?: string;
  images?: string[];
  userId?: number;
  userName?: string;
  userAvatar?: string;
  likes?: number;
  dislikes?: number;
  userReactions?: Record<string, 'LIKE' | 'DISLIKE'>;
}

export interface VirtualTour {
  id: number;
  title: string;
  siteId: number;
  description?: string;
  thumbnailUrl?: string;
  durationMinutes?: number;
  viewCount?: number;
  isActive?: boolean;
  isFeatured?: boolean;
  scenes?: Scene360[];
}

export interface Scene360 {
  id: number;
  title?: string;
  name: string;
  description?: string;
  imageUrl?: string;
  panoramaUrl: string;
  thumbnailUrl?: string;
  orderIndex?: number;
  sceneOrder: number;
  initialYaw?: number;
  initialPitch?: number;
  initialFov?: number;
  hotspots?: string[];
  virtualTourId: number;
}

export interface RouteGuide {
  id: number;
  name?: string;
  description?: string;
  originCity: string;
  distanceKm: number;
  distanceMeters?: number;
  estimatedDurationMinutes?: number;
  durationMin: number;
  difficulty?: string;
  instructions: any; // Can be string (JSON) or object
  mapUrl: string;
  waypoints?: string[];
  isActive?: boolean;
  siteId: number;
  virtualTourId?: number;
}

export interface Certification {
  id: number;
  certificationCode?: string;
  title?: string;
  description?: string;
  issuingOrganization?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CERTIFIED' | 'UNDER_REVIEW' | 'EXPIRED' | 'REVOKED' | 'SUSPENDED';
  score: number;
  issueDate: Date | string;
  expirationDate?: Date | string;
  expiryDate?: Date | string;
  documentUrl?: string;
  verificationUrl?: string;
  siteId: number;
  items?: CertificationItem[];
}

export interface CertificationItem {
  id: number;
  name?: string;
  description?: string;
  criteriaName: 'SAFETY' | 'CLEANLINESS' | 'EQUIPMENT' | 'SERVICES' | 'PRICE' | 'RATING' | 'DISTANCE' | 'CAPACITY' | 'DATE' | 'AVAILABILITY' | 'POPULARITY' | 'CATEGORY' | 'LOCATION';
  score: number;
  requiredScore?: number;
  passed?: boolean;
  comment: string;
  completedAt?: Date | string;
  certificationId: number;
}

export interface CampHighlight {
  id: number;
  title: string;
  content: string;
  category: 'FLORA' | 'FAUNA' | 'CLIMATE' | 'GEOLOGY' | 'HISTORY';
  imageUrl: string;
  isPublished?: boolean;
  siteId?: number;
  createdAt: Date | string;
  updatedAt?: Date | string;
}
