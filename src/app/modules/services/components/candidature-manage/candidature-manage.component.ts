import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CandidatureService } from '../../services/candidature.service';
import { Candidature } from '../../models/candidature.model';
import { ServiceService } from '../../services/service.service';
import { Service } from '../../models/service.model';
import { forkJoin } from 'rxjs';
import { UserService } from '../../../../services/user.service';
import { AiService } from '../../../../services/ai.service';

@Component({
    selector: 'app-candidature-manage',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './candidature-manage.component.html',
    styleUrls: ['./candidature-manage.component.css']
})
export class CandidatureManageComponent implements OnInit {
    @Input() eventId: number | null = null;
    candidatures: Candidature[] = [];
    services: Service[] = [];
    loading = false;
    fraudStatuses: Record<number, 'checking' | 'fraud' | 'safe'> = {};

    constructor(
        private candidatureService: CandidatureService,
        private serviceService: ServiceService,
        private userService: UserService,
        private aiService: AiService
    ) { }

    ngOnInit(): void {
        this.loadData();
    }

    isOrganizer(): boolean { return this.userService.isOrganizer(); }
    isAdmin(): boolean { return this.userService.isAdmin(); }

    loadData(): void {
        const user = this.userService.getLoggedInUser();
        if (!user || !user.id) return;

        this.loading = true;
        const candidatures$ = this.eventId 
            ? this.candidatureService.getByEvent(this.eventId)
            : (user.role === 'ORGANIZER' 
                ? this.candidatureService.getByOrganizer(Number(user.id))
                : this.candidatureService.getByUser(Number(user.id)));

        forkJoin({
            candidatures: candidatures$,
            services: this.serviceService.getAll()
        }).subscribe({
            next: (result) => {
                this.candidatures = result.candidatures;
                this.services = result.services;
                this.loading = false;
            },
            error: (err) => {
                console.error('Error loading management data', err);
                this.loading = false;
            }
        });
    }

    getServiceName(id: number): string {
        return this.services.find(s => s.id === id)?.name || 'Unknown';
    }

    accept(id: number): void {
        const user = this.userService.getLoggedInUser();
        if (!user || !user.id) return;

        this.candidatureService.updateStatus(id, Number(user.id), 'ACCEPTEE').subscribe({
            next: () => this.loadData()
        });
    }

    refuse(id: number): void {
        const user = this.userService.getLoggedInUser();
        if (!user || !user.id) return;

        this.candidatureService.updateStatus(id, Number(user.id), 'REJETEE').subscribe({
            next: () => this.loadData()
        });
    }

    waitlist(id: number): void {
        const user = this.userService.getLoggedInUser();
        if (!user || !user.id) return;

        this.candidatureService.updateStatus(id, Number(user.id), 'EN_ATTENTE').subscribe({
            next: () => this.loadData()
        });
    }

    checkFraud(cand: any): void {
        if (!cand.id) return;
        this.fraudStatuses[cand.id] = 'checking';
        this.aiService.detectFraud(cand.candidatName || 'Unknown', cand.lettreMotivation || '').subscribe({
            next: (isFraud) => {
                this.fraudStatuses[cand.id!] = isFraud ? 'fraud' : 'safe';
            },
            error: () => delete this.fraudStatuses[cand.id!]
        });
    }
}
