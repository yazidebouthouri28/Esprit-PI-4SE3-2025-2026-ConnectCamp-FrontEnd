import { EventServiceEntity } from './event-service-entity.model';

export interface Event {
    id: number;
    title: string;
    type: 'workshop' | 'trip' | 'festival';
    date: string;
    time: string;
    location: string;
    image: string;
    images?: string[];
    participants: number;
    maxParticipants: number;
    price: number;
    organizer: string;
    organizerId?: number;
    organizerUserId?: number;
    description?: string;
    sponsors?: string[];
    features?: string[];
    requestedServices?: EventServiceEntity[];
    likesCount?: number;
    dislikesCount?: number;
    rating?: number;
    rawEndDate?: string;
}
