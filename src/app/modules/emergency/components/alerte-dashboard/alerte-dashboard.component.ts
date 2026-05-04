import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AlerteService } from '../../services/alerte.service';
import { AiService, AiSitrepResponse } from '../../../../services/ai.service';
import { Alerte } from '../../models/alerte.model';

@Component({
    selector: 'app-alerte-dashboard',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './alerte-dashboard.component.html',
    styleUrls: ['./alerte-dashboard.component.css']
})
export class AlerteDashboardComponent implements OnInit {
    alerts: Alerte[] = [];
    loading = false;
    error: string | null = null;
    filteredAlerts: Alerte[] = [];
    activeFilter = 'ALL';
    searchTerm = '';

    // --- AI SITREP ---
    sitrepLoading = false;
    sitrep: AiSitrepResponse | null = null;
    sitrepError = false;

    get activeAlertsCount(): number {
        return this.alerts.filter(a => a.status === 'ACTIVE').length;
    }

    constructor(
        private alerteService: AlerteService,
        private aiService: AiService
    ) { }

    ngOnInit(): void {
        this.loadAlerts();
    }

    generateSitrep(): void {
        this.sitrepLoading = true;
        this.sitrep = null;
        this.sitrepError = false;
        this.aiService.generateSitrep().subscribe({
            next: (data) => { this.sitrep = data; this.sitrepLoading = false; },
            error: () => { this.sitrepError = true; this.sitrepLoading = false; }
        });
    }

    threatColor(level: string): string {
        const map: Record<string, string> = {
            SAFE: 'text-green-400', WATCH: 'text-amber-400',
            DANGER: 'text-orange-400', CRITICAL: 'text-red-400'
        };
        return map[level] ?? 'text-gray-400';
    }

    threatBg(level: string): string {
        const map: Record<string, string> = {
            SAFE: 'from-green-900/40 to-green-800/20 border-green-700/30',
            WATCH: 'from-amber-900/40 to-amber-800/20 border-amber-700/30',
            DANGER: 'from-orange-900/40 to-orange-800/20 border-orange-700/30',
            CRITICAL: 'from-red-900/40 to-red-800/20 border-red-700/30'
        };
        return map[level] ?? 'from-gray-900/40 to-gray-800/20 border-gray-700/30';
    }

    loadAlerts(): void {
        this.loading = true;
        this.alerteService.getDashboardAlerts().subscribe({
            next: (data) => {
                this.alerts = data;
                this.applyFilter(this.activeFilter);
                this.loading = false;
            },
            error: (err) => {
                this.error = 'Failed to load emergency alerts.';
                this.loading = false;
            }
        });
    }

    onSearch(event: any) {
        this.searchTerm = event.target.value.toLowerCase();
        this.applyFilter(this.activeFilter);
    }

    applyFilter(status: string) {
        this.activeFilter = status;
        let filtered = this.alerts;

        if (status !== 'ALL') {
            filtered = filtered.filter(a => a.status === status);
        }

        if (this.searchTerm) {
            filtered = filtered.filter(a =>
                a.title.toLowerCase().includes(this.searchTerm) ||
                a.description.toLowerCase().includes(this.searchTerm) ||
                a.reportedByName?.toLowerCase().includes(this.searchTerm) ||
                a.location?.toLowerCase().includes(this.searchTerm)
            );
        }

        this.filteredAlerts = filtered;
    }

    onAcknowledge(id: number): void {
        this.alerteService.acknowledge(id).subscribe({
            next: () => this.loadAlerts(),
            error: (err) => console.error('Error acknowledging', err)
        });
    }

    onResolve(id: number): void {
        const notes = prompt('Enter resolution notes:');
        if (notes !== null) {
            this.alerteService.resolve(id, notes).subscribe({
                next: () => this.loadAlerts(),
                error: (err) => console.error('Error resolving', err)
            });
        }
    }

    getSeverityClass(severity: string): string {
        switch (severity) {
            case 'CRITICAL': return 'bg-gradient-to-r from-red-600 to-red-800 h-1.5';
            case 'HIGH': return 'bg-gradient-to-r from-orange-500 to-red-500 h-1.5';
            case 'MEDIUM': return 'bg-gradient-to-r from-yellow-400 to-orange-400 h-1.5';
            default: return 'bg-gradient-to-r from-blue-400 to-indigo-400 h-1.5';
        }
    }

    getStatusClass(status: string): string {
        switch (status) {
            case 'ACTIVE': return 'bg-red-50 text-red-600 border-red-100';
            case 'ACKNOWLEDGED': return 'bg-blue-50 text-blue-600 border-blue-100';
            case 'RESOLVED': return 'bg-green-50 text-green-700 border-green-100';
            default: return 'bg-gray-50 text-gray-400 border-gray-100';
        }
    }

    getTypeIcon(type: string): string {
        switch (type) {
            case 'FIRE': return 'fa-fire';
            case 'MEDICAL': return 'fa-heartbeat';
            case 'SECURITY': return 'fa-shield-alt';
            case 'WEATHER': return 'fa-cloud-showers-heavy';
            default: return 'fa-exclamation-triangle';
        }
    }
}
