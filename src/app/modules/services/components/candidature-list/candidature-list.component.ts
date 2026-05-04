import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { CandidatureService } from '../../services/candidature.service';
import { Candidature } from '../../models/candidature.model';
import { ServiceService } from '../../services/service.service';
import { Service } from '../../models/service.model';
import { forkJoin } from 'rxjs';

@Component({
    selector: 'app-candidature-list',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './candidature-list.component.html',
    styleUrls: ['./candidature-list.component.css']
})
export class CandidatureListComponent implements OnInit {
    candidatures: Candidature[] = [];
    services: Service[] = [];
    loading = false;
    error: string | null = null;
    @Output() browseEvents = new EventEmitter<void>();

    constructor(
        private candidatureService: CandidatureService,
        private serviceService: ServiceService,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.loadData();
    }

    loadData(): void {
        this.loading = true;
        this.error = null;

        forkJoin({
            candidatures: this.candidatureService.getMyCandidatures(),
            services: this.serviceService.getAll()
        }).subscribe({
            next: (result) => {
                this.candidatures = result.candidatures;
                this.services = result.services;
                this.loading = false;
            },
            error: (err) => {
                console.error('Error loading candidatures', err);
                this.error = 'Failed to load your applications.';
                this.loading = false;
            }
        });
    }

    getServiceName(id?: number): string {
        if (!id) return 'Unknown Service';
        return this.services.find(s => s.id === id)?.name || 'Unknown Service';
    }

    getStatusClass(status?: string): string {
        if (!status) return 'bg-blue-50 text-blue-500 border-blue-100';
        switch (status) {
            case 'ACCEPTEE': return 'bg-success/10 text-success border-success/20';
            case 'REJETEE': return 'bg-red-50 text-red-500 border-red-100';
            case 'EN_ATTENTE': return 'bg-orange-50 text-orange-500 border-orange-100';
            case 'RETIREE': return 'bg-gray-50 text-gray-500 border-gray-100';
            default: return 'bg-blue-50 text-blue-500 border-blue-100';
        }
    }

    browseEventsAndServices(): void {
        if (this.browseEvents.observed) {
            this.browseEvents.emit();
        } else {
            this.router.navigate(['/events']);
        }
    }

    withdraw(id: number): void {
        if (confirm('Are you sure you want to withdraw this application?')) {
            this.candidatureService.withdraw(id).subscribe({
                next: () => this.loadData(),
                error: (err) => alert('Error withdrawing application.')
            });
        }
    }
}
