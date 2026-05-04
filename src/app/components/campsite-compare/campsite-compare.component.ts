import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SiteService, CampsiteComparison } from '../../services/site.service';
import { Site } from '../../models/camping.models';

interface CompareSiteSelection {
  site: Site;
  selected: boolean;
}

@Component({
  selector: 'app-campsite-compare',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './campsite-compare.component.html',
  styleUrls: ['./campsite-compare.component.css']
})
export class CampsiteCompareComponent implements OnInit {
  allCampsites: CompareSiteSelection[] = [];
  selectedSiteIds: number[] = [];
  comparisonResult: CampsiteComparison | null = null;
  isLoading = false;
  errorMessage = '';
  maxSelection = 4;

  constructor(
    private siteService: SiteService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadCampsites();
    
    // Check for pre-selected sites from query params
    this.route.queryParams.subscribe(params => {
      const ids = params['ids'];
      if (ids) {
        this.selectedSiteIds = ids.split(',').map((id: string) => parseInt(id, 10));
        if (this.selectedSiteIds.length >= 2) {
          this.loadComparison();
        }
      }
    });
  }

  loadCampsites(): void {
    this.isLoading = true;
    this.siteService.getAllSites().subscribe({
      next: (sites) => {
        this.allCampsites = sites.map(site => ({
          site,
          selected: this.selectedSiteIds.includes(site.id)
        }));
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = 'Unable to load campsites.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  toggleSelection(siteId: number): void {
    const index = this.selectedSiteIds.indexOf(siteId);
    if (index > -1) {
      this.selectedSiteIds.splice(index, 1);
    } else {
      if (this.selectedSiteIds.length < this.maxSelection) {
        this.selectedSiteIds.push(siteId);
      }
    }
    this.updateSelectionState();
  }

  updateSelectionState(): void {
    this.allCampsites.forEach(item => {
      item.selected = this.selectedSiteIds.includes(item.site.id);
    });
  }

  loadComparison(): void {
    if (this.selectedSiteIds.length < 2) {
      this.errorMessage = 'Please select at least 2 campsites to compare.';
      return;
    }
    if (this.selectedSiteIds.length > 4) {
      this.errorMessage = 'You can compare up to 4 campsites at once.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.comparisonResult = null;

    this.siteService.compareSites(this.selectedSiteIds).subscribe({
      next: (result) => {
        this.comparisonResult = result;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = 'Unable to compare campsites. Please try again.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  clearSelection(): void {
    this.selectedSiteIds = [];
    this.comparisonResult = null;
    this.updateSelectionState();
  }

  getWinnerClass(siteId: number): string {
    if (!this.comparisonResult) return '';
    const winners = [
      this.comparisonResult.bestPriceSiteId,
      this.comparisonResult.highestRatedSiteId,
      this.comparisonResult.largestCapacitySiteId,
      this.comparisonResult.mostEquippedSiteId,
      this.comparisonResult.recommendedSiteId
    ];
    return winners.includes(siteId) ? 'ring-2 ring-emerald-500' : '';
  }

  getWinnerBadges(siteId: number): string[] {
    if (!this.comparisonResult) return [];
    const badges: string[] = [];
    if (siteId === this.comparisonResult.bestPriceSiteId) badges.push('Best Price');
    if (siteId === this.comparisonResult.highestRatedSiteId) badges.push('Top Rated');
    if (siteId === this.comparisonResult.largestCapacitySiteId) badges.push('Largest');
    if (siteId === this.comparisonResult.mostEquippedSiteId) badges.push('Best Equipped');
    if (siteId === this.comparisonResult.recommendedSiteId) badges.push('Recommended');
    return badges;
  }
}
