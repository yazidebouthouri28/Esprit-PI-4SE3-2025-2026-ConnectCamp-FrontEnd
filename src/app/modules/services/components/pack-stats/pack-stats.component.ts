import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PackService } from '../../services/pack.service';
import { Pack, PackServiceStats } from '../../models/pack.model';
import { ServiceService } from '../../services/service.service';
import { UserService } from '../../../../services/user.service';
import { CartService } from '../../../../services/cart.service';

const SERVICE_TYPES = [
    'TRANSPORT', 'CATERING', 'GUIDE', 'EQUIPMENT_RENTAL',
    'SECURITY', 'MEDICAL', 'FIRST_AID', 'PHOTOGRAPHY',
    'ANIMATION', 'ENTERTAINMENT', 'ACCOMMODATION', 'OTHER'
];

import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-pack-stats',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './pack-stats.component.html',
    styleUrls: ['./pack-stats.component.css']
})
export class PackStatsComponent implements OnInit {
    // --- Stats JPQL JOIN ---
    statsLoading = false;
    statsError: string | null = null;
    serviceStats: PackServiceStats[] = [];

    // --- At Risk JPQL Expert ---
    atRiskLoading = false;
    atRiskServices: any[] = [];

    // --- Filtre Keywords JOIN ---
    filterLoading = false;
    filterError: string | null = null;
    filteredPacks: Pack[] = [];
    siteNameInput = '';
    serviceTypeInput = 'TRANSPORT';

    readonly serviceTypes = SERVICE_TYPES;

    constructor(
        private packService: PackService,
        private serviceService: ServiceService,
        private userService: UserService,
        private cartService: CartService
    ) {}

    isAdmin(): boolean {
        return this.userService.isAdmin();
    }

    ngOnInit(): void {
        this.loadServiceStats();
        if (this.isAdmin()) {
            this.loadAtRiskServices();
        }
    }

    loadServiceStats(): void {
        this.statsLoading = true;
        this.statsError = null;
        this.packService.getPacksWithServiceStats().subscribe({
            next: data => {
                this.serviceStats = data;
                this.statsLoading = false;
            },
            error: () => {
                this.statsError = 'Impossible de charger les statistiques des packs.';
                this.statsLoading = false;
            }
        });
    }

    applyFilter(): void {
        if (!this.siteNameInput.trim()) return;
        this.filterLoading = true;
        this.filterError = null;
        this.filteredPacks = [];
        this.packService.filterBySiteAndServiceType(this.siteNameInput.trim(), this.serviceTypeInput).subscribe({
            next: data => {
                this.filteredPacks = data;
                this.filterLoading = false;
            },
            error: () => {
                this.filterError = 'Error filtering bundles.';
                this.filterLoading = false;
            }
        });
    }

    savings(stat: PackServiceStats): number {
        if (!stat.totalServicesValue || stat.totalServicesValue === 0) return 0;
        return +(stat.totalServicesValue - stat.price).toFixed(2);
    }

    loadAtRiskServices(): void {
        this.atRiskLoading = true;
        this.serviceService.getAtRiskServices().subscribe({
            next: (data) => {
                this.atRiskServices = data;
                this.atRiskLoading = false;
            },
            error: () => {
                this.atRiskLoading = false;
            }
        });
    }

    getImageUrl(imagePath: string | undefined): string {
        return this.cartService.getImageUrl(imagePath);
    }
}
