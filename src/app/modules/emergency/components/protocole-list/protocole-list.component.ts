import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProtocoleService } from '../../services/protocole.service';
import { Protocole } from '../../models/protocole.model';
import { UserService } from '../../../../services/user.service';

@Component({
    selector: 'app-protocole-list',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './protocole-list.component.html',
    styleUrls: ['./protocole-list.component.css']
})
export class ProtocoleListComponent implements OnInit {
    protocoles: Protocole[] = [];
    loading = false;
    error: string | null = null;
    isAdmin = false;

    constructor(
        private protocoleService: ProtocoleService,
        private userService: UserService
    ) { }

    ngOnInit(): void {
        this.isAdmin = this.userService.isAdmin();
        this.loadProtocoles();
    }

    loadProtocoles(): void {
        this.loading = true;
        this.error = null;
        this.protocoleService.getAll().subscribe({
            next: (data) => {
                this.protocoles = data;
                this.loading = false;
            },
            error: (err) => {
                console.error('Error loading protocols', err);
                this.error = 'Failed to load safety protocols.';
                this.loading = false;
            }
        });
    }

    deleteProtocol(id: number | undefined): void {
        if (!id || !confirm('Are you sure you want to delete this protocol?')) return;

        this.protocoleService.delete(id).subscribe({
            next: () => {
                this.protocoles = this.protocoles.filter(p => p.id !== id);
            },
            error: (err) => {
                console.error('Error deleting protocol', err);
                alert('Failed to delete protocol.');
            }
        });
    }

    getTypeIcon(type: string | undefined): string {
        switch (type) {
            case 'FIRE': return 'fa-fire-extinguisher';
            case 'MEDICAL': return 'fa-heartbeat';
            case 'SECURITY': return 'fa-shield-alt';
            case 'WEATHER': return 'fa-cloud-meatball';
            case 'EVACUATION': return 'fa-running';
            case 'NATURAL_DISASTER': return 'fa-house-damage';
            default: return 'fa-shield-virus';
        }
    }
}
