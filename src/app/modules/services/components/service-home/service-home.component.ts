import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ServiceService } from '../../services/service.service';
import { Service } from '../../models/service.model';
import { PackService } from '../../services/pack.service';
import { Pack } from '../../models/pack.model';
import { forkJoin } from 'rxjs';
import { UserService } from '../../../../services/user.service';
import { CartService } from '../../../../services/cart.service';

@Component({
    selector: 'app-service-home',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './service-home.component.html',
    styleUrls: ['./service-home.component.css']
})
export class ServiceHomeComponent implements OnInit {
    featuredServices: Service[] = [];
    recommendedPacks: Pack[] = [];
    loading = false;

    constructor(
        private serviceService: ServiceService,
        private packService: PackService,
        private router: Router,
        private userService: UserService,
        public cartService: CartService
    ) { }

    ngOnInit(): void {
        this.loadData();
    }

    isOrganizer(): boolean {
        return this.userService.isOrganizer();
    }

    loadData(): void {
        this.loading = true;
        forkJoin({
            services: this.serviceService.getAll(),
            packs: this.packService.getAll()
        }).subscribe({
            next: (result) => {
                const allServices = result.services.length > 0 ? result.services : this.getMockServices();
                const rawPacks = result.packs.length > 0 ? result.packs : this.getMockPromoPacks();

                // Role-based filtering
                const isOrg = this.userService.isOrganizer();
                const filteredServices = allServices.filter(s => {
                    if (isOrg) {
                        return s.isOrganizerService || s.targetRole === 'ORGANIZER';
                    }
                    return (!s.targetRole || s.targetRole === 'USER') && !s.isOrganizerService;
                });

                this.featuredServices = filteredServices.slice(0, 4);
                this.recommendedPacks = this.applyRecommendations(rawPacks);
                this.loading = false;
            },
            error: () => {
                this.featuredServices = this.getMockServices().slice(0, 4);
                this.recommendedPacks = this.applyRecommendations(this.getMockPromoPacks());
                this.loading = false;
            }
        });
    }

    private applyRecommendations(packs: any[]): any[] {
        const prefsJson = localStorage.getItem('camp_user_preferences');
        if (!prefsJson) return packs.slice(0, 2); // Default to first 2 if no prefs

        const prefs = JSON.parse(prefsJson);
        const preferredSeason = prefs['season'] || [];
        const preferredCategory = prefs['primary_goal'] || [];

        return packs.map(pack => {
            let score = 0;
            // Match season
            if (pack.season === 'all' || preferredSeason.includes(pack.season)) score += 2;
            // Match category
            if (preferredCategory.includes(pack.category)) score += 3;
            return { ...pack, score };
        }).sort((a, b) => b.score - a.score).slice(0, 2);
    }

    private getMockServices(): any[] {
        return [
            { id: 1, name: 'Medical Assistance', price: 50, description: '24/7 Chief Doctor on site.', targetRole: 'USER' },
            { id: 2, name: 'Mountain Transport', price: 80, description: 'Rugged 4x4 off-road transport.', targetRole: 'USER' },
            { id: 3, name: 'Pro Camping Kit', price: 120, description: 'Full tent and gear setup.', targetRole: 'USER' },
            { id: 4, name: 'Guided Expedition', price: 45, description: 'Local experts for secret trails.', targetRole: 'USER' }
        ];
    }

    private getMockPromoPacks(): any[] {
        return [
            {
                id: 101,
                name: 'Summer Adventure Bundle',
                description: 'Complete gear + 4x4 transport + expert guide for the ultimate summer hiking experience.',
                price: 249,
                promotion: 'Summer Special - 30% Off',
                season: 'summer',
                category: 'adventure',
                image: 'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?q=80&w=2070&auto=format&fit=crop'
            },
            {
                id: 102,
                name: 'Family Safety Pack',
                description: 'Chief Doctor assistance + child-safe gear + 24/7 dedicated support.',
                price: 180,
                promotion: 'Family Deal',
                season: 'all',
                category: 'family',
                image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=2070&auto=format&fit=crop'
            },
            {
                id: 103,
                name: 'Winter Cozy Retreat',
                description: 'Insulated cabin tent + portable heater + thermal gear + hot beverage service.',
                price: 299,
                promotion: 'Winter Warmth',
                season: 'winter',
                category: 'relax',
                image: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=2070&auto=format&fit=crop'
            },
            {
                id: 104,
                name: 'Autumn Photography Pack',
                description: 'Professional drone rental + mountain guide + prime golden hour locations.',
                price: 150,
                promotion: 'Autumn Golden Hour',
                season: 'fall',
                category: 'photography',
                image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=2070&auto=format&fit=crop'
            }
        ];
    }

    onBook(targetId: number, type: 'service' | 'pack'): void {
        const params: any = {};
        if (type === 'service') params.service = targetId;
        else params.pack = targetId;

        this.router.navigate(['/campsites/1'], { queryParams: params });
    }

    getImageUrl(path: string | undefined): string {
        return this.cartService.getImageUrl(path);
    }
}
