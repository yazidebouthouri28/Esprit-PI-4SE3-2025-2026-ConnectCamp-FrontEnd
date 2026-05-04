import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlerteService } from '../../services/alerte.service';
import { EonetService } from '../../services/eonet.service';
import { AiService, AiSitrepResponse } from '../../../../services/ai.service';
import { SiteRiskScore, InterventionEfficiency, EonetEvent } from '../../models/alerte.model';

@Component({
    selector: 'app-alerte-advanced',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './alerte-advanced.component.html',
    styleUrls: ['./alerte-advanced.component.css']
})
export class AlerteAdvancedComponent implements OnInit {

    // --- Risk Score ---
    riskLoading = false;
    riskError: string | null = null;
    riskResult: SiteRiskScore | null = null;
    siteIdInput: number | null = null;

    // --- Intervention Efficiency ---
    effLoading = false;
    effError: string | null = null;
    efficiencies: InterventionEfficiency[] = [];

    // --- EONET Global Events ---
    eonetLoading = false;
    eonetError: string | null = null;
    eonetEvents: EonetEvent[] = [];

    // --- AI SITREP ---
    sitrepLoading = false;
    sitrepError: string | null = null;
    sitrep: AiSitrepResponse | null = null;

    constructor(
        private alerteService: AlerteService,
        private eonetService: EonetService,
        private aiService: AiService
    ) {}

    ngOnInit(): void {
        this.loadEfficiency();
        this.loadEonetEvents();
    }

    loadRiskScore(): void {
        if (!this.siteIdInput) return;
        this.riskLoading = true;
        this.riskError = null;
        this.riskResult = null;
        this.alerteService.getSiteRiskScore(this.siteIdInput).subscribe({
            next: data => { this.riskResult = data; this.riskLoading = false; },
            error: () => { this.riskError = 'Impossible de calculer le score de risque.'; this.riskLoading = false; }
        });
    }

    loadEfficiency(): void {
        this.effLoading = true;
        this.effError = null;
        this.alerteService.getInterventionEfficiency().subscribe({
            next: data => { this.efficiencies = data; this.effLoading = false; },
            error: () => { this.effError = 'Impossible de charger les données d\'efficacité.'; this.effLoading = false; }
        });
    }

    riskLevelClass(level: string): string {
        const map: Record<string, string> = {
            SAFE: 'level-safe', WATCH: 'level-watch',
            DANGER: 'level-danger', CRITICAL: 'level-critical'
        };
        return map[level] ?? '';
    }

    riskGaugeWidth(score: number): string {
        return `${score}%`;
    }

    riskGaugeColor(score: number): string {
        if (score <= 20) return '#22c55e';
        if (score <= 50) return '#f59e0b';
        if (score <= 80) return '#f97316';
        return '#ef4444';
    }

    efficiencyBarWidth(rate: number): string {
        return `${Math.min(100, rate)}%`;
    }

    typeIcon(type: string): string {
        const map: Record<string, string> = {
            FIRE: '🔥', MEDICAL: '🏥', WEATHER: '⛈️',
            SECURITY: '🔒', EVACUATION: '🚨', NATURAL_DISASTER: '🌊',
            EQUIPMENT_FAILURE: '⚙️', OTHER: '❗'
        };
        return map[type] ?? '❗';
    }

    generateSitrep(): void {
        this.sitrepLoading = true;
        this.sitrepError = null;
        this.sitrep = null;
        this.aiService.generateSitrep().subscribe({
            next: data => { this.sitrep = data; this.sitrepLoading = false; },
            error: () => { this.sitrepError = 'Impossible de générer le SITREP. Vérifiez la clé API.'; this.sitrepLoading = false; }
        });
    }

    sitrepThreatClass(level: string): string {
        const map: Record<string, string> = {
            SAFE: 'threat-safe', WATCH: 'threat-watch',
            DANGER: 'threat-danger', CRITICAL: 'threat-critical'
        };
        return map[level] ?? '';
    }

    loadEonetEvents(): void {
        this.eonetLoading = true;
        this.eonetError = null;
        this.eonetService.getGlobalEvents().subscribe({
            next: events => { this.eonetEvents = events; this.eonetLoading = false; },
            error: () => { this.eonetError = 'Unable to reach NASA EONET API.'; this.eonetLoading = false; }
        });
    }

    eonetIcon(evt: EonetEvent): string {
        return this.eonetService.categoryIcon(this.eonetService.getFirstCategoryId(evt));
    }

    eonetTypeLabel(evt: EonetEvent): string {
        return this.eonetService.mapCategoryToType(this.eonetService.getFirstCategoryId(evt));
    }

    eonetSeverityClass(evt: EonetEvent): string {
        const sev = this.eonetService.mapCategoryToSeverity(this.eonetService.getFirstCategoryId(evt));
        return { LOW: 'sev-low', MEDIUM: 'sev-medium', HIGH: 'sev-high', CRITICAL: 'sev-critical' }[sev] ?? '';
    }

    eonetLatestDate(evt: EonetEvent): string | null {
        if (!evt.geometry || evt.geometry.length === 0) return null;
        return evt.geometry[evt.geometry.length - 1].date;
    }
}
