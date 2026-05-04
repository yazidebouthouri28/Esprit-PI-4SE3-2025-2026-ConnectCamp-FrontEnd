import { Component, OnInit, ChangeDetectorRef, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Site } from '../../models/camping.models';
import { SiteService } from '../../services/site.service';
import { AuthService } from '../../services/auth.service';
import { PreferenceSelections, ProfilePersonalizationService } from '../../services/profile-personalization.service';

interface CampsiteCard {
  id: number;
  name: string;
  location: string;
  image: string;
  rating: number;
  reviews: number;
  price: number;
  amenities: string[];
  distance: number | null;
  /** BEACH | MOUNTAIN | FOREST | DESERT from backend */
  siteType: string;
  verified: boolean;
}

@Component({
  selector: 'app-campsite-listings',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './campsite-listings.component.html',
  styleUrls: ['./campsite-listings.component.css'],
})
export class CampsiteListingsComponent implements OnInit {
  isLoading = false;
  loadError = '';
  campsites: CampsiteCard[] = [];
  recommendedCampsites: CampsiteCard[] = [];
  filteredCampsites: CampsiteCard[] = [];

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

  private readonly fallbackImage = 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?q=80&w=1080';
  private readonly tunisCenter = { latitude: 36.8065, longitude: 10.1815 };

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
  ) { }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elRef.nativeElement.contains(event.target)) {
      this.sortDropdownOpen = false;
    }
  }

  ngOnInit(): void {
    this.loadSites();
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

  applyFilters(): void {
    let result = [...this.campsites];

    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      result = result.filter(
        (c) => c.name.toLowerCase().includes(query) || c.location.toLowerCase().includes(query)
      );
    }

    result = result.filter(
      (c) => c.price >= this.priceRangeLow && c.price <= this.priceRangeHigh
    );

    const selectedTypes: string[] = [];
    if (this.tagForest) selectedTypes.push('FOREST');
    if (this.tagMountain) selectedTypes.push('MOUNTAIN');
    if (this.tagDesert) selectedTypes.push('DESERT');
    if (this.tagBeach) selectedTypes.push('BEACH');
    if (selectedTypes.length) {
      result = result.filter((c) =>
        selectedTypes.includes(String(c.siteType || '').toUpperCase().trim())
      );
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
    this.updateHistogramInRange();
    this.cdr.markForCheck();
  }

  getAmenityLabel(amenity: string): string {
    return this.amenityLabels[amenity] ?? this.toTitleCase(amenity);
  }

  private loadSites(): void {
    this.isLoading = true;
    this.loadError = '';

    this.siteService.getAllSites().subscribe({
      next: (sites) => {
        const mapped = sites.map((site) => this.toCard(site));
        this.campsites = mapped;
        this.recommendedCampsites = this.buildRecommendedCampsites(mapped);
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
      amenities,
      distance: this.estimateDistanceInMiles(site.latitude, site.longitude),
      siteType: String(site.type || '').trim(),
      verified: site.verified === true
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
      .slice(0, 2);

    const preferences = this.profilePersonalization.getPreferences(this.authService.getCurrentUser());
    if (!Object.keys(preferences).length) {
      return fallback;
    }

    const ranked = cards
      .map((card) => ({ card, score: this.scoreCampsite(card, preferences) }))
      .sort((a, b) => b.score - a.score || b.card.rating - a.card.rating || b.card.reviews - a.card.reviews);

    const personalized = ranked.filter((entry) => entry.score > 0).map((entry) => entry.card).slice(0, 2);
    return personalized.length ? personalized : fallback;
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
}
