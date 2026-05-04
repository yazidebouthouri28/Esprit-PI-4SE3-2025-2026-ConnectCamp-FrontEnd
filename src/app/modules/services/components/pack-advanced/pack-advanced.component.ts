import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PackService } from '../../services/pack.service';
import { PackValueRank, BundleOptimizerResult, PackQuality } from '../../models/pack.model';
import { AiService, AiPackAdvisorResponse } from '../../../../services/ai.service';
import { EonetService } from '../../../emergency/services/eonet.service';
import { EonetEvent } from '../../../emergency/models/alerte.model';

import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-pack-advanced',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './pack-advanced.component.html',
    styleUrls: ['./pack-advanced.component.css']
})
export class PackAdvancedComponent implements OnInit {

    // --- Value Ranking ---
    rankLoading = false;
    rankError: string | null = null;
    valueRanking: PackValueRank[] = [];
    qualityMetrics: PackQuality[] = [];

    // --- Bundle Optimizer ---
    optimizerLoading = false;
    optimizerError: string | null = null;
    optimizerResult: BundleOptimizerResult | null = null;
    budgetInput: number | null = null;
    personsInput: number | null = null;

    // --- AI Pack Advisor ---
    advisorLoading = false;
    advisorError: string | null = null;
    advisorResult: AiPackAdvisorResponse | null = null;
    advisorQuery = '';
    advisorBudget: number | null = null;
    advisorPersons: number | null = null;

    // --- EONET / GPS context ---
    eonetEvents: EonetEvent[] = [];
    eonetLoading = false;
    userLat: number | null = null;
    userLon: number | null = null;
    gpsStatus: 'idle' | 'loading' | 'ok' | 'denied' | 'error' = 'idle';

    constructor(
        private packService: PackService,
        private aiService: AiService,
        private eonetService: EonetService
    ) {}

    ngOnInit(): void {
        this.loadValueRanking();
        this.loadQualityMetrics();
        this.loadGpsAndEonet();
    }

    loadGpsAndEonet(): void {
        if (!navigator.geolocation) {
            this.gpsStatus = 'error';
            return;
        }
        this.gpsStatus = 'loading';
        this.eonetLoading = true;
        navigator.geolocation.getCurrentPosition(
            pos => {
                this.userLat = pos.coords.latitude;
                this.userLon = pos.coords.longitude;
                this.gpsStatus = 'ok';
                this.eonetService.getNearbyEvents(this.userLat, this.userLon).subscribe({
                    next: events => { this.eonetEvents = events; this.eonetLoading = false; },
                    error: () => { this.eonetLoading = false; }
                });
            },
            err => {
                this.gpsStatus = err.code === 1 ? 'denied' : 'error';
                this.eonetLoading = false;
                // fallback: load global events (last 7 days)
                this.eonetService.getGlobalEvents().subscribe({
                    next: events => { this.eonetEvents = events.slice(0, 5); },
                    error: () => {}
                });
            },
            { timeout: 8000, maximumAge: 300000 }
        );
    }

    eonetIcon(event: EonetEvent): string {
        const catId = this.eonetService.getFirstCategoryId(event);
        return this.eonetService.categoryIcon(catId);
    }

    loadValueRanking(): void {
        this.rankLoading = true;
        this.rankError = null;
        this.packService.getPackValueRanking().subscribe({
            next: data => { this.valueRanking = data; this.rankLoading = false; },
            error: () => { this.rankError = 'Unable to load ranking.'; this.rankLoading = false; }
        });
    }

    loadQualityMetrics(): void {
        this.packService.getPackQualityMetrics().subscribe({
            next: data => { this.qualityMetrics = data; },
            error: () => { console.error('Unable to load quality metrics.'); }
        });
    }

    runOptimizer(): void {
        if (!this.budgetInput || this.budgetInput <= 0) return;
        this.optimizerLoading = true;
        this.optimizerError = null;
        this.optimizerResult = null;
        this.packService.getBundleOptimizer(this.budgetInput, this.personsInput ?? undefined).subscribe({
            next: data => { this.optimizerResult = data; this.optimizerLoading = false; },
            error: () => { this.optimizerError = 'Error during optimization.'; this.optimizerLoading = false; }
        });
    }

    scoreBarWidth(score: number): string {
        return `${Math.min(100, score)}%`;
    }

    rankMedal(rank: number): string {
        if (rank === 1) return '🥇';
        if (rank === 2) return '🥈';
        if (rank === 3) return '🥉';
        return `#${rank}`;
    }

    savingsPercent(result: BundleOptimizerResult): number {
        if (!result.totalServicesValue || result.totalServicesValue === 0) return 0;
        return Math.round((result.totalSavings / result.totalServicesValue) * 100);
    }

    runAdvisor(): void {
        if (!this.advisorQuery.trim()) return;
        this.advisorLoading = true;
        this.advisorError = null;
        this.advisorResult = null;

        this.aiService.advisePacks({
            userQuery: this.advisorQuery,
            budget: this.advisorBudget ?? undefined,
            persons: this.advisorPersons ?? undefined,
            // Pass GPS so backend auto-fetches EONET; fallback to frontend event titles
            latitude:  this.userLat ?? undefined,
            longitude: this.userLon ?? undefined,
            eonetEvents: this.userLat == null
                ? this.eonetEvents.map(e => e.title)
                : undefined,
        }).subscribe({
            next: data => { this.advisorResult = data; this.advisorLoading = false; },
            error: (err) => {
                const msg = err?.error?.message || err?.message || 'Error during generation.';
                this.advisorError = msg;
                this.advisorLoading = false;
            }
        });
    }

    confidenceClass(c: string): string {
        const map: Record<string, string> = { HIGH: 'conf-high', MEDIUM: 'conf-medium', LOW: 'conf-low' };
        return map[c] ?? '';
    }
}
