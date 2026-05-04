import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ServiceService } from '../../services/service.service';
import { Service } from '../../models/service.model';
import { UserService } from '../../../../services/user.service';
import { CartService } from '../../../../services/cart.service';
import { CartItem } from '../../../../models/api.models';
import { environment } from '../../../../../environments/environment';
import { EventService } from '../../../../services/event.service';
import { Event } from '../../../../models/event.model';
import { ServiceMLResponse } from '../../../../models/camping-service.model';
import { ReviewService } from '../../../../services/review.service';
import { AiService } from '../../../../services/ai.service';

interface ServiceWithML extends Service {
    mlResult?: ServiceMLResponse;
    mlLoading?: boolean;
}

@Component({
    selector: 'app-service-list',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './service-list.component.html',
    styleUrls: ['./service-list.component.css']
})
export class ServiceListComponent implements OnInit {
    services: ServiceWithML[] = [];
    loading = false;
    error: string | null = null;
    searchTerm = '';
    userEvents: Event[] = [];
    selectedEventId: number | null = null;
    
    // AI Reputation State
    reputationResults: Record<number, string> = {};
    reputationLoading: Record<number, boolean> = {};

    // Review Form State
    showReviewFormId: number | null = null;
    reviewData = {
        rating: 5,
        qualityRating: 5,
        valueRating: 5,
        pros: '',
        cons: '',
        comment: 'This service was great and very helpful for my stay.',
        title: 'Great service'
    };
    reviewLoading = false;

    @Input() adminViewMode: 'ALL' | 'USER' | 'ORGANIZER' = 'ALL';

    constructor(
        private serviceService: ServiceService,
        private userService: UserService,
        private router: Router,
        private cartService: CartService,
        private eventService: EventService,
        private reviewService: ReviewService,
        private aiService: AiService
    ) { }

    ngOnInit(): void {
        this.loadServices();
        if (this.isOrganizer()) {
            this.loadUserEvents();
        }
    }

    addToCart(service: Service): void {
        const image = (service.images && service.images.length > 0) ? service.images[0] : '';

        this.cartService.addItem({
            productId: service.id.toString(),
            productName: service.name,
            price: service.price,
            quantity: 1,
            image: image,
            type: 'PURCHASE'
        });
        alert(`✅ ${service.name} added to cart!`);
        this.router.navigate(['/cart']);
    }

    onBook(serviceId: number): void {
        const service = this.services.find(s => s.id === serviceId);
        if (service) {
            localStorage.setItem('campingExtra', JSON.stringify({
                id: service.id,
                name: service.name,
                price: service.price,
                type: 'SERVICE'
            }));
        }
        this.router.navigate(['/campsites'], {
            queryParams: {
                service: serviceId,
                autoOpen: 'reservation'
            },
            queryParamsHandling: 'merge'
        });
    }

    // Role Checks (Defined once)
    isAdmin(): boolean { return this.userService.isAdmin(); }
    isOrganizer(): boolean { return this.userService.isOrganizer(); }
    isParticipant(): boolean {
        const role = this.userService.getLoggedInUser()?.role;
        return role === 'PARTICIPANT' || role === 'CAMPER' || role === 'USER';
    }
    isUser(): boolean {
        const role = this.userService.getLoggedInUser()?.role;
        return role === 'USER' || role === 'CLIENT';
    }
    isCamper(): boolean {
        const role = this.userService.getLoggedInUser()?.role;
        return role === 'CAMPER';
    }

    // ── ML Prediction (camper only) ───────────────────────────────────────
    runMLPredict(service: ServiceWithML): void {
        if (!service.id) return;
        service.mlLoading = true;
        service.mlResult = undefined;
        this.serviceService.predictForService(service.id).subscribe({
            next: (result) => { service.mlResult = result; service.mlLoading = false; },
            error: () => {
                service.mlResult = { error: true, errorMessage: 'ML server unavailable' };
                service.mlLoading = false;
            }
        });
    }

    demandBadge(demand: string): string {
        const map: Record<string, string> = {
            HIGH:   'bg-emerald-100 text-emerald-700 border-emerald-200',
            MEDIUM: 'bg-amber-100 text-amber-700 border-amber-200',
            LOW:    'bg-red-100 text-red-600 border-red-200'
        };
        return map[demand] ?? 'bg-gray-100 text-gray-500 border-gray-200';
    }

    loadServices(): void {
        this.loading = true;
        this.error = null;
        this.serviceService.getAll().subscribe({
            next: (data) => {
                this.services = data.map(s => ({ ...s, mlResult: undefined, mlLoading: false }));
                this.loading = false;
            },
            error: (err) => {
                console.error('Error loading services', err);
                this.error = 'Failed to load services. Please try again later.';
                this.loading = false;
            }
        });
    }

    loadUserEvents(): void {
        const user = this.userService.getLoggedInUser();
        if (!user) return;

        const userOrgIdStr = (user as any).organizerId?.toString();

        this.eventService.getEvents().subscribe({
            next: (events) => {
                const eventsList = Array.isArray(events) ? events : [];

                this.userEvents = eventsList.filter((e: any) => {
                    const eOrgId = e.organizerId?.toString();
                    return userOrgIdStr && eOrgId === userOrgIdStr;
                });
                console.log('Found user events:', this.userEvents.length);
                
                if (this.userEvents.length > 0) {
                    this.selectedEventId = this.userEvents[0].id;
                } else {
                    this.selectedEventId = null;
                }
            },
            error: (err) => {
                console.error('Error loading events:', err);
                this.selectedEventId = null;
            }
        });
    }

    onEventChange(eventId: any): void {
        console.log('Event selection changed to:', eventId);
        this.selectedEventId = eventId;
    }

    onSelectForEvent(service: Service): void {
        console.log('--- DEBUG SERVICE SELECTION ---');
        console.log('Selected Event ID:', this.selectedEventId);
        console.log('Total Available User Events:', this.userEvents.length);
        
        if (this.selectedEventId === null || this.selectedEventId === undefined) {
            alert(`Please select an event from the dropdown at the top first!`);
            return;
        }

        const request = {
            name: service.name,
            description: service.description,
            serviceType: service.type ? service.type.toUpperCase() : 'OTHER',
            price: service.price,
            quantiteRequise: 1,
            eventId: this.selectedEventId,
            serviceId: service.id,
            included: false,
            optional: true
        };

        this.eventService.addRequestedService(this.selectedEventId, request as any).subscribe({
            next: () => {
                alert(`✅ ${service.name} has been linked to your event!`);
            },
            error: (err) => {
                console.error('Error linking service to event', err);
                alert('Failed to link service to event.');
            }
        });
    }

    deleteService(id: number): void {
        if (confirm('Are you sure you want to delete this service?')) {
            this.serviceService.delete(id).subscribe({
                next: () => {
                    this.loadServices();
                },
                error: (err) => {
                    console.error('Error deleting service', err);
                    alert('Error during deletion.');
                }
            });
        }
    }

    toggleServiceAvailability(service: Service): void {
        const action = service.isActive ? 'Deactivate' : 'Activate';
        if (confirm(`Are you sure you want to ${action.toLowerCase()} this service?`)) {
            const newStatus = !service.isActive;
            const updatedService = { ...service, isActive: newStatus, available: newStatus };
            this.serviceService.update(service.id, updatedService).subscribe({
                next: () => {
                    this.loadServices();
                },
                error: () => alert(`Failed to ${action.toLowerCase()} service.`)
            });
        }
    }

    get filteredServices(): ServiceWithML[] {
        const userRole = this.userService.getLoggedInUser()?.role;

        let roleFiltered: Service[];
        if (userRole === 'ADMIN') {
            if (this.adminViewMode === 'USER') {
                roleFiltered = this.services.filter(s => !s.targetRole || s.targetRole === 'USER');
            } else if (this.adminViewMode === 'ORGANIZER') {
                roleFiltered = this.services.filter(s => s.targetRole === 'ORGANIZER');
            } else {
                roleFiltered = this.services;
            }
        } else {
            let base = this.services.filter(s => s.isActive !== false);

            if (userRole === 'ORGANIZER') {
                roleFiltered = base.filter(s => s.isOrganizerService || s.targetRole === 'ORGANIZER');
            } else {
                roleFiltered = base.filter(s => (!s.targetRole || s.targetRole === 'USER') && !s.isOrganizerService);
            }
        }

        if (!this.searchTerm) return roleFiltered;
        const term = this.searchTerm.toLowerCase();
        return roleFiltered.filter(s =>
            s.name.toLowerCase().includes(term) ||
            s.type.toLowerCase().includes(term)
        );
    }

    onBookService(service: Service): void {
        this.onBook(service.id);
    }

    getImageUrl(imagePath: string | undefined): string {
        return this.cartService.getImageUrl(imagePath);
    }

    // ── Service Review Logic ──────────────────────────────────────────
    toggleReviewForm(serviceId: number): void {
        if (this.showReviewFormId === serviceId) {
            this.showReviewFormId = null;
        } else {
            this.showReviewFormId = serviceId;
            // Reset data
            this.reviewData = {
                rating: 5,
                qualityRating: 5,
                valueRating: 5,
                pros: '',
                cons: '',
                comment: 'This service was great and very helpful for my stay.',
                title: 'Excellent service'
            };
        }
    }

    submitReview(serviceId: number): void {
        const user = this.userService.getLoggedInUser();
        if (!user) {
            alert('Please login to leave a review.');
            return;
        }

        this.reviewLoading = true;
        const payload = {
            rating: this.reviewData.rating,
            qualityRating: this.reviewData.qualityRating,
            valueRating: this.reviewData.valueRating,
            title: this.reviewData.title,
            comment: this.reviewData.comment,
            pros: this.reviewData.pros.split(',').map(s => s.trim()).filter(s => s),
            cons: this.reviewData.cons.split(',').map(s => s.trim()).filter(s => s)
        };

        this.reviewService.createServiceReview(serviceId, user.id, payload).subscribe({
            next: () => {
                alert('✨ Review submitted! Your feedback helps our AI learn.');
                this.showReviewFormId = null;
                this.reviewLoading = false;
            },
            error: (err) => {
                console.error('Error submitting review', err);
                alert(err.error?.message || 'Failed to submit review.');
                this.reviewLoading = false;
            }
        });
    }

    generateReputation(serviceId: number): void {
        this.reputationLoading[serviceId] = true;
        this.reputationResults[serviceId] = '';
        this.aiService.analyzeReputation(serviceId).subscribe({
            next: (result) => {
                this.reputationResults[serviceId] = result;
                this.reputationLoading[serviceId] = false;
            },
            error: () => {
                this.reputationResults[serviceId] = 'AI analysis unavailable for this service.';
                this.reputationLoading[serviceId] = false;
            }
        });
    }

    closeReputation(serviceId: number): void {
        delete this.reputationResults[serviceId];
    }
}
