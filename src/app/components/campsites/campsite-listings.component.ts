import { Component, OnDestroy, OnInit, ChangeDetectorRef, HostListener, ElementRef, Pipe, PipeTransform } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Site } from '../../models/camping.models';
import { SiteService } from '../../services/site.service';
import { AuthService } from '../../services/auth.service';
import { PreferenceSelections, ProfilePersonalizationService } from '../../services/profile-personalization.service';

// Text Highlight Pipe for search results
@Pipe({
  name: 'textHighlight',
  standalone: true
})
export class TextHighlightPipe implements PipeTransform {
  transform(value: string, searchKeyword: string): string {
    if (!searchKeyword || !value) return value;
    const regex = new RegExp(`(${searchKeyword})`, 'gi');
    return value.replace(regex, `<mark class="bg-yellow-300 rounded px-1 font-bold text-black drop-shadow-sm">$1</mark>`);
  }
}

interface CampsiteCard {
  id: number;
  name: string;
  location: string;
  image: string;
  rating: number;
  reviews: number;
  price: number;
  description: string;
  amenities: string[];
  tags: string[];
  distance: number | null;
  /** BEACH | MOUNTAIN | FOREST | DESERT from backend */
  siteType: string;
  verified: boolean;
  recommendationScore: number;
}

@Component({
  selector: 'app-campsite-listings',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, TextHighlightPipe],
  templateUrl: './campsite-listings.component.html',
  styleUrls: ['./campsite-listings.component.css'],
})
export class CampsiteListingsComponent implements OnInit, OnDestroy {
  isLoading = false;
  loadError = '';
  campsites: CampsiteCard[] = [];
  recommendedCampsites: CampsiteCard[] = [];
  filteredCampsites: CampsiteCard[] = [];
  activeRecommendedIndex = 0;
  recommendationsArePersonalized = false;

  viewMode: 'grid' | 'list' = 'grid';
  searchQuery = '';
  sortBy = 'featured';
  sortDropdownOpen = false;

  tagForest = false;
  tagMountain = false;
  tagDesert = false;
  tagBeach = false;
  tagVerified = false;

  priceAbsMin = 0;
  priceAbsMax = 500;
  priceRangeLow = 0;
  priceRangeHigh = 500;

  histogramBars: Array<{ heightPct: number; inRange: boolean }> = [];
  recommendedElapsedMs = 0;

  // RxJS Debounced Search (like CampHighlight admin)
  isSearching = false;
  private searchSubject = new Subject<string>();

  private readonly fallbackImage = 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?q=80&w=1080';
  private readonly tunisCenter = { latitude: 36.8065, longitude: 10.1815 };
  private readonly recommendedRotationMs = 6500;
  private readonly recommendedProgressTickMs = 100;
  private currentPreferences: PreferenceSelections = {};
  private recommendedRotationId: ReturnType<typeof setInterval> | null = null;
  private recommendedLastTickAt = 0;

  amenityLabels: Record<string, string> = {
    wifi: 'WiFi',
    campfire: 'Campfire',
    hiking: 'Hiking',
    water: 'Water',
    group: 'Group',
  };

  constructor(
    private siteService: SiteService,
    private authService: AuthService,
    private profilePersonalization: ProfilePersonalizationService,
    private cdr: ChangeDetectorRef,
    private elRef: ElementRef
  ) {}


  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elRef.nativeElement.contains(event.target)) {
      this.sortDropdownOpen = false;
    }
  }

  ngOnInit(): void {
    this.loadSites();

    // RxJS Debounced Search (like CampHighlight admin)
    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(searchTerm => {
      this.executeSearch(searchTerm);
    });
  }

  ngOnDestroy(): void {
    this.stopRecommendedRotation();
  }

  toggleViewMode(): void {
    this.viewMode = this.viewMode === 'grid' ? 'list' : 'grid';
  }

  get sortLabel(): string {
    const labels: Record<string, string> = {
      featured: 'Featured First',
      highestRated: 'Highest Rated',
      lowestPrice: 'Lowest Price',
      mostReviews: 'Most Reviews'
    };
    return labels[this.sortBy] ?? 'Featured First';
  }

  get recommendedSubtitle(): string {
    return this.recommendationsArePersonalized
      ? 'Curated around your camping preferences'
      : 'Curated from top campsite ratings';
  }

  get activeRecommendedProgressPct(): number {
    return Math.min(100, (this.recommendedElapsedMs / this.recommendedRotationMs) * 100);
  }

  setSortBy(value: string): void {
    this.sortBy = value;
    this.sortDropdownOpen = false;
    this.applyFilters();
  }

  selectRecommendedCampsite(index: number): void {
    if (index < 0 || index >= this.recommendedCampsites.length || index === this.activeRecommendedIndex) {
      return;
    }

    this.activeRecommendedIndex = index;
    this.resetRecommendedRotation();
    this.cdr.markForCheck();
  }

  showPreviousRecommended(): void {
    this.cycleRecommended(-1);
    this.resetRecommendedRotation();
  }

  showNextRecommended(): void {
    this.cycleRecommended(1);
    this.resetRecommendedRotation();
  }

  pauseRecommendedRotation(): void {
    this.stopRecommendedRotation();
  }

  resumeRecommendedRotation(): void {
    this.startRecommendedRotation();
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

  // RxJS Debounced Search Methods (like CampHighlight admin)
  onSearchInput(value: string): void {
    this.searchQuery = value;
    this.isSearching = true; // Trigger skeleton loader immediately
    this.searchSubject.next(value);
  }

  executeSearch(keyword: string): void {
    let result = [...this.campsites];
    const safeKeyword = keyword.trim().toLowerCase();

    if (safeKeyword) {
      // Search across multiple fields: name, location, description, amenities, tags
      result = result.filter(c => {
        const nameMatch = c.name.toLowerCase().includes(safeKeyword);
        const locationMatch = c.location.toLowerCase().includes(safeKeyword);
        const descriptionMatch = c.description?.toLowerCase().includes(safeKeyword);
        const amenitiesMatch = c.amenities?.some(a => a.toLowerCase().includes(safeKeyword));
        const tagsMatch = c.tags?.some(t => t.toLowerCase().includes(safeKeyword));
        const priceMatch = c.price.toString().includes(safeKeyword);
        const typeMatch = c.siteType?.toLowerCase().includes(safeKeyword);

        return nameMatch || locationMatch || descriptionMatch || amenitiesMatch || tagsMatch || priceMatch || typeMatch;
      });
    }

    // Apply other filters (price, tags, verified)
    this.applyFiltersToResult(result);
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.isSearching = true;
    this.searchSubject.next('');
  }

  applyFilters(): void {
    // Start with search-filtered results if there's a search query
    let result = [...this.campsites];
    const safeKeyword = this.searchQuery.trim().toLowerCase();

    if (safeKeyword) {
      // Apply search filter first (same logic as executeSearch)
      result = result.filter(c => {
        const nameMatch = c.name.toLowerCase().includes(safeKeyword);
        const locationMatch = c.location.toLowerCase().includes(safeKeyword);
        const descriptionMatch = c.description?.toLowerCase().includes(safeKeyword);
        const amenitiesMatch = c.amenities?.some(a => a.toLowerCase().includes(safeKeyword));
        const tagsMatch = c.tags?.some(t => t.toLowerCase().includes(safeKeyword));
        const priceMatch = c.price.toString().includes(safeKeyword);
        const typeMatch = c.siteType?.toLowerCase().includes(safeKeyword);

        return nameMatch || locationMatch || descriptionMatch || amenitiesMatch || tagsMatch || priceMatch || typeMatch;
      });
    }

    this.applyFiltersToResult(result);
  }

  private applyFiltersToResult(result: CampsiteCard[]): void {
    result = result.filter(
      (c) => c.price >= this.priceRangeLow && c.price <= this.priceRangeHigh
    );

    const selectedTypes: string[] = [];
    if (this.tagForest) selectedTypes.push('FOREST');
    if (this.tagMountain) selectedTypes.push('MOUNTAIN');
    if (this.tagDesert) selectedTypes.push('DESERT');
    if (this.tagBeach) selectedTypes.push('BEACH');
    if (selectedTypes.length) {
      result = result.filter((c) => {
        const siteTypeValue = String(c.siteType || '').toUpperCase().trim();

        // If siteType is explicitly set to a valid type, use it strictly
        if (siteTypeValue && ['FOREST', 'MOUNTAIN', 'DESERT', 'BEACH'].includes(siteTypeValue)) {
          return selectedTypes.includes(siteTypeValue);
        }

        // For empty/unknown siteType, use keyword detection with CONFLICT RESOLUTION
        const nameAndDesc = (c.name + ' ' + (c.description || '')).toLowerCase();

        // First, detect what type this campsite ACTUALLY is based on content
        let detectedType: string | null = null;

        // Check for desert indicators (strongest indicators first)
        if (nameAndDesc.includes('desert') || nameAndDesc.includes('sahara') || nameAndDesc.includes('dune')) {
          detectedType = 'DESERT';
        }
        // Check for beach indicators
        else if (nameAndDesc.includes('beach') || nameAndDesc.includes('ocean') || nameAndDesc.includes('coast') || nameAndDesc.includes('sea')) {
          detectedType = 'BEACH';
        }
        // Check for mountain indicators
        else if (nameAndDesc.includes('mountain') || nameAndDesc.includes('mont')) {
          detectedType = 'MOUNTAIN';
        }
        // Check for forest indicators
        else if (nameAndDesc.includes('forest') || nameAndDesc.includes('wood')) {
          detectedType = 'FOREST';
        }

        // If we detected a type, only match if it's in the selected types
        if (detectedType) {
          return selectedTypes.includes(detectedType);
        }

        // If no type detected, don't show when any type filter is active
        return false;
      });
    }

    if (this.tagVerified) {
      result = result.filter((c) => c.verified);
    }

    if (this.sortBy === 'highestRated') {
      result = result.sort((a, b) => b.rating - a.rating);
    } else if (this.sortBy === 'lowestPrice') {
      result = result.sort((a, b) => a.price - b.price);
    } else if (this.sortBy === 'mostReviews') {
      result = result.sort((a, b) => b.reviews - a.reviews);
    }

    this.filteredCampsites = result;
    this.isSearching = false; // Disable skeleton loaders
    this.updateHistogramInRange();
    this.cdr.markForCheck();
  }

  getAmenityLabel(amenity: string): string {
    return this.amenityLabels[amenity] ?? this.toTitleCase(amenity);
  }

  getSiteTypeLabel(siteType: string): string {
    return this.toTitleCase(siteType || 'Campsite');
  }

  getRecommendationSummary(card: CampsiteCard): string {
    if (card.description.trim()) {
      return card.description.trim();
    }

    const amenityPreview = card.amenities
      .slice(0, 2)
      .map((amenity) => this.getAmenityLabel(amenity).toLowerCase())
      .join(' and ');

    const prefix = this.recommendationsArePersonalized
      ? 'Picked to match your outdoor style'
      : 'A standout escape loved by ConnectCamp travelers';

    if (amenityPreview) {
      return `${prefix}, this ${this.getSiteTypeLabel(card.siteType).toLowerCase()} stay blends ${amenityPreview} with the scenery of ${card.location}.`;
    }

    return `${prefix}, this ${this.getSiteTypeLabel(card.siteType).toLowerCase()} retreat brings a memorable atmosphere in ${card.location}.`;
  }

  getRecommendedMetaChips(card: CampsiteCard): string[] {
    const chips: string[] = [];

    if (card.siteType) {
      chips.push(this.getSiteTypeLabel(card.siteType));
    }

    if (card.distance !== null) {
      chips.push(`${card.distance} mi from Tunis`);
    } else if (card.location) {
      chips.push(card.location);
    }

    for (const tag of card.tags.slice(0, 2)) {
      const normalizedTag = this.toTitleCase(tag);
      if (normalizedTag && !chips.includes(normalizedTag)) {
        chips.push(normalizedTag);
      }
    }

    for (const amenity of card.amenities.slice(0, 2)) {
      const label = this.getAmenityLabel(amenity);
      if (label && !chips.includes(label)) {
        chips.push(label);
      }
    }

    return chips.slice(0, 4);
  }

  getRecommendedProgressPct(index: number): number {
    return index === this.activeRecommendedIndex ? this.activeRecommendedProgressPct : 0;
  }

  private loadSites(): void {
    this.isLoading = true;
    this.loadError = '';

    this.siteService.getAllSites().subscribe({
      next: (sites) => {
        const mapped = sites.map((site) => this.toCard(site));
        this.campsites = mapped;
        this.recommendedCampsites = this.buildRecommendedCampsites(mapped);
        this.initializeRecommendedCarousel();
        this.isLoading = false;
        this.initPriceRangeFromData(mapped);
        this.rebuildHistogram(mapped);
        this.applyFilters();
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.loadError = 'Unable to load campsites right now.';
        this.cdr.detectChanges();
      }
    });
  }

  private initPriceRangeFromData(cards: CampsiteCard[]): void {
    const prices = cards.map((c) => c.price).filter((p) => !Number.isNaN(p));
    if (!prices.length) {
      this.priceAbsMin = 0;
      this.priceAbsMax = 500;
      this.priceRangeLow = 0;
      this.priceRangeHigh = 500;
      return;
    }
    const rawMin = Math.min(...prices);
    const rawMax = Math.max(...prices);
    this.priceAbsMin = Math.max(0, Math.floor(rawMin));
    this.priceAbsMax = Math.ceil(rawMax);
    if (this.priceAbsMax <= this.priceAbsMin) {
      this.priceAbsMax = this.priceAbsMin + 1;
    }
    this.priceRangeLow = this.priceAbsMin;
    this.priceRangeHigh = this.priceAbsMax;
  }

  private rebuildHistogram(cards: CampsiteCard[]): void {
    const n = 14;
    const min = this.priceAbsMin;
    const max = this.priceAbsMax;
    const span = max - min || 1;
    const counts = new Array(n).fill(0);
    for (const c of cards) {
      let idx = Math.floor(((c.price - min) / span) * n);
      idx = Math.max(0, Math.min(n - 1, idx));
      counts[idx]++;
    }
    const mx = Math.max(...counts, 1);
    this.histogramBars = counts.map((count) => ({
      heightPct: Math.max(8, (count / mx) * 100),
      inRange: false
    }));
    this.updateHistogramInRange();
  }

  private updateHistogramInRange(): void {
    const n = this.histogramBars.length;
    if (!n) return;
    const min = this.priceAbsMin;
    const max = this.priceAbsMax;
    const span = max - min || 1;
    this.histogramBars = this.histogramBars.map((bar, i) => {
      const bucketLow = min + (i / n) * span;
      const bucketHigh = min + ((i + 1) / n) * span;
      const inRange = bucketHigh >= this.priceRangeLow && bucketLow <= this.priceRangeHigh;
      return { ...bar, inRange };
    });
  }

  private toCard(site: Site): CampsiteCard {
    const cityOrLocation = (site.location || site.city || '').trim();
    const country = (site.country || 'Tunisia').trim();
    const location = cityOrLocation ? `${cityOrLocation}, ${country}` : country;
    const amenities = (site.amenities ?? [])
      .map((amenity) => String(amenity).trim().toLowerCase())
      .filter(Boolean);

    return {
      id: site.id,
      name: site.name,
      location,
      image: site.images?.[0] || site.image || this.fallbackImage,
      rating: Number(site.averageRating ?? 0),
      reviews: Number(site.reviewCount ?? 0),
      price: Number(site.pricePerNight ?? site.price ?? 0),
      description: String(site.description ?? '').trim(),
      amenities,
      tags: (site.tags ?? []).map((tag) => String(tag).trim()).filter(Boolean),
      distance: this.estimateDistanceInMiles(site.latitude, site.longitude),
      siteType: String(site.type || '').trim(),
      verified: site.verified === true,
      recommendationScore: 0
    };
  }

  private estimateDistanceInMiles(latitude?: number, longitude?: number): number | null {
    if (latitude === undefined || longitude === undefined || Number.isNaN(latitude) || Number.isNaN(longitude)) {
      return null;
    }

    const distanceKm = this.haversineDistanceKm(
      this.tunisCenter.latitude,
      this.tunisCenter.longitude,
      latitude,
      longitude
    );

    return Number((distanceKm * 0.621371).toFixed(1));
  }

  private haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const toRad = (value: number) => (value * Math.PI) / 180;
    const earthRadiusKm = 6371;

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadiusKm * c;
  }

  private toTitleCase(value: string): string {
    return value
      .split(/[-_\s]+/)
      .filter(Boolean)
      .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1).toLowerCase())
      .join(' ');
  }

  private buildRecommendedCampsites(cards: CampsiteCard[]): CampsiteCard[] {
    const fallback = [...cards]
      .sort((a, b) => b.rating - a.rating || b.reviews - a.reviews)
      .slice(0, 5)
      .map((card, index) => ({
        ...card,
        recommendationScore: this.toFallbackRecommendationScore(card, index)
      }));

    const preferences = this.profilePersonalization.getPreferences(this.authService.getCurrentUser());
    this.currentPreferences = preferences;
    this.recommendationsArePersonalized = this.hasActivePreferences(preferences);

    if (!this.recommendationsArePersonalized) {
      return fallback;
    }

    const ranked = cards
      .map((card) => ({ card, score: this.scoreCampsite(card, preferences) }))
      .sort((a, b) => b.score - a.score || b.card.rating - a.card.rating || b.card.reviews - a.card.reviews);

    const strongestScore = ranked[0]?.score ?? 0;
    const personalized = ranked
      .filter((entry) => entry.score > 0)
      .slice(0, 5)
      .map((entry, index) => ({
        ...entry.card,
        recommendationScore: this.toPersonalizedRecommendationScore(entry.score, strongestScore, index)
      }));

    if (personalized.length) {
      return personalized;
    }

    this.recommendationsArePersonalized = false;
    return fallback;
  }

  private scoreCampsite(card: CampsiteCard, preferences: PreferenceSelections): number {
    let score = 0;
    const siteType = String(card.siteType || '').toUpperCase();
    const location = card.location.toLowerCase();
    const amenities = card.amenities.map((item) => item.toLowerCase());

    const styleWeights: Record<string, string[]> = {
      beach: ['BEACH'],
      mountain: ['MOUNTAIN'],
      desert: ['DESERT'],
      forest: ['FOREST'],
      lakeside: ['BEACH']
    };

    for (const style of preferences['style'] || []) {
      if ((styleWeights[style] || []).includes(siteType)) {
        score += 4;
      }

      if (style === 'lakeside' && this.includesAny(location, ['lake', 'lagoon', 'river', 'water'])) {
        score += 2;
      }
    }

    const amenitiesMap: Record<string, string[]> = {
      electricity: ['electric', 'power'],
      water: ['water', 'shower'],
      restroom: ['restroom', 'toilet', 'bathroom'],
      wifi: ['wifi', 'internet'],
      shops: ['shop', 'store', 'restaurant', 'market'],
      parking: ['parking'],
      firepits: ['fire', 'bbq', 'campfire']
    };

    for (const amenity of preferences['amenities'] || []) {
      if ((amenitiesMap[amenity] || []).some((expected) => amenities.some((value) => value.includes(expected)))) {
        score += 2;
      }
    }

    if ((preferences['amenities'] || []).includes('none') && amenities.length <= 2) {
      score += 2;
    }

    const activities = preferences['activities'] || [];
    if (activities.includes('hiking') && ['MOUNTAIN', 'FOREST'].includes(siteType)) score += 3;
    if (activities.includes('water') && (siteType === 'BEACH' || amenities.includes('water'))) score += 3;
    if (activities.includes('stargazing') && siteType === 'DESERT') score += 3;
    if (activities.includes('wildlife') && ['FOREST', 'DESERT'].includes(siteType)) score += 2;
    if (activities.includes('climbing') && siteType === 'MOUNTAIN') score += 3;
    if (activities.includes('reading') && ['FOREST', 'BEACH'].includes(siteType)) score += 1;
    if (activities.includes('gathering') && amenities.some((value) => value.includes('group') || value.includes('fire'))) score += 2;

    const intensity = preferences['intensity']?.[0];
    if (intensity === 'relaxed') {
      score += Math.min(3, amenities.length);
    } else if (intensity === 'extreme' && amenities.length <= 2) {
      score += 3;
    } else if (intensity === 'moderate' && amenities.length >= 2 && amenities.length <= 5) {
      score += 2;
    }

    const primaryGoal = preferences['primary_goal']?.[0];
    if (primaryGoal === 'relax' && ['BEACH', 'FOREST'].includes(siteType)) score += 2;
    if (primaryGoal === 'adventure' && ['MOUNTAIN', 'DESERT'].includes(siteType)) score += 3;
    if (primaryGoal === 'nature' && ['FOREST', 'MOUNTAIN'].includes(siteType)) score += 2;
    if (primaryGoal === 'family' && amenities.some((value) => ['water', 'toilet', 'parking'].some((token) => value.includes(token)))) score += 2;
    if (primaryGoal === 'photography' && card.rating >= 4) score += 2;

    score += this.scorePrice(card.price, preferences['budget']?.[0]);

    if ((preferences['special'] || []).includes('eco') && card.verified) score += 1;
    if ((preferences['special'] || []).includes('family') && amenities.some((value) => value.includes('parking') || value.includes('water'))) score += 2;

    return score;
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

  private includesAny(source: string, values: string[]): boolean {
    return values.some((value) => source.includes(value));
  }

  private hasActivePreferences(preferences: PreferenceSelections): boolean {
    return Object.values(preferences).some((entries) => Array.isArray(entries) && entries.length > 0);
  }

  private toFallbackRecommendationScore(card: CampsiteCard, index: number): number {
    const ratingContribution = Math.round((card.rating / 5) * 22);
    const reviewContribution = Math.min(12, Math.round(card.reviews / 6));
    return Math.max(78, Math.min(96, 68 + ratingContribution + reviewContribution - index));
  }

  private toPersonalizedRecommendationScore(score: number, strongestScore: number, index: number): number {
    if (strongestScore <= 0) {
      return 80;
    }

    const normalized = 80 + Math.round((score / strongestScore) * 18) - index;
    return Math.max(80, Math.min(99, normalized));
  }

  private initializeRecommendedCarousel(): void {
    this.activeRecommendedIndex = 0;
    this.recommendedElapsedMs = 0;
    this.stopRecommendedRotation();
    this.startRecommendedRotation();
  }

  private startRecommendedRotation(): void {
    if (this.recommendedRotationId || this.recommendedCampsites.length <= 1) {
      return;
    }

    this.recommendedLastTickAt = Date.now();
    this.recommendedRotationId = setInterval(() => {
      const now = Date.now();
      const delta = now - this.recommendedLastTickAt;
      this.recommendedLastTickAt = now;
      this.recommendedElapsedMs += delta;

      if (this.recommendedElapsedMs >= this.recommendedRotationMs) {
        this.recommendedElapsedMs = 0;
        this.cycleRecommended(1);
      }

      this.cdr.markForCheck();
    }, this.recommendedProgressTickMs);
  }

  private stopRecommendedRotation(): void {
    if (this.recommendedRotationId) {
      clearInterval(this.recommendedRotationId);
      this.recommendedRotationId = null;
    }
  }

  private resetRecommendedRotation(): void {
    this.recommendedElapsedMs = 0;
    this.stopRecommendedRotation();
    this.startRecommendedRotation();
  }

  private cycleRecommended(step: 1 | -1): void {
    if (!this.recommendedCampsites.length) {
      return;
    }

    const total = this.recommendedCampsites.length;
    this.activeRecommendedIndex = (this.activeRecommendedIndex + step + total) % total;
  }

}
