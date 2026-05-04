import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlerteService } from '../../services/alerte.service';
import { AlertWithInterventionStats, Alerte } from '../../models/alerte.model';

@Component({
    selector: 'app-alerte-stats',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './alerte-stats.component.html',
    styleUrls: ['./alerte-stats.component.css']
})
export class AlerteStatsComponent implements OnInit {
    // --- Stats JPQL JOIN ---
    statsLoading = false;
    statsError: string | null = null;
    interventionStats: AlertWithInterventionStats[] = [];

    // --- Recherche Keywords JOIN ---
    searchLoading = false;
    searchError: string | null = null;
    searchResults: Alerte[] = [];
    siteNameInput = '';
    statusInput = 'ACTIVE';

    readonly statusOptions = ['ACTIVE', 'ACKNOWLEDGED', 'RESOLVED', 'DISMISSED'];

    constructor(private alerteService: AlerteService) {}

    ngOnInit(): void {
        this.loadInterventionStats();
    }

    loadInterventionStats(): void {
        this.statsLoading = true;
        this.statsError = null;
        this.alerteService.getAlertsWithInterventionStats().subscribe({
            next: data => {
                this.interventionStats = data;
                this.statsLoading = false;
            },
            error: () => {
                this.statsError = 'Impossible de charger les statistiques des alertes.';
                this.statsLoading = false;
            }
        });
    }

    search(): void {
        if (!this.siteNameInput.trim()) return;
        this.searchLoading = true;
        this.searchError = null;
        this.searchResults = [];
        this.alerteService.searchBySiteNameAndStatus(this.siteNameInput.trim(), this.statusInput).subscribe({
            next: data => {
                this.searchResults = data;
                this.searchLoading = false;
            },
            error: () => {
                this.searchError = 'Erreur lors de la recherche.';
                this.searchLoading = false;
            }
        });
    }

    severityClass(severity: string): string {
        const map: Record<string, string> = {
            CRITICAL: 'badge-critical',
            HIGH: 'badge-high',
            MEDIUM: 'badge-medium',
            LOW: 'badge-low'
        };
        return map[severity] ?? '';
    }

    statusClass(status: string): string {
        const map: Record<string, string> = {
            ACTIVE: 'status-active',
            ACKNOWLEDGED: 'status-ack',
            RESOLVED: 'status-resolved',
            DISMISSED: 'status-dismissed'
        };
        return map[status] ?? '';
    }
}
