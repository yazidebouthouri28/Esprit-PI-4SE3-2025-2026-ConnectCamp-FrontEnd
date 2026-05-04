import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AlerteService } from '../../services/alerte.service';
import { EonetService } from '../../services/eonet.service';
import { AiService, AiPackAdvisorResponse } from '../../../../services/ai.service';
import { Alerte, EonetEvent } from '../../models/alerte.model';
import { UserService } from '../../../../services/user.service';

@Component({
    selector: 'app-alerte-list',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './alerte-list.component.html',
    styleUrls: ['./alerte-list.component.css']
})
export class AlerteListComponent implements OnInit {
    isAdmin = false;
    isCamper = false;
    myAlerts: Alerte[] = [];
    loading = false;

    // --- AI Safety Brief (camper only) ---
    briefLoading = false;
    briefReady = false;
    briefError = false;
    nearbyEvents: EonetEvent[] = [];
    aiBrief: AiPackAdvisorResponse | null = null;
    userLat: number | null = null;
    userLon: number | null = null;

    constructor(
        private userService: UserService,
        private alerteService: AlerteService,
        private eonetService: EonetService,
        private aiService: AiService
    ) { }

    ngOnInit(): void {
        this.isAdmin = this.userService.isAdmin();
        const role = this.userService.getLoggedInUser()?.role as string;
        this.isCamper = role === 'CAMPER' || role === 'PARTICIPANT' || role === 'USER';

        if (this.isCamper) {
            this.loadMyAlerts();
            this.loadAiSafetyBrief();
        }
    }

    /** Flux automatique : GPS → EONET → IA — aucune action requise du camper */
    private loadAiSafetyBrief(): void {
        if (!navigator.geolocation) { this.briefReady = true; return; }
        this.briefLoading = true;

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                this.userLat = pos.coords.latitude;
                this.userLon = pos.coords.longitude;

                this.eonetService.getNearbyEvents(this.userLat, this.userLon).subscribe({
                    next: (events) => {
                        this.nearbyEvents = events;

                        if (events.length === 0) {
                            // Aucun événement → zone sûre, pas besoin d'appeler l'IA
                            this.briefReady = true;
                            this.briefLoading = false;
                            return;
                        }

                        // Construire le prompt contextuel automatiquement
                        const eventSummary = events
                            .map(e => `${this.eonetService.categoryIcon(this.eonetService.getFirstCategoryId(e))} ${e.title} (${e.categories[0]?.title ?? 'Unknown'})`)
                            .join(', ');

                        const worstSeverity = this.eonetService.mapCategoryToSeverity(
                            this.eonetService.getFirstCategoryId(events[0])
                        );

                        this.aiService.advisePacks({
                            userQuery: `I am a camper. NASA EONET detected these natural events within 500 km of my location: ${eventSummary}. What safety pack should I choose and what precautions should I take right now?`,
                            eonetEvents: events.map(e => e.title),
                            siteRiskLevel: worstSeverity
                        }).subscribe({
                            next: (brief) => {
                                this.aiBrief = brief;
                                this.briefReady = true;
                                this.briefLoading = false;
                            },
                            error: () => {
                                this.briefError = true;
                                this.briefLoading = false;
                            }
                        });
                    },
                    error: () => { this.briefReady = true; this.briefLoading = false; }
                });
            },
            () => { this.briefReady = true; this.briefLoading = false; },
            { enableHighAccuracy: true, timeout: 6000 }
        );
    }

    eonetIcon(evt: EonetEvent): string {
        return this.eonetService.categoryIcon(this.eonetService.getFirstCategoryId(evt));
    }

    loadMyAlerts(): void {
        this.loading = true;
        this.alerteService.getMyAlerts().subscribe({
            next: (alerts) => {
                this.myAlerts = alerts;
                this.loading = false;
            },
            error: (err) => {
                console.error('Error loading my alerts', err);
                this.loading = false;
            }
        });
    }

    getStatusClass(status: string): string {
        switch (status) {
            case 'ACTIVE': return 'bg-red-50 text-red-600 border-red-100';
            case 'ACKNOWLEDGED': return 'bg-blue-50 text-blue-600 border-blue-100';
            case 'RESOLVED': return 'bg-green-50 text-green-700 border-green-100';
            default: return 'bg-gray-50 text-gray-400 border-gray-100';
        }
    }
}
