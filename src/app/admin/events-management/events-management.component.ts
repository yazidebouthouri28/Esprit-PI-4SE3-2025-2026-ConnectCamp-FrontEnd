import { Component, HostListener, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { SiteService } from '../../services/site.service';
import { environment } from '../../../environments/environment';
import { Site } from '../../models/camping.models';
import { ApiResponse } from '../../models/api.models';
import { GamificationService } from '../../services/gamification.service';
import { Badge } from '../../models/gamification.models';
import { extractPagedContent, isUnreachableApiRoute } from '../../utils/http-api-fallback';
import { GamificationManagementComponent } from '../gamification-management/gamification-management.component';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions, ChartType } from 'chart.js';
import { EventService, MLPredictionResponse } from '../../services/event.service';
import { NotificationService } from '../../services/notification.service';

interface EventRevenue {
    eventTitle: string;
    organizerName: string;
    totalRevenue: number;
    participantCount: number;
}

interface Participant {
    id: number;
    user: any;
    status: string;
}

interface AdminEvent {
    id: number;
    name: string;
    title: string;
    type: 'Workshop' | 'Trip' | 'Festival';
    location: string;
    date: string;
    participants: number;
    capacity: number;
    price: number;
    description: string;
    status: string;
    category: string;
    startDate: string;         // ADDED
    endDate: string;
    picture: string;
    isFree: boolean;
    eventType: string;
    createdAt: string;
    reviewCount: number;
    organizerId: number | null;
    organizerName: string;
    siteId: number | null;
    siteName: string;
    gamifications?: Badge[];
}

interface EventForm {
    title: string;             // CHANGED: from 'name' to 'title'
    description: string;
    eventType: string;
    category: string;
    startDate: string;         // ADDED
    endDate: string;
    location: string;
    maxParticipants: number | null;
    price: number | null;
    isFree: boolean;
    picture: string;
    status: string;
    organizerId: number | null;
    siteId: number | null;
    gamificationIds: number[];
}

@Component({
    selector: 'app-events-admin-management',
    standalone: true,
    imports: [CommonModule, FormsModule, GamificationManagementComponent, BaseChartDirective],
    templateUrl: './events-management.component.html',
    styleUrls: ['./events-management.component.css']
})
export class EventsAdminManagementComponent implements OnInit {

    private http = inject(HttpClient);
    private cdr = inject(ChangeDetectorRef);
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private authService = inject(AuthService);
    private siteService = inject(SiteService);
    private gamificationService = inject(GamificationService);
    private eventService = inject(EventService);
    private notifications = inject(NotificationService);

    private apiUrl = `${environment.apiUrl}/api/events`;
    private uploadUrl = `${environment.apiUrl}/api/files/upload`;
    private imageUrlBase = `${environment.apiUrl}/uploads/`;

    @HostListener('document:click')
    onDocumentClick() {
        this.activeActionMenu = null;
    }

    activeTab: 'events' | 'gamifications' = 'events';

    setActiveTab(tab: 'events' | 'gamifications') {
        this.activeTab = tab;
        // Keep URL in sync so refresh/deep links preserve the selected tab.
        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { tab },
            queryParamsHandling: 'merge',
            replaceUrl: true
        });
    }

    showAddForm = false;
    deleteMode = false;
    selectedEventIds = new Set<number>();
    imagePreview: string | null = null;
    selectedFileName = '';
    selectedFile: File | null = null;
    imagePreviews: string[] = [];
    selectedFiles: File[] = [];
    uploadedImages: string[] = [];
    imageError = '';
    activeActionMenu: number | null = null;
    editingEventId: number | null = null;
    otherEventType = '';
    otherCategory = '';
    myOrganizerId: number | null = null;
    availableBadges: Badge[] = [];
    eventAssociatedBadges: Badge[] = [];
    selectedBadgeIds = new Set<number>();
    selectedBadgeMedalFilter: 'ALL' | 'COMMUNITY' | 'SCIENCE' | 'SCOUT' = 'ALL';
    availableSites: Site[] = [];

    showPrediction = false;
    predictionLoading = false;
    predictedAttendees: number | null = null;
    predictedPopularity: string | null = null;
    suggestedBadge: string | null = null;
    private predictTimer: any = null;



    // Revenue Chart state
    showRevenueChart = false;
    revenueData: EventRevenue[] = [];

    private truncateLabel(label: string, max = 28): string {
        const clean = String(label ?? '').trim();
        if (clean.length <= max) return clean;
        return clean.slice(0, Math.max(0, max - 1)).trimEnd() + '…';
    }

    private buildEventLabel(row: EventRevenue): string {
        const title = String(row?.eventTitle ?? '').trim() || 'Untitled event';
        const organizer = String(row?.organizerName ?? '').trim() || 'Organizer';
        return `${title} (${organizer})`;
    }

    private pickCategoryColors(count: number): string[] {
        const palette = ['#2C4A3C', '#617152', '#8EA07F', '#B4C1A5', '#D6DED0', '#1a2e1a', '#4a6741', '#6B8E23', '#2F855A', '#4B5563'];
        const colors: string[] = [];
        for (let i = 0; i < count; i++) {
            colors.push(palette[i % palette.length]);
        }
        return colors;
    }

    public barChartOptions: ChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        scales: {
            x: {
                beginAtZero: true,
                grid: { color: 'rgba(0,0,0,0.06)' },
                ticks: {
                    precision: 0
                },
                title: { display: true, text: 'Revenue (DT)', color: '#6b7280', font: { weight: 'bold' } }
            },
            x2: {
                beginAtZero: true,
                position: 'top',
                grid: { drawOnChartArea: false },
                ticks: { precision: 0 },
                title: { display: true, text: 'Participants', color: '#6b7280', font: { weight: 'bold' } }
            },
            y: {
                grid: { display: false },
                ticks: {
                    autoSkip: false,
                    callback: (value: any) => {
                        const idx = Number(value);
                        const labels = (this.barChartData?.labels as any[]) || [];
                        const label = Number.isFinite(idx) ? labels[idx] : value;
                        return this.truncateLabel(String(label ?? ''), 22);
                    }
                }
            }
        },
        plugins: {
            legend: { display: true, position: 'bottom' },
            tooltip: {
                callbacks: {
                    title: (items: any[]) => {
                        const raw = items?.[0]?.label;
                        return raw ? String(raw) : '';
                    },
                    label: (ctx: any) => {
                        const datasetLabel = String(ctx?.dataset?.label ?? '');
                        const value = Number(ctx?.parsed?.x ?? ctx?.parsed ?? 0);
                        if (datasetLabel.toLowerCase().includes('revenue')) {
                            return `${datasetLabel}: ${value} DT`;
                        }
                        return `${datasetLabel}: ${value}`;
                    }
                }
            }
        }
    };
    public barChartType: ChartType = 'bar';
    public barChartData: ChartConfiguration<'bar'>['data'] = {
        labels: [],
        datasets: [
            {
                data: [],
                label: 'Revenue (DT)',
                xAxisID: 'x',
                backgroundColor: 'rgba(44, 74, 60, 0.85)',
                borderColor: '#2C4A3C',
                borderWidth: 0,
                borderRadius: 6,
                barThickness: 14
            },
            {
                data: [],
                label: 'Participants',
                xAxisID: 'x2',
                backgroundColor: 'rgba(97, 113, 82, 0.75)',
                borderColor: '#617152',
                borderWidth: 0,
                borderRadius: 6,
                barThickness: 14
            }
        ]
    };

    // New Category Chart
    public doughnutChartOptions: ChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: true, position: 'right', align: 'center' },
            tooltip: {
                callbacks: {
                    label: (ctx: any) => {
                        const label = ctx?.label ? String(ctx.label) : 'Category';
                        const val = Number(ctx?.parsed ?? 0);
                        return `${label}: ${val}`;
                    }
                }
            }
        }
    };
    public doughnutChartType: ChartType = 'doughnut';
    public doughnutChartData: ChartConfiguration<'doughnut'>['data'] = {
        labels: [],
        datasets: [{
            data: [],
            backgroundColor: this.pickCategoryColors(0),
            borderWidth: 0,
            hoverOffset: 6
        }]
    };

    // Participant state
    showParticipantsModal = false;
    currentParticipantsEvent: AdminEvent | null = null;
    participants: Participant[] = [];
    selectedParticipantIds = new Set<number>();
    awardBadgeModalOpen = false;
    badgeToAwardId: number | null = null;

    private readonly ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
    private readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

    newEvent: EventForm = {
        title: '',               // CHANGED
        description: '',
        eventType: '',
        category: '',
        startDate: '',          // ADDED
        endDate: '',
        location: '',
        maxParticipants: null,
        price: null,
        isFree: false,
        picture: '',
        status: 'PUBLISHED',
        organizerId: null,
        siteId: null,
        gamificationIds: []
    };

    events: AdminEvent[] = [];
    loading = true;
    errorMessage = '';
    modalErrorMessage = '';
    totalViews = 0;
    searchTerm = '';
    statusFilter = 'All Status';

    eventTypes = ['WORKSHOP', 'CONFERENCE', 'FESTIVAL', 'OUTDOOR_ACTIVITY', 'CAMPING', 'HIKING', 'CONCERT', 'EXHIBITION', 'SPORTS', 'SOCIAL', 'Other'];
    categories = ['Nature', 'Adventure', 'Music', 'Sport', 'Education', 'Culture', 'Technology', 'Other'];

    openAddForm() {
        this.resetForm();
        this.setOrganizerId();
        this.newEvent.price = this.getAvgPrice();

        // Set a default start date (tomorrow at 10:00) and end date (tomorrow at 11:00)
        const start = new Date();
        start.setDate(start.getDate() + 1);
        start.setHours(10, 0, 0, 0);

        const end = new Date(start);
        end.setHours(11, 0, 0, 0);

        this.newEvent.startDate = start.toISOString().slice(0, 16);
        this.newEvent.endDate = end.toISOString().slice(0, 16);

        this.showAddForm = true;
    }

    ngOnInit() {
        this.loadSites();
        this.loadEvents();
        this.loadBadges();

        // Handle direct navigation for Add/Edit

        // Handle direct navigation for Add/Edit
        this.route.queryParams.subscribe(params => {
            const tab = String(params['tab'] ?? '').toLowerCase();
            if (tab === 'gamifications' || tab === 'gamification') {
                this.activeTab = 'gamifications';
            } else if (tab === 'events') {
                this.activeTab = 'events';
            } else {
                const defaultTab = String(this.route.snapshot.data?.['defaultTab'] ?? '').toLowerCase();
                if (defaultTab === 'gamifications' || defaultTab === 'gamification') {
                    this.activeTab = 'gamifications';
                }
            }

            const action = params['action'];
            const id = params['id'];

            if (action === 'add') {
                setTimeout(() => this.openAddForm(), 500);
            } else if (action === 'edit' && id) {
                const checkInterval = setInterval(() => {
                    if (!this.loading) {
                        const eventToEdit = this.events.find(e => e.id === Number(id));
                        if (eventToEdit) {
                            this.editEvent(eventToEdit);
                        }
                        clearInterval(checkInterval);
                    }
                }, 100);
                setTimeout(() => clearInterval(checkInterval), 3000);
            } else if (action === 'award-badges' && id) {
                const checkInterval = setInterval(() => {
                    if (!this.loading) {
                        const event = this.events.find(e => e.id === Number(id));
                        if (event) {
                            this.openParticipantsModal(event);
                        }
                        clearInterval(checkInterval);
                    }
                }, 100);
                setTimeout(() => clearInterval(checkInterval), 3000);
            }
        });
    }

    onPredictionInputChange() {
        if (this.predictTimer) {
            clearTimeout(this.predictTimer);
        }

        this.predictTimer = setTimeout(() => this.predictNow(), 350);
    }

    private predictNow() {
        const category = (this.newEvent.category === 'Other' ? this.otherCategory : this.newEvent.category) || '';
        const eventType = (this.newEvent.eventType === 'Other' ? this.otherEventType : this.newEvent.eventType) || '';
        const start = this.parseLocalDateTime(this.newEvent.startDate);
        const end = this.parseLocalDateTime(this.newEvent.endDate);

        if (!category || !eventType || !start) {
            this.showPrediction = false;
            return;
        }

        const durationHours = (end && start && end.getTime() > start.getTime())
            ? Math.max(1, Math.round((end.getTime() - start.getTime()) / 3600000))
            : 2;

        const state = (this.newEvent.location || '').trim() || 'Tunis';
        const price = this.newEvent.isFree ? 0 : (this.newEvent.price != null ? Number(this.newEvent.price) : 0);

        const request = {
            category,
            event_type: eventType,
            state,
            hour: start.getHours(),
            month: start.getMonth() + 1,
            day_of_week: this.toMondayFirstDayOfWeek(start.getDay()),
            duration_hours: durationHours,
            price
        };

        this.predictionLoading = true;
        this.eventService.predictEvent(request).subscribe({
            next: (prediction: MLPredictionResponse) => {
                this.showPrediction = true;
                const rawPred = Number(prediction.predicted_attendees ?? 0);
                const max = Number(this.newEvent.maxParticipants ?? 0);
                this.predictedAttendees = (max > 0) ? Math.min(rawPred, max) : rawPred;
                this.predictedPopularity = String(prediction.popularity ?? '');
                this.suggestedBadge = String(prediction.badge_suggestion ?? '');
                this.predictionLoading = false;
                this.cdr.detectChanges();
            },
            error: () => {
                this.predictionLoading = false;
                this.showPrediction = false;
                this.cdr.detectChanges();
            }
        });
    }

    private parseLocalDateTime(value: string | null | undefined): Date | null {
        const raw = String(value ?? '').trim();
        if (!raw) return null;
        const d = new Date(raw);
        return Number.isNaN(d.getTime()) ? null : d;
    }

    private toMondayFirstDayOfWeek(jsDay: number): number {
        // JS: 0=Sunday..6=Saturday -> ML: 0=Monday..6=Sunday
        return (jsDay + 6) % 7;
    }




    private loadSites() {
        this.siteService.getAllSites().subscribe({
            next: (sites) => {
                this.availableSites = sites || [];
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Failed to load sites:', err);
            }
        });
    }

    private loadBadges() {
        this.gamificationService.getBadges().subscribe({
            next: (badges: Badge[]) => {
                this.availableBadges = badges;
                this.cdr.detectChanges();
            },
            error: (err: any) => console.error('Error loading badges:', err)
        });
    }

    toggleBadgeSelection(badgeId: number) {
        if (this.selectedBadgeIds.has(badgeId)) {
            this.selectedBadgeIds.delete(badgeId);
        } else {
            this.selectedBadgeIds.add(badgeId);
        }
        this.newEvent.gamificationIds = Array.from(this.selectedBadgeIds);
        this.cdr.detectChanges();
    }

    get filteredAvailableBadges(): Badge[] {
        if (this.selectedBadgeMedalFilter === 'ALL') {
            return this.availableBadges;
        }
        return this.availableBadges.filter((badge) => {
            const medal = (badge.medalName || '').toLowerCase();
            if (this.selectedBadgeMedalFilter === 'COMMUNITY') return medal.includes('community leadership');
            if (this.selectedBadgeMedalFilter === 'SCIENCE') return medal.includes('science and arts');
            if (this.selectedBadgeMedalFilter === 'SCOUT') return medal.includes('scout leadership');
            return true;
        });
    }

    setBadgeMedalFilter(filter: 'ALL' | 'COMMUNITY' | 'SCIENCE' | 'SCOUT'): void {
        this.selectedBadgeMedalFilter = filter;
    }

    openRevenueChart() {
        this.loading = true;
        this.http.get<ApiResponse<EventRevenue[]>>(`${this.apiUrl}/stats/revenue`).subscribe({
            next: (res) => {
                this.revenueData = res.data || [];

                const labels = this.revenueData.map((d) => this.buildEventLabel(d));
                const revenues = this.revenueData.map((d) => Number(d.totalRevenue ?? 0));
                const participants = this.revenueData.map((d) => Number(d.participantCount ?? 0));

                // Replace object references so ng2-charts reliably re-renders both charts.
                this.barChartData = {
                    labels,
                    datasets: [
                        { ...this.barChartData.datasets[0], data: revenues },
                        { ...this.barChartData.datasets[1], data: participants }
                    ]
                };

                // Prepare category distribution (from loaded events list).
                const catMap = new Map<string, number>();
                (this.events || []).forEach((e) => {
                    const raw = (e?.category || '').toString().trim();
                    const key = raw.length ? raw : 'Uncategorized';
                    catMap.set(key, (catMap.get(key) || 0) + 1);
                });
                const catLabels = Array.from(catMap.keys());
                const catCounts = Array.from(catMap.values());

                this.doughnutChartData = {
                    labels: catLabels,
                    datasets: [{
                        data: catCounts,
                        backgroundColor: this.pickCategoryColors(catLabels.length),
                        borderWidth: 0,
                        hoverOffset: 6
                    }]
                };

                this.showRevenueChart = true;
                this.loading = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                if (err?.status === 404 || err?.status === 403 || isUnreachableApiRoute(err)) {
                    // Legacy backend fallback: compute an estimated chart from loaded events.
                    this.revenueData = this.events.map((e) => ({
                        eventTitle: e.name || e.title || `Event #${e.id}`,
                        organizerName: e.organizerName || 'Organizer',
                        totalRevenue: (e.price || 0) * (e.participants || 0),
                        participantCount: e.participants || 0
                    }));

                    const labels = this.revenueData.map((d) => this.buildEventLabel(d));
                    const revenues = this.revenueData.map((d) => Number(d.totalRevenue ?? 0));
                    const participants = this.revenueData.map((d) => Number(d.participantCount ?? 0));
                    this.barChartData = {
                        labels,
                        datasets: [
                            { ...this.barChartData.datasets[0], data: revenues },
                            { ...this.barChartData.datasets[1], data: participants }
                        ]
                    };

                    const catMap = new Map<string, number>();
                    (this.events || []).forEach((e) => {
                        const raw = (e?.category || '').toString().trim();
                        const key = raw.length ? raw : 'Uncategorized';
                        catMap.set(key, (catMap.get(key) || 0) + 1);
                    });
                    const catLabels = Array.from(catMap.keys());
                    const catCounts = Array.from(catMap.values());
                    this.doughnutChartData = {
                        labels: catLabels,
                        datasets: [{
                            data: catCounts,
                            backgroundColor: this.pickCategoryColors(catLabels.length),
                            borderWidth: 0,
                            hoverOffset: 6
                        }]
                    };
                    this.showRevenueChart = true;
                    this.loading = false;
                    this.errorMessage = '';
                    this.cdr.detectChanges();
                    return;
                }
                console.error('Failed to load revenue data:', err);
                this.loading = false;
                this.errorMessage = 'Failed to load revenue data.';
                this.cdr.detectChanges();
            }
        });
    }

    closeRevenueChart() {
        this.showRevenueChart = false;
    }

    openParticipantsModal(event: AdminEvent) {
        this.currentParticipantsEvent = event;
        this.loading = true;
        this.http.get<ApiResponse<Participant[]>>(`${this.apiUrl}/${event.id}/participants`).subscribe({
            next: (res) => {
                this.participants = res.data || [];
                this.eventAssociatedBadges = event.gamifications || [];
                this.showParticipantsModal = true;
                this.loading = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                if (isUnreachableApiRoute(err)) {
                    this.http.get<any>(`${environment.apiUrl}/api/participants/event/${event.id}?page=0&size=500`).subscribe({
                        next: (legacyRes) => {
                            const rows = extractPagedContent(legacyRes);
                            this.participants = rows.map((p: any) => ({
                                id: Number(p.id ?? 0),
                                status: String(p.status ?? 'UNKNOWN'),
                                user: {
                                    id: Number(p.userId ?? p.user?.id ?? 0),
                                    username: p.userName || p.name || p.user?.username || 'Unknown User',
                                    email: p.email || p.user?.email || ''
                                }
                            }));
                            this.eventAssociatedBadges = event.gamifications || [];
                            this.showParticipantsModal = true;
                            this.loading = false;
                            this.errorMessage = '';
                            this.cdr.detectChanges();
                        },
                        error: (legacyErr) => {
                            console.error('Failed to load participants (legacy fallback):', legacyErr);
                            this.loading = false;
                            this.errorMessage = 'Failed to load participants.';
                            this.cdr.detectChanges();
                        }
                    });
                    return;
                }
                console.error('Failed to load participants:', err);
                this.loading = false;
                this.errorMessage = 'Failed to load participants.';
                this.cdr.detectChanges();
            }
        });
    }

    closeParticipantsModal() {
        this.showParticipantsModal = false;
        this.currentParticipantsEvent = null;
        this.selectedParticipantIds.clear();
    }

    toggleParticipantSelection(id: number) {
        if (this.selectedParticipantIds.has(id)) {
            this.selectedParticipantIds.delete(id);
        } else {
            this.selectedParticipantIds.add(id);
        }
    }

    awardBadges() {
        if (this.selectedParticipantIds.size === 0) return;
        if (!this.badgeToAwardId) {
            alert('Please select a badge to award.');
            return;
        }

        const participantIds = Array.from(this.selectedParticipantIds);
        const payload = {
            userIds: participantIds.map(pid => this.participants.find(p => p.id === pid)?.user?.id).filter(id => !!id),
            badgeId: this.badgeToAwardId,
            eventId: this.currentParticipantsEvent?.id
        };

        this.loading = true;
        this.gamificationService.awardBulkBadges(payload.userIds as number[], Number(payload.badgeId), Number(payload.eventId)).subscribe({
            next: () => {
                alert('Badges awarded successfully!');
                this.awardBadgeModalOpen = false;
                this.loading = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Failed to award badges:', err);
                alert('Failed to award badges.');
                this.loading = false;
                this.cdr.detectChanges();
            }
        });
    }

    private setOrganizerId() {
        const user = this.authService.getCurrentUser();
        if (user && user.organizerId !== undefined && user.organizerId !== null) {
            // user.organizerId is already a number; assign directly
            this.newEvent.organizerId = user.organizerId;
        } else {
            // fallback to null if no organizer ID
            this.newEvent.organizerId = null;
        }
    }

    loadEvents(keyword?: string) {
        this.loading = true;
        this.errorMessage = '';
        this.loadTotalViews();
        const url = keyword ? `${this.apiUrl}/search?keyword=${encodeURIComponent(keyword)}` : this.apiUrl;
        this.http.get<any>(url).subscribe({
            next: (response) => {
                const data = response.data?.content || response.data || response;
                this.events = (Array.isArray(data) ? data : [])
                    .map((e: any) => ({
                        id: e.id,
                        name: e.title || '',                    // CHANGED: backend returns title
                        title: (e.title || e.description || 'Untitled').substring(0, 30),
                        type: this.mapEventType(e.eventType),
                        location: e.location || '',
                        date: e.startDate ? new Date(e.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD', // CHANGED: use startDate
                        participants: e.currentParticipants || 0,
                        capacity: e.maxParticipants || 0,
                        price: e.price || 0,
                        description: e.description || '',
                        status: this.mapStatus(e.status),
                        category: e.category || '',
                        startDate: e.startDate ? e.startDate.replace('T', 'T').substring(0, 16) : '', // ADDED
                        endDate: e.endDate ? e.endDate.replace('T', 'T').substring(0, 16) : '',
                        picture: e.images?.[0] || e.picture || '',
                        isFree: e.isFree || false,
                        eventType: e.eventType || '',
                        createdAt: e.createdAt || '',
                        reviewCount: e.reviewCount || 0,
                        organizerId: e.organizerId || null,
                        organizerName: e.organizerName || '',
                        siteId: e.siteId || null,
                        siteName: e.siteName || '',
                        gamifications: e.gamifications || []
                    }));
                this.loading = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Failed to load events:', err);
                this.errorMessage = 'Failed to load events. Is the backend running?';
                this.loading = false;
                this.cdr.detectChanges();
            }
        });
    }


    onSearch() {
        this.loadEvents(this.searchTerm);
    }

    loadTotalViews() {
        this.http.get<ApiResponse<any>>(`${this.apiUrl}/stats/total-views`).subscribe({
            next: (res) => {
                this.totalViews = res.data?.totalViews || 0;
                this.cdr.detectChanges();
            },
            error: (err) => console.error('Failed to load total views:', err)
        });
    }

    get filteredEvents() {
        return this.events.filter(event => {
            const matchesStatus = this.statusFilter === 'All Status' ||
                event.status === this.statusFilter;
            return matchesStatus;
        });
    }

    private mapEventType(type: string): 'Workshop' | 'Trip' | 'Festival' {
        const map: Record<string, 'Workshop' | 'Trip' | 'Festival'> = {
            'WORKSHOP': 'Workshop', 'CONFERENCE': 'Workshop', 'FESTIVAL': 'Festival',
            'OUTDOOR_ACTIVITY': 'Trip', 'CAMPING': 'Trip', 'HIKING': 'Trip',
            'CONCERT': 'Festival', 'EXHIBITION': 'Festival', 'SPORTS': 'Trip',
            'SOCIAL': 'Festival', 'Other': 'Workshop'
        };
        return map[type] || 'Workshop';
    }

    private mapStatus(status: string): string {
        const s = (status || '').toUpperCase();
        if (s === 'PUBLISHED') return 'Published';
        if (s === 'COMPLETED') return 'Completed';
        return 'Draft';
    }

    getCategoryIcon(category: string): string {
        const icons: Record<string, string> = {
            'Nature': '🌿',
            'Adventure': '🏕️',
            'Music': '🎸',
            'Sport': '⚽',
            'Education': '📚',
            'Culture': '🎭',
            'Technology': '💻',
            'Other': '📌'
        };
        return icons[category] || '🎪';
    }

    getTotalParticipants(): number {
        return this.events.reduce((sum, e) => sum + (e.participants || 0), 0);
    }

    getAvgPrice(): number {
        if (this.events.length === 0) return 0;
        const total = this.events.reduce((sum, e) => sum + (e.price || 0), 0);
        return Math.round(total / this.events.length);
    }

    closeAddForm() {
        this.showAddForm = false;
        this.editingEventId = null;
        this.modalErrorMessage = '';
        this.removeImage();
        this.selectedBadgeIds.clear();
    }

    resetForm() {
        this.newEvent = {
            title: '',               // CHANGED
            description: '',
            eventType: '',
            category: '',
            startDate: '',          // ADDED
            endDate: '',
            location: '',
            maxParticipants: null,
            price: null,
            isFree: false,
            picture: '',
            status: 'PUBLISHED',
            organizerId: null,
            siteId: null,
            gamificationIds: []
        };
        this.editingEventId = null;
        this.otherEventType = '';
        this.otherCategory = '';
        this.selectedBadgeMedalFilter = 'ALL';
        this.selectedBadgeIds.clear();
        this.removeImage();
    }

    onFreeToggle() {
        if (this.newEvent.isFree) {
            this.newEvent.price = 0;
        } else if (this.newEvent.price === 0) {
            this.newEvent.price = this.getAvgPrice();
        }
    }

    onPriceChange() {
        if (this.newEvent.price === 0) {
            this.newEvent.isFree = true;
        } else if (this.newEvent.price && this.newEvent.price > 0) {
            this.newEvent.isFree = false;
        }
    }

    onFileSelected(event: Event) {
        const input = event.target as HTMLInputElement;
        this.imageError = '';
        if (input.files && input.files.length) {
            const files = Array.from(input.files);
            for (const file of files) {
                if (!this.ALLOWED_TYPES.includes(file.type)) {
                    this.imageError = `Invalid file type "${file.type || 'unknown'}". Only JPG, PNG, and WebP are allowed.`;
                    input.value = '';
                    return;
                }

                if (file.size > this.MAX_FILE_SIZE) {
                    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
                    this.imageError = `File is too large (${sizeMB}MB). Maximum allowed size is 5MB.`;
                    input.value = '';
                    return;
                }

                this.selectedFiles.push(file);
                this.imagePreviews.push(URL.createObjectURL(file));
            }
            this.selectedFile = this.selectedFiles[0] || null;
            this.selectedFileName = this.selectedFiles.map((f) => f.name).join(', ');
            this.imagePreview = this.imagePreviews[0] || null;
            this.newEvent.picture = this.selectedFiles[0]?.name || '';
            input.value = '';
        }
    }

    removeImage() {
        if (this.imagePreview) {
            URL.revokeObjectURL(this.imagePreview);
        }
        this.imagePreview = null;
        this.selectedFileName = '';
        this.selectedFile = null;
        this.imagePreviews.forEach((preview) => {
            if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview);
        });
        this.imagePreviews = [];
        this.selectedFiles = [];
        this.uploadedImages = [];
        this.newEvent.picture = '';
        this.imageError = '';
    }

    removeImageAtIndex(index: number) {
        if (this.imagePreviews[index]?.startsWith('blob:')) {
            URL.revokeObjectURL(this.imagePreviews[index]);
        }
        // Determine if this index refers to an existing server image or a new file
        const existingCount = this.uploadedImages.length;
        if (index < existingCount) {
            // Remove from existing server images
            this.uploadedImages.splice(index, 1);
        } else {
            // Remove from newly selected files
            this.selectedFiles.splice(index - existingCount, 1);
        }
        this.imagePreviews.splice(index, 1);
        if (this.imagePreviews.length === 0) {
            this.imagePreview = null;
        } else {
            this.imagePreview = this.imagePreviews[0];
        }
        this.cdr.detectChanges();
    }

    submitEvent() {
        console.log('submitEvent called');
        this.modalErrorMessage = '';

        let finalEventType = this.newEvent.eventType;
        if (finalEventType === 'Other') {
            finalEventType = this.otherEventType.trim() || 'Other';
        }

        let finalCategory = this.newEvent.category;
        if (finalCategory === 'Other') {
            finalCategory = this.otherCategory.trim() || 'Other';
        }

        if (this.editingEventId === null && !this.newEvent.picture && !this.imagePreview) {
            this.modalErrorMessage = 'L\'image de l\'événement est obligatoire.';
            return;
        }

        if (!this.newEvent.title || this.newEvent.title.length < 3) {
            this.modalErrorMessage = 'Le titre doit contenir au moins 3 caractères.';
            return;
        }

        if (this.newEvent.startDate && this.newEvent.endDate) {
            if (new Date(this.newEvent.startDate) >= new Date(this.newEvent.endDate)) {
                this.modalErrorMessage = 'La date de début doit être antérieure à la date de fin.';
                return;
            }
        }

        if (this.newEvent.maxParticipants !== null && this.newEvent.maxParticipants <= 0) {
            this.modalErrorMessage = 'Le nombre de participants doit être supérieur à 0.';
            return;
        }

        if (!this.newEvent.isFree && (this.newEvent.price === null || this.newEvent.price < 0)) {
            this.modalErrorMessage = 'Le prix ne peut pas être négatif.';
            return;
        }

        this.loading = true;

        if (this.selectedFiles.length > 0) {
            this.uploadFilesBeforeSubmit(0, [], finalEventType, finalCategory);
        } else {
            this.proceedWithSubmit(finalEventType, finalCategory);
        }
    }

    private uploadFilesBeforeSubmit(index: number, uploaded: string[], finalEventType: string, finalCategory: string): void {
        if (index >= this.selectedFiles.length) {
            // Merge: keep existing server images + add newly uploaded ones
            this.uploadedImages = [...this.uploadedImages, ...uploaded];
            this.proceedWithSubmit(finalEventType, finalCategory);
            return;
        }
        const formData = new FormData();
        formData.append('file', this.selectedFiles[index]);
        this.http.post<any>(this.uploadUrl, formData).subscribe({
            next: (res) => {
                if (res?.data?.fileName) {
                    uploaded.push(res.data.fileName);
                }
                this.uploadFilesBeforeSubmit(index + 1, uploaded, finalEventType, finalCategory);
            },
            error: (err) => {
                console.error('Upload failed:', err);
                this.modalErrorMessage = 'Échec du chargement des images.';
                this.loading = false;
                this.cdr.detectChanges();
            }
        });
    }

    private proceedWithSubmit(finalEventType: string, finalCategory: string) {
        // Validate required fields
        if (!this.newEvent.title) {
            this.modalErrorMessage = 'Le titre de l\'événement est obligatoire.';
            this.loading = false;
            return;
        }

        // Conditional Location Validation
        const typeNeedsLocation = ['TRIP', 'CAMPING', 'HIKING'].includes(finalEventType.toUpperCase());
        if (typeNeedsLocation && !this.newEvent.location) {
            this.modalErrorMessage = 'Le lieu est obligatoire pour ce type d\'événement.';
            this.loading = false;
            this.cdr.detectChanges();
            return;
        }

        if (!this.newEvent.startDate) {
            this.modalErrorMessage = 'La date de début est obligatoire.';
            this.loading = false;
            return;
        }
        if (!this.newEvent.endDate) {
            this.modalErrorMessage = 'La date de fin est obligatoire.';
            this.loading = false;
            return;
        }

        // Format dates: ensure they end with ':00' for seconds
        const startDateFormatted = this.newEvent.startDate.includes(':') ?
            (this.newEvent.startDate.length === 16 ? this.newEvent.startDate + ':00' : this.newEvent.startDate) :
            this.newEvent.startDate;
        const endDateFormatted = this.newEvent.endDate.includes(':') ?
            (this.newEvent.endDate.length === 16 ? this.newEvent.endDate + ':00' : this.newEvent.endDate) :
            this.newEvent.endDate;

        const normalizedImages = (this.uploadedImages.length ? this.uploadedImages : (this.newEvent.picture ? [this.newEvent.picture] : []))
            .map((path) => this.normalizeStoredImagePath(path))
            .filter((path) => !!path);
        const payload: any = {
            title: this.newEvent.title,
            description: this.newEvent.description,
            eventType: finalEventType,
            category: finalCategory,
            startDate: startDateFormatted,
            endDate: endDateFormatted,
            location: this.newEvent.location,
            maxParticipants: this.newEvent.maxParticipants,
            price: this.newEvent.price,
            isFree: this.newEvent.isFree,
            images: normalizedImages,
            status: this.newEvent.status,
            organizerId: this.newEvent.organizerId || 1
        };

        if (this.newEvent.siteId != null) {
            payload.siteId = this.newEvent.siteId;
        }

        payload.gamificationIds = Array.from(this.selectedBadgeIds);

        if (this.editingEventId !== null) {
            this.http.put<any>(`${this.apiUrl}/${this.editingEventId}`, payload).subscribe({
                next: () => {
                    this.loadEvents();
                    this.showAddForm = false;
                    this.editingEventId = null;
                    this.resetForm();
                },
                error: (err) => {
                    console.error('Update failed:', err);
                    if (err.error?.data && typeof err.error.data === 'object' && Object.keys(err.error.data).length > 0) {
                        const errors = Object.values(err.error.data).join(', ');
                        this.modalErrorMessage = err.error.message ? `${err.error.message}: ${errors}` : errors;
                    } else {
                        this.modalErrorMessage = err.error?.message || 'Échec de la mise à jour de l\'événement.';
                    }
                    this.loading = false;
                    this.cdr.detectChanges();
                }
            });
        } else {
            this.eventService.createEvent(payload).subscribe({
                next: () => {
                    this.loadEvents();
                    this.showAddForm = false;
                    this.resetForm();
                },
                error: (err) => {
                    console.error('Creation failed:', err);
                    if (err.error?.data && typeof err.error.data === 'object' && Object.keys(err.error.data).length > 0) {
                        const errors = Object.values(err.error.data).join(', ');
                        this.modalErrorMessage = err.error.message ? `${err.error.message}: ${errors}` : errors;
                    } else {
                        this.modalErrorMessage = err.error?.message || 'Échec de la création de l\'événement. Vérifiez que tous les champs obligatoires sont remplis.';
                    }
                    this.loading = false;
                    this.cdr.detectChanges();
                }
            });
        }
    }

    getStatusClass(status: string): string {
        switch (status) {
            case 'Published': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'Completed': return 'bg-blue-100 text-blue-700 border-blue-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    }

    toggleDeleteMode() {
        this.deleteMode = !this.deleteMode;
        if (!this.deleteMode) {
            this.selectedEventIds.clear();
        }
    }

    toggleEventSelection(id: number) {
        if (this.selectedEventIds.has(id)) {
            this.selectedEventIds.delete(id);
        } else {
            this.selectedEventIds.add(id);
        }
    }

    isSelected(id: number): boolean {
        return this.selectedEventIds.has(id);
    }

    selectAll() {
        if (this.isAllSelected()) {
            this.selectedEventIds.clear();
        } else {
            this.events.forEach(e => this.selectedEventIds.add(e.id));
        }
    }

    isAllSelected(): boolean {
        return this.events.length > 0 && this.selectedEventIds.size === this.events.length;
    }

    deleteSelectedEvents() {
        if (confirm(`Are you sure you want to delete ${this.selectedEventIds.size} events?`)) {
            const ids = Array.from(this.selectedEventIds);
            this.http.request('delete', `${this.apiUrl}/bulk`, { body: ids }).subscribe({
                next: () => {
                    this.loadEvents();
                    this.selectedEventIds.clear();
                    this.deleteMode = false;
                },
                error: (err) => {
                    console.error('Bulk delete failed:', err);
                    alert('Failed to delete some events.');
                    this.loadEvents();
                }
            });
        }
    }

    toggleActionMenu(eventId: number, event: Event) {
        event.stopPropagation();
        this.activeActionMenu = this.activeActionMenu === eventId ? null : eventId;
    }

    closeActionMenu() {
        this.activeActionMenu = null;
    }

    editEvent(event: AdminEvent) {
        this.closeActionMenu();
        this.editingEventId = event.id;

        this.newEvent = {
            title: event.name || event.title,
            description: event.description,
            eventType: event.eventType,
            category: event.category,
            startDate: event.startDate ? event.startDate.substring(0, 16) : '',
            endDate: event.endDate ? event.endDate.substring(0, 16) : '',
            location: event.location,
            maxParticipants: event.capacity,
            price: event.price,
            isFree: event.isFree,
            picture: event.picture,
            status: (() => {
                const s = (event.status || '').toUpperCase();
                if (s === 'COMPLETED') return 'COMPLETED';
                if (s === 'PUBLISHED') return 'PUBLISHED';
                return 'DRAFT';
            })(),
            organizerId: event.organizerId,
            siteId: event.siteId,
            gamificationIds: []
        };

        // Fetch full event details to get gamifications
        this.http.get<ApiResponse<any>>(`${this.apiUrl}/${event.id}`).subscribe({
            next: (res) => {
                const fullEvent = res.data;
                if (fullEvent && fullEvent.gamifications) {
                    this.newEvent.gamificationIds = fullEvent.gamifications.map((g: any) => g.id);
                    this.selectedBadgeIds = new Set(this.newEvent.gamificationIds);
                    this.cdr.detectChanges();
                }
                if (fullEvent?.images?.length) {
                    this.uploadedImages = [...fullEvent.images];
                    this.imagePreviews = fullEvent.images.map((img: string) => this.resolveStoredImageUrl(img));
                    this.imagePreview = this.imagePreviews[0] || null;
                }
            }
        });

        if (!this.eventTypes.includes(event.eventType)) {
            this.newEvent.eventType = 'Other';
            this.otherEventType = event.eventType;
        } else {
            this.otherEventType = '';
        }

        if (!this.categories.includes(event.category)) {
            this.newEvent.category = 'Other';
            this.otherCategory = event.category;
        } else {
            this.otherCategory = '';
        }

        if (event.picture) {
            this.selectedFileName = event.picture.split('/').pop() || event.picture;
            this.imagePreview = this.resolveStoredImageUrl(event.picture);
        }

        this.showAddForm = true;
    }

    formatSiteLabel(site: Site): string {
        const city = site.city || site.location || '';
        return city ? `${site.name} - ${city}` : site.name;
    }

    onLocationComboboxChange(value: string) {
        const selectedLabel = (value || '').trim();
        const matched = this.availableSites.find((site) => {
            const label = this.formatSiteLabel(site);
            return label === selectedLabel || site.name === selectedLabel;
        });

        if (matched) {
            this.newEvent.siteId = matched.id ?? null;
            this.newEvent.location = matched.city || matched.address || matched.name;
        } else {
            this.newEvent.siteId = null;
            // Keep the location text so they can see what they typed, 
            // but the UI will show the warning about selecting from list.
        }
        this.cdr.detectChanges();
    }

    setEventStatus(event: AdminEvent, newStatus: 'DRAFT' | 'PUBLISHED' | 'COMPLETED') {
        this.http.patch(`${this.apiUrl}/${event.id}/status`, null, {
            params: { status: newStatus }
        }).subscribe({
            next: () => {
                this.loadEvents();
                this.closeActionMenu();
            },
            error: (err) => {
                console.error('Status update failed:', err);
                alert('Échec du changement de statut.');
            }
        });
    }

    deleteSingleEvent(eventId: number) {
        if (confirm('Are you sure you want to delete this event?')) {
            this.http.delete(`${this.apiUrl}/${eventId}`).subscribe({
                next: () => {
                    this.loadEvents();
                    this.closeActionMenu();
                },
                error: (err) => {
                    console.error('Delete failed:', err);
                    this.errorMessage = 'Failed to delete event.';
                    this.cdr.detectChanges();
                }
            });
        }
    }

    publishEvent(eventId: number) {
        this.loading = true;
        this.http.post<any>(`${this.apiUrl}/${eventId}/publish`, {}).subscribe({
            next: () => {
                this.loadEvents();
                this.closeActionMenu();
            },
            error: (err) => {
                console.error('Publish failed:', err);
                this.errorMessage = err.error?.message || 'Failed to publish event.';
                this.loading = false;
                this.cdr.detectChanges();
            }
        });
    }

    private resolveStoredImageUrl(path: string): string {
        if (!path) {
            return '';
        }

        if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('blob:')) {
            return path;
        }

        if (path.startsWith('/uploads/')) {
            return `${environment.apiUrl}${path}`;
        }

        return `${this.imageUrlBase}${path}`;
    }

    private normalizeStoredImagePath(path: string): string {
        if (!path) {
            return '';
        }

        if (path.startsWith(this.imageUrlBase)) {
            return path.substring(this.imageUrlBase.length);
        }

        if (path.startsWith('/uploads/')) {
            return path.substring('/uploads/'.length);
        }

        if (path.startsWith('http://') || path.startsWith('https://')) {
            try {
                const url = new URL(path);
                const uploadsPrefix = '/uploads/';
                const uploadsIndex = url.pathname.indexOf(uploadsPrefix);
                if (uploadsIndex >= 0) {
                    return url.pathname.substring(uploadsIndex + uploadsPrefix.length);
                }
            } catch {
                return path;
            }
        }

        return path.replace(/^\/+/, '');
    }

    resolveBadgeIcon(icon?: string): string {
        const clean = (icon || '').trim();
        if (!clean) {
            return 'assets/images/Badge/placeholder.png';
        }
        if (
            clean.startsWith('http://') ||
            clean.startsWith('https://') ||
            clean.startsWith('/') ||
            clean.startsWith('assets/')
        ) {
            return clean;
        }
        return `assets/images/Badge/${clean}`;
    }
}
