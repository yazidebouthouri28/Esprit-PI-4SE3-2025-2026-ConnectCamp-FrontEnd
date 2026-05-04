import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { catchError, map, of } from 'rxjs';
import { EventDetailComponent, Event } from '../event-detail/event-detail.component';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth.service';
import { PreferenceSelections, ProfilePersonalizationService } from '../../services/profile-personalization.service';

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
  timestamp?: string;
};

type EventResponse = {
  id: number;
  title: string;
  description?: string;
  eventType?: string;
  category?: string;
  startDate: string; // LocalDateTime serialized
  endDate?: string;
  location?: string;
  maxParticipants?: number;
  currentParticipants?: number;
  price?: number;
  isFree?: boolean;
  images?: string[];
  thumbnail?: string;
  organizerName?: string;
  status?: string;
  gamifications?: any[];
};

@Component({
  selector: 'app-events-management',
  standalone: true,
  imports: [CommonModule, EventDetailComponent, HttpClientModule],
  templateUrl: './events-management.component.html',
  styleUrls: ['./events-management.component.css'],
})
export class EventsManagementComponent implements OnInit {
  private readonly API_BASE = environment.apiUrl;
  private readonly fallbackImage =
    'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?q=80&w=1080';

  selectedEvent: Event | null = null;

  loading = false;
  errorMessage = '';

  events: Event[] = [];
  recommendedEvents: Event[] = [];

  constructor(
    private readonly http: HttpClient,
    private readonly authService: AuthService,
    private readonly profilePersonalization: ProfilePersonalizationService
  ) { }

  ngOnInit(): void {
    this.loadEvents();
  }

  private loadEvents(): void {
    this.loading = true;
    this.errorMessage = '';

    this.http
      .get<ApiResponse<EventResponse[]>>(`${this.API_BASE}/api/events`)
      .pipe(
        map((res) => {
          if (!res?.success) {
            throw new Error(res?.message || 'Failed to load events');
          }
          return (res.data ?? [])
            .filter((e) => ['PUBLISHED', 'COMPLETED'].includes((e.status ?? '').toUpperCase()))
            .map((e) => this.toUiEvent(e));
        }),
        catchError((err) => {
          const msg =
            err?.error?.message ||
            err?.message ||
            'Unable to load events. Make sure backend is running.';
          this.errorMessage = msg;
          this.loading = false;
          return of([] as Event[]);
        })
      )
      .subscribe((list) => {
        this.events = list;

        this.recommendedEvents = this.buildRecommendedEvents(list);

        this.loading = false;
      });
  }

  private toUiEvent(e: EventResponse): Event {
    const start = e.startDate ? new Date(e.startDate) : null;
    const primaryImage = e.thumbnail || e.images?.find((img) => !!img);

    const type: 'workshop' | 'trip' | 'festival' = this.normalizeEventType(
      e.eventType ?? e.category
    );

    return {
      id: e.id,
      title: e.title,
      type,
      date: start ? start.toDateString() : 'N/A',
      time: e.endDate ? 'Scheduled' : 'TBA',
      location: e.location || 'Unknown location',
      image: this.resolveMediaUrl(primaryImage),
      participants: e.currentParticipants ?? 0,
      maxParticipants: e.maxParticipants ?? 1,
      price: e.isFree ? 0 : e.price ?? 0,
      organizer: e.organizerName || 'Organizer',
      images: (e.images ?? []).map((img) => this.resolveMediaUrl(img)),
      gamifications: e.gamifications || [],
    };
  }

  private normalizeEventType(raw?: string): 'workshop' | 'trip' | 'festival' {
    const v = (raw ?? '').toLowerCase();

    if (v.includes('workshop') || v.includes('atelier') || v.includes('training')) return 'workshop';
    if (v.includes('festival') || v.includes('music')) return 'festival';

    return 'trip';
  }

  private resolveMediaUrl(path?: string): string {
    if (!path) {
      return this.fallbackImage;
    }

    if (
      path.startsWith('http://') ||
      path.startsWith('https://') ||
      path.startsWith('data:') ||
      path.startsWith('blob:')
    ) {
      return path;
    }

    if (path.startsWith('/uploads/')) {
      return `${this.API_BASE}${path}`;
    }

    return `${this.API_BASE}/uploads/${path}`;
  }

  progressPercent(ev: Event): number {
    if (!ev.maxParticipants || ev.maxParticipants <= 0) return 0;
    return (ev.participants / ev.maxParticipants) * 100;
  }

  selectEvent(event: Event) {
    this.selectedEvent = event;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  clearSelection() {
    this.selectedEvent = null;
  }

  private buildRecommendedEvents(events: Event[]): Event[] {
    const fallback = [...events]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 2);

    const preferences = this.profilePersonalization.getPreferences(this.authService.getCurrentUser());
    if (!Object.keys(preferences).length) {
      return fallback;
    }

    const ranked = events
      .map((event) => ({ event, score: this.scoreEvent(event, preferences) }))
      .sort((a, b) => b.score - a.score || new Date(a.event.date).getTime() - new Date(b.event.date).getTime());

    const personalized = ranked.filter((entry) => entry.score > 0).map((entry) => entry.event).slice(0, 2);
    return personalized.length ? personalized : fallback;
  }

  private scoreEvent(event: Event, preferences: PreferenceSelections): number {
    let score = 0;
    const searchSpace = `${event.title} ${event.location} ${event.organizer} ${event.description || ''}`.toLowerCase();
    const type = event.type.toLowerCase();

    const styleKeywords: Record<string, string[]> = {
      beach: ['beach', 'coast', 'sea', 'shore'],
      mountain: ['mountain', 'hill', 'peak', 'trail'],
      desert: ['desert', 'sahara', 'dune'],
      forest: ['forest', 'wood', 'nature', 'park'],
      lakeside: ['lake', 'lagoon', 'river', 'water']
    };

    for (const style of preferences['style'] || []) {
      if ((styleKeywords[style] || []).some((keyword) => searchSpace.includes(keyword))) {
        score += 3;
      }
    }

    const primaryGoal = preferences['primary_goal']?.[0];
    if (primaryGoal === 'adventure' && type === 'trip') score += 3;
    if (primaryGoal === 'meeting' && ['festival', 'workshop'].includes(type)) score += 3;
    if (primaryGoal === 'family' && this.includesAny(searchSpace, ['family', 'kids', 'group'])) score += 2;
    if (primaryGoal === 'photography' && this.includesAny(searchSpace, ['photo', 'sunset', 'camera', 'landscape'])) score += 2;
    if (primaryGoal === 'nature' && this.includesAny(searchSpace, ['nature', 'trail', 'camp', 'forest', 'desert'])) score += 2;

    const activities = preferences['activities'] || [];
    if (activities.includes('hiking') && this.includesAny(searchSpace, ['hike', 'trail', 'trek'])) score += 3;
    if (activities.includes('water') && this.includesAny(searchSpace, ['water', 'beach', 'swim', 'kayak'])) score += 3;
    if (activities.includes('photography') && this.includesAny(searchSpace, ['photo', 'camera', 'sunrise'])) score += 3;
    if (activities.includes('stargazing') && this.includesAny(searchSpace, ['star', 'night', 'astronomy', 'desert'])) score += 3;
    if (activities.includes('climbing') && this.includesAny(searchSpace, ['climb', 'mountain', 'summit'])) score += 3;
    if (activities.includes('gathering') && ['festival', 'workshop'].includes(type)) score += 2;
    if (activities.includes('cooking') && this.includesAny(searchSpace, ['cook', 'bbq', 'culinary'])) score += 2;

    const intensity = preferences['intensity']?.[0];
    if (intensity === 'relaxed' && type === 'workshop') score += 2;
    if (intensity === 'extreme' && this.includesAny(searchSpace, ['challenge', 'extreme', 'survival'])) score += 3;
    if (intensity === 'moderate' && type === 'trip') score += 2;

    const group = preferences['group']?.[0];
    if (group === 'solo' && this.includesAny(searchSpace, ['solo', 'retreat'])) score += 2;
    if (group === 'large_groups' && this.includesAny(searchSpace, ['family', 'festival', 'group'])) score += 2;
    if (group === 'meeting_new' && ['festival', 'workshop'].includes(type)) score += 2;

    const season = preferences['season'] || [];
    const eventMonth = new Date(event.date).getMonth();
    if (this.matchesSeason(eventMonth, season)) {
      score += 2;
    }

    score += this.scorePrice(event.price, preferences['budget']?.[0]);

    return score;
  }

  private matchesSeason(monthIndex: number, seasonSelections: string[]): boolean {
    const seasonByMonth = ['winter', 'winter', 'spring', 'spring', 'spring', 'summer', 'summer', 'summer', 'fall', 'fall', 'fall', 'winter'];
    if (seasonSelections.includes('flexible')) {
      return true;
    }

    return seasonSelections.includes(seasonByMonth[Math.max(0, monthIndex)]);
  }

  private scorePrice(price: number, budget?: string): number {
    if (!budget) {
      return 0;
    }

    if (budget === 'budget') {
      if (price <= 30) return 4;
      if (price <= 50) return 2;
    }

    if (budget === 'moderate') {
      if (price >= 30 && price <= 70) return 4;
      if (price > 70 && price <= 90) return 2;
    }

    if (budget === 'comfortable') {
      if (price >= 70 && price <= 150) return 4;
      if (price >= 50 && price < 70) return 2;
    }

    if (budget === 'premium') {
      if (price >= 150) return 4;
      if (price >= 100) return 2;
    }

    return 0;
  }

  private includesAny(value: string, candidates: string[]): boolean {
    return candidates.some((candidate) => value.includes(candidate));
  }
}
