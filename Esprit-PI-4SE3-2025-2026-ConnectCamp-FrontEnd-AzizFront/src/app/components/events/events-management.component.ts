import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventDetailComponent, Event } from '../event-detail/event-detail.component';

@Component({
  selector: 'app-events-management',
  standalone: true,
  imports: [CommonModule, EventDetailComponent],
  templateUrl: './events-management.component.html',
  styleUrls: ['./events-management.component.css'],
})
export class EventsManagementComponent {
  selectedEvent: Event | null = null;
  events: Event[] = [
    { id: 1, title: 'Wilderness Survival Skills Workshop', type: 'workshop', date: 'Feb 15, 2026', time: '9:00 AM - 4:00 PM', location: 'Zaghouan Mountain, Tunisia', image: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?q=80&w=1080', participants: 18, maxParticipants: 25, price: 85, organizer: 'Tunis Adventure Co.' },
    { id: 2, title: 'Summer Camping Music Festival', type: 'festival', date: 'Jul 4-6, 2026', time: 'All Day', location: 'Kelibia Beach, Tunisia', image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1080', participants: 342, maxParticipants: 500, price: 195, organizer: 'Carthage Sounds' },
    { id: 3, title: "Beginner's Backcountry Group Trip", type: 'trip', date: 'Mar 22-24, 2026', time: '3 Days / 2 Nights', location: 'Sahara Desert, Douz, Tunisia', image: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1080', participants: 8, maxParticipants: 12, price: 250, organizer: 'Sahara Peak Adventures' },
    { id: 4, title: 'Family Camping Weekend', type: 'trip', date: 'Apr 12-14, 2026', time: 'Weekend', location: 'Beni M Tir, Tunisia', image: 'https://images.unsplash.com/photo-1510672981848-a1c4f1cb5ccf?q=80&w=1080', participants: 24, maxParticipants: 30, price: 120, organizer: 'Bizerte Outdoors Club' },
    { id: 5, title: 'Photography & Nature Workshop', type: 'workshop', date: 'May 8, 2026', time: '6:00 AM - 2:00 PM', location: 'Haouaria Cliffs, Tunisia', image: 'https://images.unsplash.com/photo-1533873984035-25970ab07451?q=80&w=1080', participants: 12, maxParticipants: 15, price: 95, organizer: 'Tunisian Nature Photo' },
    { id: 6, title: 'Mountain Summit Challenge', type: 'trip', date: 'Jun 15-18, 2026', time: '4 Days / 3 Nights', location: 'Djebel Chaambi, Tunisia', image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1080', participants: 6, maxParticipants: 10, price: 450, organizer: 'Summit Seekers Tunisia' },
  ];

  recommendedEvents: Event[] = [
    { id: 1, title: 'Wilderness Survival Skills Workshop', type: 'workshop', date: 'Feb 15, 2026', time: '9:00 AM - 4:00 PM', location: 'Zaghouan Mountain, Tunisia', image: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?q=80&w=1080', participants: 18, maxParticipants: 25, price: 85, organizer: 'Tunis Adventure Co.' },
    { id: 3, title: "Beginner's Backcountry Group Trip", type: 'trip', date: 'Mar 22-24, 2026', time: '3 Days / 2 Nights', location: 'Sahara Desert, Douz, Tunisia', image: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1080', participants: 8, maxParticipants: 12, price: 250, organizer: 'Sahara Peak Adventures' },
  ];

  eventTypeClass(type: string): string {
    const map: Record<string, string> = {
      workshop: 'bg-blue-100 text-blue-700',
      trip: 'bg-green-100 text-green-700',
      festival: 'bg-purple-100 text-purple-700',
    };
    return map[type] ?? '';
  }

  progressPercent(e: Event): number {
    return (e.participants / e.maxParticipants) * 100;
  }

  selectEvent(event: Event) {
    this.selectedEvent = event;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  clearSelection() {
    this.selectedEvent = null;
  }
}
