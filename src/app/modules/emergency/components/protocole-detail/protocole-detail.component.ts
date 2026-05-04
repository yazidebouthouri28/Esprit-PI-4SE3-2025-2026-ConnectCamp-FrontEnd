import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ProtocoleService } from '../../services/protocole.service';
import { Protocole } from '../../models/protocole.model';
import { UserService } from '../../../../services/user.service';

@Component({
    selector: 'app-protocole-detail',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './protocole-detail.component.html',
    styleUrls: ['./protocole-detail.component.css']
})
export class ProtocoleDetailComponent implements OnInit {
    protocole: Protocole | null = null;
    loading = false;
    isAdmin = false;

    constructor(
        private route: ActivatedRoute,
        private protocoleService: ProtocoleService,
        private userService: UserService
    ) { }

    ngOnInit(): void {
        this.isAdmin = this.userService.isAdmin();
        const id = Number(this.route.snapshot.paramMap.get('id'));
        if (id) {
            this.loadData(id);
        }
    }

    loadData(id: number): void {
        this.loading = true;
        this.protocoleService.getById(id).subscribe({
            next: (data) => {
                this.protocole = data;
                this.loading = false;
            },
            error: () => this.loading = false
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
