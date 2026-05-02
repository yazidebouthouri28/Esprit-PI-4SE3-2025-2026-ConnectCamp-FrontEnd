import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { catchError, from, map, mergeMap, of, Subscription } from 'rxjs';
import { EventDetailComponent, Event } from '../event-detail/event-detail.component';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth.service';
import { EventService } from '../../services/event.service';
import { PinnedEventsService } from '../../services/pinned-events.service';
import { PreferenceSelections, ProfilePersonalizationService } from '../../services/profile-personalization.service';

type PinnedFitResult = {
  event: Event;
  score: number;
  reasons: string[];
};

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
  likesCount?: number;
  dislikesCount?: number;
  organizerName?: string;
  status?: string;
  gamifications?: any[];
};

@Component({
  selector: 'app-events-management',
  standalone: true,
  imports: [CommonModule, EventDetailComponent, FormsModule],
  templateUrl: './events-management.component.html',
  styleUrls: ['./events-management.component.css'],
})
export class EventsManagementComponent implements OnInit, OnDestroy {
  private readonly API_BASE = environment.apiUrl;
  private readonly fallbackImage =
    'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?q=80&w=1080';

  private readonly commentsIndex = new Map<number, string>();
  private readonly commentsLoading = new Set<number>();

  selectedEvent: Event | null = null;
  pinnedEventsOpen = false;
  private pinnedOrder: number[] = [];
  private pinnedSet = new Set<number>();
  private authSub: Subscription | null = null;
  pinnedFitRanked: PinnedFitResult[] = [];
  pinnedBestFit: PinnedFitResult | null = null;

  loading = false;
  errorMessage = '';

  events: Event[] = [];
  recommendedEvents: Event[] = [];
  recommendedPairIndex = 0;
  private recommendedRotateTimer: ReturnType<typeof setInterval> | null = null;
  recommendationProgressPct = 0;
  private recommendationElapsedMs = 0;
  private readonly recommendationRotateEveryMs = 8000;
  private readonly recommendationTickMs = 100;
  filteredEvents: Event[] = [];

  viewMode: 'grid' | 'list' = 'grid';
  searchQuery = '';
  sortBy = 'date';
  sortDropdownOpen = false;

  // Filter tags
  typeTrip = false;
  typeWorkshop = false;
  typeFestival = false;
  tagRewards = false;

  // Price range
  priceAbsMin = 0;
  priceAbsMax = 2000;
  priceRangeLow = 0;
  priceRangeHigh = 2000;

  constructor(
    private readonly http: HttpClient,
    private readonly authService: AuthService,
    private readonly eventService: EventService,
    private readonly pinnedEventsService: PinnedEventsService,
    private readonly profilePersonalization: ProfilePersonalizationService
  ) { }

  ngOnInit(): void {
    this.syncPinnedFromStorage();
    this.authSub = this.authService.currentUser$.subscribe(() => {
      // User context changed (login/logout) -> switch pinned list namespace.
      this.syncPinnedFromStorage();
    });
    this.loadEvents();
  }

  ngOnDestroy(): void {
    this.stopRecommendedRotation();
    this.authSub?.unsubscribe();
  }

  private syncPinnedFromStorage(): void {
    const ids = this.pinnedEventsService.getPinnedIds();
    this.pinnedOrder = ids;
    this.pinnedSet = new Set(ids);
    if (!ids.length) {
      this.pinnedEventsOpen = false;
    }
  }

  get pinnedCount(): number {
    return this.pinnedOrder.length;
  }

  isPinned(eventId: number): boolean {
    return this.pinnedSet.has(eventId);
  }

  togglePinned(event: Event, domEvent?: MouseEvent): void {
    domEvent?.stopPropagation();
    domEvent?.preventDefault();

    const ids = this.pinnedEventsService.togglePinned(event.id);
    this.pinnedOrder = ids;
    this.pinnedSet = new Set(ids);
    this.computePinnedComparison();
  }

  openPinnedEvents(domEvent?: MouseEvent): void {
    domEvent?.stopPropagation();
    domEvent?.preventDefault();
    if (this.pinnedOrder.length === 0) return;
    this.pinnedEventsOpen = true;
    this.computePinnedComparison();
  }

  closePinnedEvents(): void {
    this.pinnedEventsOpen = false;
  }

  get pinnedEvents(): Event[] {
    if (!this.pinnedOrder.length) return [];
    const byId = new Map<number, Event>(this.events.map((e) => [e.id, e]));
    return this.pinnedOrder.map((id) => byId.get(id)).filter(Boolean) as Event[];
  }

  selectPinnedEvent(event: Event, domEvent?: MouseEvent): void {
    domEvent?.stopPropagation();
    domEvent?.preventDefault();
    this.pinnedEventsOpen = false;
    this.selectEvent(event);
  }

  pinnedFitFor(eventId: number): PinnedFitResult | null {
    return this.pinnedFitRanked.find((r) => r.event.id === eventId) ?? null;
  }

  private computePinnedComparison(): void {
    const pinned = this.pinnedEvents;
    if (pinned.length < 2) {
      this.pinnedFitRanked = [];
      this.pinnedBestFit = null;
      return;
    }

    const preferences = this.profilePersonalization.getPreferences(this.authService.getCurrentUser());
    const ranked = pinned
      .map((ev) => this.scorePinnedEvent(ev, preferences))
      .sort((a, b) => b.score - a.score);

    this.pinnedFitRanked = ranked;
    this.pinnedBestFit = ranked[0] ?? null;
  }

  private scorePinnedEvent(event: Event, preferences: PreferenceSelections): PinnedFitResult {
    const reasons: string[] = [];
    let score = 0;

    const likes = event.likesCount ?? 0;
    const dislikes = event.dislikesCount ?? 0;
    const popularity = likes - dislikes;
    if (popularity > 0) {
      score += Math.min(6, popularity / 5);
      reasons.push(`It has stronger community feedback (likes: ${likes}, dislikes: ${dislikes}).`);
    } else if (likes || dislikes) {
      reasons.push(`Community feedback: likes ${likes}, dislikes ${dislikes}.`);
    }

    const isRecommended = this.recommendedEvents?.some((ev) => ev.id === event.id);
    if (isRecommended) {
      score += 6;
      reasons.push(`It appears in your personalized recommendations.`);
    }

    const text = this.normalizeSearchText(
      [event.title, event.location, event.type, event.organizer, event.description ?? ''].join(' ')
    );

    const match = (keywords: string[], weight: number, reason: string) => {
      if (!keywords.length) return;
      const hit = keywords.some((k) => text.includes(k));
      if (hit) {
        score += weight;
        reasons.push(reason);
      }
    };

    const activities = preferences?.['activities'] ?? [];
    if (activities.length) {
      const activityKeywords: Record<string, { keys: string[]; weight: number; reason: string }> = {
        hiking: { keys: ['hike', 'trek', 'trail', 'randonn', 'mountain'], weight: 3, reason: `Matches your interests: hiking/trekking.` },
        water: { keys: ['beach', 'coast', 'sea', 'lake', 'swim', 'kayak'], weight: 3, reason: `Matches your interests: water activities.` },
        photography: { keys: ['photo', 'shoot', 'camera'], weight: 2.5, reason: `Matches your interests: photography.` },
        stargazing: { keys: ['star', 'astro', 'night', 'sky'], weight: 2.5, reason: `Matches your interests: stargazing.` },
        fishing: { keys: ['fish', 'fishing'], weight: 2.5, reason: `Matches your interests: fishing.` },
        climbing: { keys: ['climb', 'climbing', 'rock'], weight: 3, reason: `Matches your interests: rock climbing.` },
        wildlife: { keys: ['wild', 'fauna', 'nature', 'eco', 'environment'], weight: 2, reason: `Matches your interests: wildlife/nature.` },
        gathering: { keys: ['campfire', 'social', 'community', 'meet', 'network', 'leadership'], weight: 2, reason: `Matches your interests: community/social events.` },
        cooking: { keys: ['cook', 'bbq', 'food', 'cuisine'], weight: 1.5, reason: `Matches your interests: outdoor cooking.` }
      };

      for (const activity of activities) {
        const def = activityKeywords[String(activity)];
        if (!def) continue;
        match(def.keys, def.weight, def.reason);
      }
    }

    const style = preferences?.['style'] ?? [];
    if (style.length) {
      const styleKeywords: Record<string, { keys: string[]; weight: number; reason: string }> = {
        beach: { keys: ['beach', 'coast', 'sea', 'shore'], weight: 2, reason: `Fits your preferred style: beachside/coastal.` },
        mountain: { keys: ['mountain', 'hill', 'highland'], weight: 2, reason: `Fits your preferred style: mountain/highland.` },
        desert: { keys: ['desert', 'sahara', 'dune'], weight: 2, reason: `Fits your preferred style: desert.` },
        forest: { keys: ['forest', 'wood', 'jungle', 'park'], weight: 2, reason: `Fits your preferred style: forest/woodland.` },
        lakeside: { keys: ['lake', 'lakeside', 'river'], weight: 2, reason: `Fits your preferred style: lakeside.` }
      };

      for (const s of style) {
        const def = styleKeywords[String(s)];
        if (!def) continue;
        match(def.keys, def.weight, def.reason);
      }
    }

    const goal = (preferences?.['primary_goal'] ?? [])[0];
    if (goal) {
      const goalMap: Record<string, { keys: string[]; weight: number; reason: string }> = {
        adventure: { keys: ['adventure', 'explor', 'trek', 'trail'], weight: 2, reason: `Aligns with your primary goal: adventure.` },
        nature: { keys: ['nature', 'eco', 'environment', 'forest'], weight: 2, reason: `Aligns with your primary goal: connect with nature.` },
        meeting: { keys: ['network', 'meet', 'community', 'leadership'], weight: 1.5, reason: `Aligns with your primary goal: meeting like-minded people.` },
        fitness: { keys: ['hike', 'trail', 'fitness', 'run', 'sport'], weight: 2, reason: `Aligns with your primary goal: fitness.` },
        relax: { keys: ['relax', 'wellness', 'calm'], weight: 1.5, reason: `Aligns with your primary goal: relaxation.` }
      };
      const def = goalMap[String(goal)];
      if (def) {
        match(def.keys, def.weight, def.reason);
      }
    }

    if (!reasons.length) {
      reasons.push(`Based on your preferences and community feedback, this is a solid match.`);
    }

    return { event, score: Math.round(score * 10) / 10, reasons };
  }

  loadEvents(): void {
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
            .filter((e) => this.isVisibleEventStatus(e.status))
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
        this.initPriceRangeFromData(list);
        this.applyFilters();
        this.loading = false;

        // Fetch personalized recommendations from backend
        this.loadRecommendations(list);
      });
  }

  private loadRecommendations(fallbackEvents: Event[]): void {
    if (!this.authService.isAuthenticated()) {
      // Not logged in → show upcoming events as fallback
      this.recommendedEvents = this.buildFallbackRecommendations(fallbackEvents);
      this.startRecommendedRotation();
      return;
    }

    this.eventService.getRecommendations().pipe(
      catchError(() => of([] as any[]))
    ).subscribe((data: any[]) => {
      if (data && data.length > 0) {
        this.recommendedEvents = data
          .map((e: any) => this.toUiEvent(e))
          .filter((ev) => ev.participants < ev.maxParticipants)
          .slice(0, 8);
      } else {
        this.recommendedEvents = this.buildFallbackRecommendations(fallbackEvents);
      }
      this.startRecommendedRotation();
      this.computePinnedComparison();
    });
  }

  get rotatingRecommendedEvents(): Event[] {
    const list = this.recommendedEvents;
    if (list.length <= 2) {
      return list;
    }

    const firstIndex = this.recommendedPairIndex * 2;
    const first = list[firstIndex % list.length];
    const second = list[(firstIndex + 1) % list.length];
    return [first, second].filter(Boolean) as Event[];
  }

  get recommendationSecondsLeft(): number {
    if (this.recommendedEvents.length <= 2) {
      return 0;
    }
    const remaining = this.recommendationRotateEveryMs - this.recommendationElapsedMs;
    return Math.max(0, Math.ceil(remaining / 1000));
  }

  private startRecommendedRotation(): void {
    this.stopRecommendedRotation();
    this.recommendedPairIndex = 0;
    this.recommendationElapsedMs = 0;
    this.recommendationProgressPct = 0;

    if (this.recommendedEvents.length <= 2) {
      return;
    }

    const pairCount = Math.ceil(this.recommendedEvents.length / 2);
    this.recommendedRotateTimer = setInterval(() => {
      this.recommendationElapsedMs += this.recommendationTickMs;
      const progress = (this.recommendationElapsedMs / this.recommendationRotateEveryMs) * 100;
      this.recommendationProgressPct = Math.min(100, progress);

      if (this.recommendationElapsedMs >= this.recommendationRotateEveryMs) {
        this.recommendedPairIndex = (this.recommendedPairIndex + 1) % pairCount;
        this.recommendationElapsedMs = 0;
        this.recommendationProgressPct = 0;
      }
    }, this.recommendationTickMs);
  }

  private stopRecommendedRotation(): void {
    if (this.recommendedRotateTimer) {
      clearInterval(this.recommendedRotateTimer);
      this.recommendedRotateTimer = null;
    }
  }

  toggleViewMode(): void {
    this.viewMode = this.viewMode === 'grid' ? 'list' : 'grid';
  }

  get sortLabel(): string {
    const labels: Record<string, string> = {
      date: 'Soonest First',
      highestRated: 'Most Liked',
      lowestPrice: 'Lowest Price',
      mostRewards: 'Most Rewards'
    };
    return labels[this.sortBy] ?? 'Soonest First';
  }

  setSortBy(value: string): void {
    this.sortBy = value;
    this.sortDropdownOpen = false;
    this.applyFilters();
  }

  get rangeFillLeftPct(): number {
    const span = this.priceAbsMax - this.priceAbsMin || 1;
    return ((this.priceRangeLow - this.priceAbsMin) / span) * 100;
  }

  get rangeFillWidthPct(): number {
    const span = this.priceAbsMax - this.priceAbsMin || 1;
    return ((this.priceRangeHigh - this.priceRangeLow) / span) * 100;
  }

  onPriceLowChange(): void {
    let lo = Number(this.priceRangeLow);
    let hi = Number(this.priceRangeHigh);
    lo = Math.max(this.priceAbsMin, Math.min(this.priceAbsMax, lo));
    if (lo > hi) lo = hi;
    this.priceRangeLow = lo;
    this.applyFilters();
  }

  onPriceHighChange(): void {
    let lo = Number(this.priceRangeLow);
    let hi = Number(this.priceRangeHigh);
    hi = Math.max(this.priceAbsMin, Math.min(this.priceAbsMax, hi));
    if (hi < lo) hi = lo;
    this.priceRangeHigh = hi;
    this.applyFilters();
  }

  private initPriceRangeFromData(list: Event[]): void {
    const prices = list.map((e) => e.price).filter((p) => !Number.isNaN(p));
    if (!prices.length) return;
    this.priceAbsMin = Math.floor(Math.min(...prices));
    this.priceAbsMax = Math.ceil(Math.max(...prices));
    if (this.priceAbsMax <= this.priceAbsMin) this.priceAbsMax = this.priceAbsMin + 1;
    this.priceRangeLow = this.priceAbsMin;
    this.priceRangeHigh = this.priceAbsMax;
  }

  applyFilters(): void {
    let result = [...this.events];

    // Price range
    result = result.filter(
      (e) => e.price >= this.priceRangeLow && e.price <= this.priceRangeHigh
    );

    // Type filters
    const selectedTypes: string[] = [];
    if (this.typeTrip) selectedTypes.push('trip');
    if (this.typeWorkshop) selectedTypes.push('workshop');
    if (this.typeFestival) selectedTypes.push('festival');

    if (selectedTypes.length) {
      result = result.filter((e) => selectedTypes.includes(e.type.toLowerCase()));
    }

    // Rewards filter
    if (this.tagRewards) {
      result = result.filter((e) => e.gamifications && e.gamifications.length > 0);
    }

    // Search query (title/location/description/comments)
    const rawQuery = (this.searchQuery || '').trim();
    if (rawQuery) {
      const tokens = this.tokenizeQuery(rawQuery);
      this.ensureCommentsIndexedForSearch(tokens, result);

      result = result.filter((event) => {
        const haystack = this.getEventSearchText(event);
        return tokens.every((token) => haystack.includes(token));
      });
    }

    // Sorting
    if (this.sortBy === 'date') {
      result = result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } else if (this.sortBy === 'lowestPrice') {
      result = result.sort((a, b) => a.price - b.price);
    } else if (this.sortBy === 'highestRated') {
      result = result.sort((a, b) => (b.likesCount ?? 0) - (a.likesCount ?? 0));
    } else if (this.sortBy === 'mostRewards') {
      result = result.sort((a, b) => (b.gamifications?.length || 0) - (a.gamifications?.length || 0));
    }

    this.filteredEvents = result;
  }

  private tokenizeQuery(raw: string): string[] {
    const normalized = this.normalizeSearchText(raw);
    return normalized.split(' ').map((t) => t.trim()).filter(Boolean);
  }

  private normalizeSearchText(value: string): string {
    return (value ?? '')
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private getEventSearchText(event: Event): string {
    const base = [
      event.title,
      event.location,
      event.organizer,
      event.type,
      event.description ?? '',
    ].join(' ');

    const comments = this.commentsIndex.get(event.id) ?? '';
    return this.normalizeSearchText(`${base} ${comments}`);
  }

  private ensureCommentsIndexedForSearch(tokens: string[], eventsToConsider: Event[]): void {
    // Avoid flooding the API for very short queries.
    const query = tokens.join(' ');
    if (!query || query.length < 3) return;

    // Only fetch for items that don't already match without comments.
    const candidates = eventsToConsider
      .filter((event) => !this.commentsIndex.has(event.id) && !this.commentsLoading.has(event.id))
      .filter((event) => {
        const base = this.normalizeSearchText(
          [event.title, event.location, event.organizer, event.type, event.description ?? ''].join(' ')
        );
        return !tokens.every((token) => base.includes(token));
      })
      .map((event) => event.id);

    if (!candidates.length) return;

    candidates.forEach((id) => this.commentsLoading.add(id));

    from(candidates)
      .pipe(
        mergeMap((eventId) => this.fetchEventCommentsText(eventId), 4)
      )
      .subscribe({
        next: ({ eventId, text }) => {
          this.commentsIndex.set(eventId, text);
          this.commentsLoading.delete(eventId);
          // Re-apply filters so newly indexed comments can make events appear.
          this.applyFilters();
        },
        error: () => {
          // Best effort only; do not block search.
        },
      });
  }

  private fetchEventCommentsText(eventId: number) {
    return this.http.get<any>(`${this.API_BASE}/api/comments/event/${eventId}`).pipe(
      map((res) => {
        const list = (res?.data ?? []) as any[];
        const text = list
          .map((c) => c?.content ?? c?.comment ?? c?.message ?? '')
          .filter(Boolean)
          .join(' ');
        return { eventId, text };
      }),
      catchError(() => {
        this.commentsLoading.delete(eventId);
        this.commentsIndex.set(eventId, '');
        return of({ eventId, text: '' });
      })
    );
  }

  private isVisibleEventStatus(status?: string): boolean {
    const normalized = (status ?? '').toUpperCase();
    // Public list should hide cancelled/draft items but keep published and completed ones.
    if (!normalized) return true;
    if (normalized === 'CANCELLED' || normalized === 'DRAFT') return false;
    return normalized === 'PUBLISHED' || normalized === 'COMPLETED';
  }

  private toUiEvent(e: EventResponse): Event {
    const start = e.startDate ? new Date(e.startDate) : null;
    const primaryImage = e.images?.find((img) => !!img);

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
      likesCount: e.likesCount ?? 0,
      dislikesCount: e.dislikesCount ?? 0,
      images: (e.images ?? []).map((img) => this.resolveMediaUrl(img)),
      gamifications: e.gamifications || [],
      description: e.description,
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

    // Already a full URL (http/https/data/blob)
    if (
      path.startsWith('http://') ||
      path.startsWith('https://') ||
      path.startsWith('data:') ||
      path.startsWith('blob:')
    ) {
      return path;
    }

    // Angular frontend asset (e.g. assets/images/events/photo.jpg)
    // Serve directly from the frontend origin
    if (path.startsWith('assets/') || path.startsWith('/assets/')) {
      return path.startsWith('/') ? path : `/${path}`;
    }

    // Backend-served upload with leading slash
    if (path.startsWith('/uploads/')) {
      return `${this.API_BASE}${path}`;
    }

    // Bare filename — assume it's in the backend uploads directory
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

  private buildFallbackRecommendations(events: Event[]): Event[] {
    return [...events]
      .filter((e) => e.participants < e.maxParticipants)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 8);
  }
}
