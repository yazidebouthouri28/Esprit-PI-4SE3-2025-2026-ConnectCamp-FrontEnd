import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EventService } from '../../../../services/event.service';
import { CandidatureService } from '../../services/candidature.service';
import { UserService } from '../../../../services/user.service';
import { EventServiceEntity } from '../../../../models/event-service-entity.model';

@Component({
    selector: 'app-event-apply',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './event-apply.component.html',
    styleUrls: ['./event-apply.component.css']
})
export class EventApplyComponent implements OnInit {
    eventId = 0;
    workRoles: EventServiceEntity[] = [];
    loading = false;
    error = '';

    // Apply form state
    applyingTo: EventServiceEntity | null = null;
    form = {
        lettreMotivation: '',
        experiencePertinente: '',
        competencesRaw: ''
    };
    submitting = false;
    successMsg = '';
    errorMsg = '';

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private eventService: EventService,
        private candidatureService: CandidatureService,
        private userService: UserService
    ) {}

    ngOnInit(): void {
        this.route.params.subscribe(params => {
            this.eventId = Number(params['eventId']);
            if (this.eventId) this.loadWorkRoles();
        });
    }

    loadWorkRoles(): void {
        this.loading = true;
        this.error = '';
        this.eventService.getEventWorkRoles(this.eventId).subscribe({
            next: (roles) => {
                this.workRoles = Array.isArray(roles) ? roles : [];
                this.loading = false;
            },
            error: () => {
                this.error = 'Could not load work roles for this event.';
                this.loading = false;
            }
        });
    }

    get spotsLeft(): (role: EventServiceEntity) => number {
        return (role) => Math.max(0, (role.quantiteRequise || 0) - (role.quantiteAcceptee || 0));
    }

    openApplyForm(role: EventServiceEntity): void {
        this.applyingTo = role;
        this.form = { lettreMotivation: '', experiencePertinente: '', competencesRaw: '' };
        this.successMsg = '';
        this.errorMsg = '';
    }

    closeForm(): void {
        this.applyingTo = null;
    }

    submitApplication(): void {
        if (!this.applyingTo) return;
        const user = this.userService.getLoggedInUser();
        if (!user || !user.id) {
            this.errorMsg = 'You must be logged in to apply.';
            return;
        }
        if (!this.form.lettreMotivation.trim()) {
            this.errorMsg = 'Motivation letter is required.';
            return;
        }

        this.submitting = true;
        this.errorMsg = '';
        const payload = {
            lettreMotivation: this.form.lettreMotivation.trim(),
            experiencePertinente: this.form.experiencePertinente.trim(),
            competences: this.form.competencesRaw
                ? this.form.competencesRaw.split(',').map(s => s.trim()).filter(Boolean)
                : []
        };

        this.candidatureService.apply(this.applyingTo.id, Number(user.id), payload).subscribe({
            next: () => {
                this.successMsg = `Application submitted for "${this.applyingTo!.name}"! You can track it in My Applications.`;
                this.submitting = false;
                this.applyingTo = null;
                this.loadWorkRoles();
            },
            error: (err) => {
                this.errorMsg = err?.error?.message || err?.message || 'Failed to submit. You may have already applied.';
                this.submitting = false;
            }
        });
    }

    getTypeIcon(type: string): string {
        const icons: Record<string, string> = {
            'SECURITY': 'fa-shield-alt', 'MEDICAL': 'fa-ambulance', 'CATERING': 'fa-utensils',
            'TRANSPORT': 'fa-bus', 'ACCOMMODATION': 'fa-bed', 'ENTERTAINMENT': 'fa-music',
            'GUIDE': 'fa-map-signs', 'OTHER': 'fa-briefcase'
        };
        return icons[type] || 'fa-briefcase';
    }

    isLoggedIn(): boolean {
        return !!this.userService.getLoggedInUser();
    }

    isParticipant(): boolean {
        const role = this.userService.getLoggedInUser()?.role;
        return role === 'PARTICIPANT' || role === 'CAMPER';
    }
}
