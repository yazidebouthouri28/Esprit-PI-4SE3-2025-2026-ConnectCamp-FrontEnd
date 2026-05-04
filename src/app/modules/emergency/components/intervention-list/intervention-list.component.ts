import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { InterventionService } from '../../services/intervention.service';
import { Intervention } from '../../models/intervention.model';
import { AlerteService } from '../../services/alerte.service';
import { Alerte } from '../../models/alerte.model';

@Component({
    selector: 'app-intervention-list',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './intervention-list.component.html',
    styleUrls: ['./intervention-list.component.css']
})
export class InterventionListComponent implements OnInit {
    interventions: Intervention[] = [];
    alert: Alerte | null = null;
    loading = false;

    constructor(
        private route: ActivatedRoute,
        private interventionService: InterventionService,
        private alerteService: AlerteService
    ) { }

    ngOnInit(): void {
        const alertId = Number(this.route.snapshot.paramMap.get('alertId'));
        if (alertId) {
            this.loadData(alertId);
        }
    }

    loadData(alertId: number): void {
        this.loading = true;
        this.alerteService.getById(alertId).subscribe({
            next: (alert) => {
                this.alert = alert;
                this.interventionService.getByAlerte(alertId).subscribe({
                    next: (data) => {
                        this.interventions = data;
                        this.loading = false;
                    },
                    error: () => this.loading = false
                });
            },
            error: () => this.loading = false
        });
    }

    getStatusClass(status: string): string {
        switch (status) {
            case 'COMPLETED': return 'bg-success/10 text-success border-success/20';
            case 'ON_SITE': return 'bg-blue-50 text-blue-500 border-blue-100';
            default: return 'bg-orange-50 text-orange-500 border-orange-100';
        }
    }
}
