import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GamificationService, Gamification } from '../../services/gamification.service';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-gamification-management',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './gamification-management.component.html',
    styleUrls: ['./gamification-management.component.css']
})
export class GamificationManagementComponent implements OnInit {
    private gamificationService = inject(GamificationService);
    private authService = inject(AuthService);

    badges: Gamification[] = [];
    medals: any[] = [];
    selectedMedalName: string | null = null;
    loading = false;
    loadingRules = false;
    showModal = false;
    showRulesModal = false;
    isEditing = false;
    modalErrorMessage = '';
    selectedBadgeRules: any[] = [];
    selectedBadgeName = '';
    earnedBadgeIds: Set<number> = new Set();

    private readonly MEDAL_MAPPING: { [key: string]: { label: string, icon: string } } = {
        'Médaille de l\'Aigle de Carthage': { label: 'All Medals', icon: '🏅' },
        'Community Leadership Medal': { label: 'Community Leadership Badges', icon: '🤝' },
        'Science and Arts': { label: 'Science and Arts Badges', icon: '🧪' },
        'Scout Leadership Medal': { label: 'Scout Leadership Badges', icon: '⚜️' },
        'Rank': { label: 'Rank', icon: '🎖️' }
    };

    currentBadge: Gamification = {
        name: '',
        icon: ''
    };

    get isAdmin(): boolean {
        return this.authService.isAdmin();
    }

    get filteredBadges(): Gamification[] {
        if (!this.selectedMedalName) {
            return this.badges;
        }
        return this.badges.filter(b => b.medal?.name?.includes(this.selectedMedalName!));
    }

    ngOnInit() {
        this.loadBadges();
        this.loadMedals();
        this.loadUserBadges();
    }

    loadBadges() {
        this.loading = true;
        this.gamificationService.getAll().subscribe({
            next: (data) => {
                this.badges = data;
                this.loading = false;
            },
            error: (err) => {
                console.error('Failed to load badges', err);
                this.loading = false;
            }
        });
    }

    loadUserBadges() {
        const user = this.authService.getCurrentUser();
        if (!user || !user.id) return;

        // Convert user.id to number if it's a string (depends on User interface)
        const userId = typeof user.id === 'string' ? parseInt(user.id) : user.id;

        this.gamificationService.getUserBadges(userId).subscribe({
            next: (userBadges) => {
                this.earnedBadgeIds = new Set(userBadges.map(ub => ub.badge.id!));
            },
            error: (err) => console.error('Failed to load user badges', err)
        });
    }

    isEarned(badgeId?: number): boolean {
        return !!badgeId && this.earnedBadgeIds.has(badgeId);
    }

    loadMedals() {
        this.gamificationService.getMedals().subscribe({
            next: (data) => {
                const grouped = new Map<string, any>();

                data.forEach(m => {
                    const matchKey = Object.keys(this.MEDAL_MAPPING).find(key => m.name.includes(key));
                    if (matchKey && !grouped.has(matchKey)) {
                        grouped.set(matchKey, {
                            ...m,
                            name: this.MEDAL_MAPPING[matchKey].label,
                            icon: this.MEDAL_MAPPING[matchKey].icon
                        });
                    }
                });

                // Add Rank if not present (in case it's not in backend yet)
                if (!grouped.has('Rank')) {
                    grouped.set('Rank', { name: 'Rank', icon: '🎖️' });
                }

                this.medals = Array.from(grouped.values());
            },
            error: (err) => console.error('Failed to load medals', err)
        });
    }

    selectMedal(name: string | null) {
        this.selectedMedalName = name;
    }

    getBadgeCount(name: string | null): number {
        if (!name) {
            return this.badges.length;
        }
        return this.badges.filter(b => b.medal?.name?.includes(name)).length;
    }

    openModal(badge?: Gamification) {
        if (badge) {
            this.currentBadge = { ...badge };
            this.isEditing = true;
        } else {
            this.currentBadge = {
                name: '',
                icon: ''
            };
            this.isEditing = false;
        }
        this.showModal = true;
    }

    closeModal() {
        this.showModal = false;
    }

    saveBadge() {
        this.modalErrorMessage = '';

        if (!this.currentBadge.name || this.currentBadge.name.length < 2) {
            this.modalErrorMessage = 'Le nom doit contenir au moins 2 caractères.';
            return;
        }


        if (!this.currentBadge.icon) {
            this.modalErrorMessage = 'L\'icône est obligatoire.';
            return;
        }


        if (this.isEditing && this.currentBadge.id) {
            this.gamificationService.update(this.currentBadge.id, this.currentBadge).subscribe({
                next: () => {
                    this.loadBadges();
                    this.closeModal();
                },
                error: (err) => alert('Update failed: ' + err.message)
            });
        } else {
            this.gamificationService.create(this.currentBadge).subscribe({
                next: () => {
                    this.loadBadges();
                    this.closeModal();
                },
                error: (err) => alert('Create failed: ' + err.message)
            });
        }
    }

    deleteBadge(id: number) {
        if (confirm('Are you sure you want to delete this badge?')) {
            this.gamificationService.delete(id).subscribe({
                next: () => this.loadBadges(),
                error: (err) => alert('Delete failed: ' + err.message)
            });
        }
    }

    showBadgeRules(badge: Gamification) {
        if (!badge.id) return;
        this.selectedBadgeName = badge.name;
        this.loadingRules = true;
        this.gamificationService.getRulesByBadgeId(badge.id).subscribe({
            next: (rules) => {
                this.selectedBadgeRules = rules;
                this.showRulesModal = true;
                this.loadingRules = false;
            },
            error: (err) => {
                console.error('Failed to load rules', err);
                this.loadingRules = false;
            }
        });
    }

    closeRulesModal() {
        this.showRulesModal = false;
        this.selectedBadgeRules = [];
        this.selectedBadgeName = '';
    }
}
