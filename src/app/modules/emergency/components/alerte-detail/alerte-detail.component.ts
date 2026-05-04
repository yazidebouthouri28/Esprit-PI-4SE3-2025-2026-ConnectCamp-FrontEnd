import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AlerteService } from '../../services/alerte.service';
import { Alerte, EmergencyMLResponse } from '../../models/alerte.model';
import { InterventionService } from '../../services/intervention.service';
import { Intervention } from '../../models/intervention.model';
import { ProtocoleService } from '../../services/protocole.service';
import { Protocole } from '../../models/protocole.model';
import { UserService } from '../../../../services/user.service';

declare var L: any;

@Component({
    selector: 'app-alerte-detail',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './alerte-detail.component.html',
    styleUrls: ['./alerte-detail.component.css']
})
export class AlerteDetailComponent implements OnInit {
    alert: Alerte | null = null;
    interventions: Intervention[] = [];
    protocole: Protocole | null = null;
    loading = false;
    isAdmin = false;
    map: any;

    // ML state
    mlResult: EmergencyMLResponse | null = null;
    mlLoading = false;
    mlError: string | null = null;
    mlTimer = 0;

    constructor(
        private route: ActivatedRoute,
        private alerteService: AlerteService,
        private interventionService: InterventionService,
        private protocoleService: ProtocoleService,
        private userService: UserService
    ) { }

    initMap(): void {
        if (!this.alert || !this.alert.latitude) return;
        if (this.map) return; // Prevent multiple inits

        const lat = this.alert.latitude;
        const lng = this.alert.longitude;

        this.map = L.map('detail-map').setView([lat, lng], 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap'
        }).addTo(this.map);
        L.marker([lat, lng]).addTo(this.map);
    }

    ngOnInit(): void {
        this.isAdmin = this.userService.isAdmin();
        const id = Number(this.route.snapshot.paramMap.get('id'));
        if (id) {
            this.loadAllData(id);
        }
    }

    loadAllData(id: number): void {
        this.loading = true;
        this.alerteService.getById(id).subscribe({
            next: (alert) => {
                this.alert = alert;
                this.loadInterventions(id);
                this.loadProtocole(alert.emergencyType);
                this.loading = false;
                if (this.alert.latitude) {
                    setTimeout(() => this.initMap(), 100);
                }
            },
            error: (err) => {
                console.error('Error loading alert details', err);
                this.loading = false;
            }
        });
    }

    loadInterventions(id: number): void {
        this.interventionService.getByAlerte(id).subscribe({
            next: (data) => this.interventions = data
        });
    }

    loadProtocole(type: string): void {
        this.protocoleService.getAll().subscribe({
            next: (all) => {
                this.protocole = all.find(p => p.type === type as any) || null;
            }
        });
    }

    runMLPrediction(): void {
        if (!this.alert) return;
        this.mlLoading = true;
        this.mlResult = null;
        this.mlError = null;
        this.mlTimer = 3;

        // Countdown simulation
        const interval = setInterval(() => {
            if (this.mlTimer > 0) this.mlTimer--;
            else clearInterval(interval);
        }, 1000);

        // Actual API call with delay
        setTimeout(() => {
            this.alerteService.predictForAlert(this.alert!.id).subscribe({
                next: (result) => {
                    this.mlResult = result;
                    this.mlLoading = false;
                    clearInterval(interval);
                },
                error: () => {
                    this.mlError = 'ML server unavailable. Make sure the Python server is running on port 5001.';
                    this.mlLoading = false;
                    clearInterval(interval);
                }
            });
        }, 3000);
    }

    mlSeverityColor(severity: string): string {
        const map: Record<string, string> = {
            CRITICAL: 'text-red-400', HIGH: 'text-orange-400',
            MEDIUM: 'text-yellow-400', LOW: 'text-green-400'
        };
        return map[severity] ?? 'text-gray-400';
    }

    resolveAlert(): void {
        if (this.alert && confirm('Mark this emergency as RESOLVED?')) {
            const notes = prompt('Enter resolution notes:');
            if (notes !== null) {
                this.alerteService.resolve(this.alert.id, notes).subscribe({
                    next: () => this.loadAllData(this.alert!.id),
                    error: (err) => console.error('Error resolving alert', err)
                });
            }
        }
    }
}
