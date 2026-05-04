import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SiteService, CampsiteCompatibilityMatch, CampsiteCompatibilityRequest } from '../../services/site.service';
import { ProfilePersonalizationService, PreferenceSelections } from '../../services/profile-personalization.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-campsite-compatibility',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './campsite-compatibility.component.html',
  styleUrls: ['./campsite-compatibility.component.css']
})
export class CampsiteCompatibilityComponent implements OnInit {
  matches: CampsiteCompatibilityMatch[] = [];
  isLoading = false;
  errorMessage = '';
  hasSearched = false;

  // Form inputs
  capacity: number = 2;
  budgetMin: number = 0;
  budgetMax: number = 100;
  selectedAmenities: string[] = [];
  selectedTags: string[] = [];
  city: string = '';
  type: string = '';
  petFriendly: boolean = false;

  // Options
  amenityOptions = ['wifi', 'water', 'electricity', 'restroom', 'firepits', 'parking', 'shops'];
  tagOptions = ['beach', 'mountain', 'forest', 'desert', 'lakeside', 'family', 'adventure', 'quiet'];
  typeOptions = ['TENT', 'RV', 'CABIN', 'GLAMPING'];
  cityOptions = ['Tunis', 'Sfax', 'Sousse', 'Nabeul', 'Bizerte', 'Tozeur', 'Tabarka'];

  constructor(
    private siteService: SiteService,
    private profileService: ProfilePersonalizationService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    // Load user preferences if authenticated
    this.loadUserPreferences();
  }

  loadUserPreferences(): void {
    if (this.authService.isAuthenticated()) {
      const user = this.authService.getCurrentUser();
      const preferences = this.profileService.getPreferences(user);
      
      // Map profile preferences to form
      if (preferences['style']) {
        this.selectedTags = preferences['style'].filter(tag => this.tagOptions.includes(tag));
      }
      if (preferences['amenities']) {
        this.selectedAmenities = preferences['amenities'].filter(amenity => this.amenityOptions.includes(amenity));
      }
      if (preferences['capacity'] && preferences['capacity'][0]) {
        this.capacity = parseInt(preferences['capacity'][0], 10) || 2;
      }
      if (preferences['budget'] && preferences['budget'][0]) {
        const budgetMap: Record<string, number> = {
          'budget': 30,
          'standard': 60,
          'premium': 100,
          'luxury': 200
        };
        this.budgetMax = budgetMap[preferences['budget'][0]] || 100;
      }
      if (preferences['petFriendly']) {
        this.petFriendly = preferences['petFriendly'].includes('yes');
      }
    }
  }

  toggleAmenity(amenity: string): void {
    const index = this.selectedAmenities.indexOf(amenity);
    if (index > -1) {
      this.selectedAmenities.splice(index, 1);
    } else {
      this.selectedAmenities.push(amenity);
    }
  }

  toggleTag(tag: string): void {
    const index = this.selectedTags.indexOf(tag);
    if (index > -1) {
      this.selectedTags.splice(index, 1);
    } else {
      this.selectedTags.push(tag);
    }
  }

  findMatches(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.hasSearched = true;

    const request: CampsiteCompatibilityRequest = {
      capacity: this.capacity,
      budgetMin: this.budgetMin > 0 ? this.budgetMin : undefined,
      budgetMax: this.budgetMax,
      amenities: this.selectedAmenities.length > 0 ? this.selectedAmenities : undefined,
      preferredTags: this.selectedTags.length > 0 ? this.selectedTags : undefined,
      city: this.city || undefined,
      type: this.type || undefined,
      petFriendly: this.petFriendly,
      maxResults: 10
    };

    this.siteService.getCompatibilityMatches(request).subscribe({
      next: (results) => {
        this.matches = results;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = 'Unable to find compatible campsites. Please try again.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  getScoreColor(score: number): string {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 60) return 'bg-teal-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-gray-400';
  }

  getScoreLabel(score: number): string {
    if (score >= 80) return 'Perfect Match';
    if (score >= 60) return 'Great Match';
    if (score >= 40) return 'Good Match';
    return 'Fair Match';
  }

  resetFilters(): void {
    this.capacity = 2;
    this.budgetMin = 0;
    this.budgetMax = 100;
    this.selectedAmenities = [];
    this.selectedTags = [];
    this.city = '';
    this.type = '';
    this.petFriendly = false;
    this.matches = [];
    this.hasSearched = false;
  }
}
