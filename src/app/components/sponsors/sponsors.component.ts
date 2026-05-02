import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth.service';

interface Sponsor {
    id: number;
    name: string;
    logo: string;
    description: string;
    website: string;
    tier: 'GOLD' | 'SILVER' | 'BRONZE' | 'PLATINUM' | 'DIAMOND' | 'TITLE_SPONSOR';
}
interface SponsorTier {
    name: string;
    icon: string;
    price: string;
    description: string;
    perks: string[];
}

@Component({
    selector: 'app-sponsors',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './sponsors.component.html',
    styleUrls: ['./sponsors.component.css'],
})
export class SponsorsComponent implements OnInit {

    goldSponsors: Sponsor[] = [];
    silverSponsors: Sponsor[] = [];
    bronzeSponsors: Sponsor[] = [];
    communityPartners: { name: string; icon: string }[] = [];

    // Filters
    searchKeyword: string = '';
    selectedTier: string = '';
    selectedStatus: string = '';
    selectedLocation: string = '';
    isLoading: boolean = false;

    constructor(
        private http: HttpClient, 
        private router: Router,
        private authService: AuthService
    ) {}

    ngOnInit() {
        this.loadSponsors();
    }

    isSponsor(): boolean {
        const currentUser = this.authService.getCurrentUser() as any;
        if (!currentUser) return false;
        
        // Check if user is a sponsor, organizer, or admin - these roles can manage sponsorships
        const role = currentUser.role;
        if (typeof role === 'string') {
            return role.includes('SPONSOR') || role.includes('ORGANIZER') || role.includes('ADMIN');
        }
        
        // Also check sponsorStatus or isSponsor fields if available
        return currentUser.sponsorStatus === 'APPROVED' || currentUser.isSponsor === true || false;
    }

    canManageSponsorships(): boolean {
        return this.isSponsor();
    }

    loadSponsors() {
        this.isLoading = true;
        let url = `${environment.apiUrl}/api/sponsors`;
        
        // Use /filter if any filter is set
        if (this.selectedTier || this.selectedStatus || this.selectedLocation) {
            url = `${environment.apiUrl}/api/sponsors/filter?`;
            const params = [];
            if (this.selectedTier) params.push(`tier=${this.selectedTier}`);
            if (this.selectedStatus) params.push(`isActive=${this.selectedStatus === 'ACTIVE'}`);
            if (this.selectedLocation) params.push(`location=${encodeURIComponent(this.selectedLocation)}`);
            url += params.join('&');
        }

        this.http.get<any>(url).subscribe({
            next: (res) => {
                let sponsors: Sponsor[] = res.data ?? [];
                
                // Local keyword filtering if search is active
                if (this.searchKeyword.trim()) {
                    const kw = this.searchKeyword.toLowerCase();
                    sponsors = sponsors.filter(s => 
                        s.name.toLowerCase().includes(kw) || 
                        s.description?.toLowerCase().includes(kw)
                    );
                }

                this.goldSponsors = sponsors.filter(s => s.tier === 'GOLD');
                this.silverSponsors = sponsors.filter(s => s.tier === 'SILVER');
                this.bronzeSponsors = sponsors.filter(s => s.tier === 'BRONZE');
                this.communityPartners = sponsors
                    .filter(s => s.tier === 'PLATINUM' || s.tier === 'DIAMOND' || s.tier === 'TITLE_SPONSOR')
                    .map(s => ({ name: s.name, icon: '🤝' }));
                
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Failed to load sponsors', err);
                this.isLoading = false;
            }
        });
    }

    resolveLogo(logoUrl: string | undefined): string {
        if (!logoUrl) return '';
        if (logoUrl.startsWith('http://') || logoUrl.startsWith('https://') || logoUrl.startsWith('data:')) {
            return logoUrl;
        }
        return `${environment.apiUrl}/uploads/${logoUrl.replace(/^\/+/, '')}`;
    }

    applyFilters() {
        this.loadSponsors();
    }

    resetFilters() {
        this.searchKeyword = '';
        this.selectedTier = '';
        this.selectedStatus = '';
        this.selectedLocation = '';
        this.loadSponsors();
    }

    goToSponsorEvents() {
        const currentUser = this.authService.getCurrentUser() as any;
        if (!currentUser) return;
        
        const role = currentUser.role;
        if (typeof role === 'string') {
            if (role.includes('ORGANIZER') || role.includes('ADMIN')) {
                this.router.navigate(['/organizer/sponsorships']);
            } else {
                this.router.navigate(['/sponsor/events']);
            }
        } else {
            this.router.navigate(['/sponsor/events']);
        }
    }

    sponsorTiers: SponsorTier[] = [
        {
            name: 'Gold',
            icon: '🥇',
            price: '5 000 DT',
            description: 'Premium visibility and maximum impact',
            perks: [
                'Oversized logo on all event materials',
                'Dedicated booth at all ConnectCamp events',
                'Featured in homepage hero banner',
                'Social media spotlight (10 posts)',
                'Exclusive speaking slot at events',
            ],
        },
        {
            name: 'Silver',
            icon: '🥈',
            price: '2 500 DT',
            description: 'Strong presence across the platform',
            perks: [
                'Large logo on event materials',
                'Shared booth space at events',
                'Featured on sponsors page',
                'Social media mentions (5 posts)',
                'Logo on event merchandise',
            ],
        },
        {
            name: 'Bronze',
            icon: '🥉',
            price: '1 000 DT',
            description: 'Great entry-level sponsorship',
            perks: [
                'Logo on sponsors page',
                'Mention in event newsletters',
                'Social media mention (2 posts)',
                'Name on event program',
            ],
        },
    ];
}