import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-campsite-listings',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './campsite-listings.component.html',
  styleUrls: ['./campsite-listings.component.css'],
})
export class CampsiteListingsComponent implements OnInit {
  campsites: any[] = [];
  recommendedCampsites: any[] = [];
  isLoading = true;
  errorMessage: string | null = null;

  private apiUrl = 'http://localhost:8089/api/sites';

  amenityLabels: Record<string, string> = {
    wifi: 'WiFi',
    campfire: 'Campfire',
    hiking: 'Hiking',
    water: 'Water',
    group: 'Group',
  };

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadSites();
  }

  loadSites(): void {
    this.isLoading = true;
    this.http.get<any>(this.apiUrl).subscribe({
      next: (res) => {
        // Handle both array and ApiResponse-wrapped results
        const sites = Array.isArray(res) ? res : (res.data || res.content || []);
        this.campsites = sites.filter((s: any) => s.isActive !== false);
        // Recommended: top 2 by rating
        this.recommendedCampsites = [...this.campsites]
          .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
          .slice(0, 2);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load sites', err);
        this.errorMessage = 'Could not load campsites. Please try again.';
        this.isLoading = false;
      }
    });
  }
}
