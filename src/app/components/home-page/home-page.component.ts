import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HomeHubComponent } from '../home-hub/home-hub.component';
import { HeroSectionComponent } from '../hero-section/hero-section.component';
import { CampsiteListingsComponent } from '../campsite-listings/campsite-listings.component';
import { CommunityForumComponent } from '../community-forum/community-forum.component';
import { EventsManagementComponent } from '../events-management/events-management.component';
import { MarketplaceComponent } from '../marketplace/marketplace.component';
import { UserDashboardComponent } from '../user-dashboard/user-dashboard.component';
import { SponsorsComponent } from '../sponsors/sponsors.component';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [
    CommonModule,
    HeroSectionComponent,
    HomeHubComponent,
    CampsiteListingsComponent,
    CommunityForumComponent,
    EventsManagementComponent,
    MarketplaceComponent,
    UserDashboardComponent,
    SponsorsComponent,
  ],
  template: `
    @switch (activeSection) {
      @case ('home') {
        <app-home-hub />
      }
      @case ('campsites') {
        <app-campsite-listings />
      }
      @case ('events') {
        <app-events-management />
      }
      @case ('marketplace') {
        <app-marketplace />
      }
      @case ('community') {
        <app-community-forum />
      }
      @case ('sponsors') {
        <app-sponsors />
      }
      @case ('dashboard') {
        <app-user-dashboard />
      }
      @default {
        <app-home-hub />
      }
    }
  `,
  styles: [],
})
export class HomePageComponent implements OnInit {
  activeSection = 'home';

  constructor(private route: ActivatedRoute) { }

  ngOnInit() {
    this.route.data.subscribe((data) => {
      this.activeSection = data['section'] || 'home';
    });
  }
}
