import { Component, HostListener, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../models/api.models';
import { Site } from '../../models/camping.models';
import { SiteService } from '../../services/site.service';
import { GamificationService } from '../../services/gamification.service';
import { Badge } from '../../models/gamification.models';
import { extractPagedContent, isUnreachableApiRoute } from '../../utils/http-api-fallback';
import { EventService, MLPredictionResponse } from '../../services/event.service';
import { NotificationService } from '../../services/notification.service';

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
    startDate: string;
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

interface Participant {
    id: number;
    user: any;
    status: string;
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
    images: string[];          // ADDED
    status: string;
    organizerId: number | null;
    siteId: number | null;
    gamificationIds: number[];
}

@Component({
    selector: 'app-events-admin-management',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './organizer-events.component.html',
    styleUrls: ['./organizer-events.component.css']
})
export class OrganizerEventsComponent implements OnInit {

    private http = inject(HttpClient);
    private cdr = inject(ChangeDetectorRef);
    private route = inject(ActivatedRoute);
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

    showAddForm = false;
    deleteMode = false;
    selectedEventIds = new Set<number>();
    imagePreview: string | null = null;
    imagePreviews: string[] = []; // Store multiple previews
    selectedFileName = '';
    selectedFile: File | null = null;
    selectedFiles: File[] = [];   // Store multiple files
    uploadedImages: string[] = []; // Store names of already uploaded images (for edits)
    imageError = '';
    isUploading = false;
    activeActionMenu: number | null = null;
    editingEventId: number | null = null;
    otherEventType = '';
    otherCategory = '';
    myOrganizerId: number | null = null;
    availableBadges: Badge[] = [];
    selectedBadgeIds = new Set<number>();
    selectedBadgeMedalFilter: 'ALL' | 'COMMUNITY' | 'SCIENCE' | 'SCOUT' = 'ALL';
    availableSites: Site[] = [];

    showPrediction = false;
    predictionLoading = false;
    predictedAttendees: number | null = null;
    predictedPopularity: string | null = null;
    suggestedBadge: string | null = null;
    private predictTimer: any = null;



    onPredictionInputChange() {
        if (this.predictTimer) {
            clearTimeout(this.predictTimer);
        }
        this.predictTimer = setTimeout(() => this.predictNow(), 350);
    }

    private predictNow() {
        const category = (this.newEvent.category === 'Other'
            ? this.otherCategory
            : this.newEvent.category) || '';

        const eventType = (this.newEvent.eventType === 'Other'
            ? this.otherEventType
            : this.newEvent.eventType) || '';

        const start = this.parseLocalDateTime(this.newEvent.startDate);
        const end = this.parseLocalDateTime(this.newEvent.endDate);

        // ✅ Require category AND event type AND start date before predicting
        if (!category || !eventType || !start) {
            this.showPrediction = false;
            return;
        }

        // ✅ Duration: only compute if end is valid AND after start
        const durationHours = (end && start && end.getTime() > start.getTime())
            ? Math.max(1, Math.round((end.getTime() - start.getTime()) / 3600000))
            : 2;

        // Location: keep real input so backend can provide a meaningful fallback estimate if ML model rejects the label.
        const state = (this.newEvent.location || '').trim() || 'Tunis';

        // ✅ Price: handle null explicitly
        const price = this.newEvent.isFree
            ? 0
            : (this.newEvent.price != null ? Number(this.newEvent.price) : 0);

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
        this.showPrediction = false; // hide stale result while loading

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
        return (jsDay + 6) % 7;
    }




    // Participant Management
    showParticipantsModal = false;
    participants: Participant[] = [];
    currentParticipantsEvent: AdminEvent | null = null;
    selectedParticipantIds = new Set<number>();
    awardBadgeModalOpen = false;
    badgeToAwardId: number | null = null;
    eventAssociatedBadges: Badge[] = [];

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
        images: [],             // ADDED
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
        this.resolveOrganizerId(() => {
            this.loadEvents();
            this.loadAvailableBadges();
            this.loadAvailableSites();

            this.route.queryParams.subscribe(params => {
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
                            const eventToAward = this.events.find(e => e.id === Number(id));
                            if (eventToAward) {
                                this.openParticipantsModal(eventToAward);
                            }
                            clearInterval(checkInterval);
                        }
                    }, 100);
                    setTimeout(() => clearInterval(checkInterval), 3000);
                }
            });
        });
    }

    private resolveOrganizerId(done: () => void) {
        const user = this.authService.getCurrentUser();
        if (!user || !this.authService.hasOrganizerAccess()) {
            this.errorMessage = 'Organizer access required.';
            this.loading = false;
            this.cdr.detectChanges();
            return;
        }
        if (user.organizerId != null && user.organizerId !== undefined) {
            this.myOrganizerId = user.organizerId;
            done();
            return;
        }
        const uid = Number(user.id);
        if (!Number.isFinite(uid)) {
            this.errorMessage = 'Cannot resolve your user id.';
            this.loading = false;
            this.cdr.detectChanges();
            return;
        }
        this.http.get<ApiResponse<number>>(`${environment.apiUrl}/api/organizers/by-user/${uid}`).subscribe({
            next: (res) => {
                const oid = res.data;
                if (oid != null && oid !== undefined) {
                    this.myOrganizerId = Number(oid);
                    this.authService.patchStoredUser({ organizerId: this.myOrganizerId });
                    done();
                } else {
                    this.errorMessage = 'No organizer record found for this account.';
                    this.loading = false;
                    this.cdr.detectChanges();
                }
            },
            error: () => {
                this.errorMessage = 'Could not load your organizer profile. Are you registered as an organizer?';
                this.loading = false;
                this.cdr.detectChanges();
            }
        });
    }

    private setOrganizerId() {
        const user = this.authService.getCurrentUser();
        this.newEvent.organizerId = this.myOrganizerId ?? user?.organizerId ?? null;
    }

    loadEvents() {
        if (this.myOrganizerId == null) {
            return;
        }
        this.loading = true;
        this.errorMessage = '';
        this.loadStats();
        this.http.get<any>(`${this.apiUrl}`).subscribe({
            next: (response) => {
                const payload = response.data ?? response;
                const list: any[] = Array.isArray(payload?.content)
                    ? payload.content
                    : Array.isArray(payload) ? payload : [];
                const organizerEvents = list.filter((e: any) => Number(e?.organizerId) === this.myOrganizerId);

                this.events = organizerEvents
                    .filter((e: any) => e?.status !== 'CANCELLED')
                    .map((e: any) => ({
                        id: e.id,
                        name: e.title || '',
                        title: (e.title || e.description || 'Untitled').substring(0, 30),
                        type: this.mapEventType(e.eventType),
                        location: e.location || '',
                        date: e.startDate ? new Date(e.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD',
                        participants: e.currentParticipants || 0,
                        capacity: e.maxParticipants || 0,
                        price: e.price || 0,
                        description: e.description || '',
                        status: this.mapStatus(e.status),
                        category: e.category || '',
                        startDate: e.startDate ? e.startDate.replace('T', 'T').substring(0, 16) : '',
                        endDate: e.endDate ? e.endDate.replace('T', 'T').substring(0, 16) : '',
                        picture: e.thumbnail || e.picture || e.images?.[0] || '',
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
                console.error('Failed to load organizer events:', err);
                this.errorMessage = err.error?.message || err.message || 'Failed to load your organizer events.';
                this.loading = false;
                this.cdr.detectChanges();
            }
        });
    }

    loadAvailableBadges() {
        this.gamificationService.getBadges().subscribe({
            next: (data: Badge[]) => {
                this.availableBadges = data;
                this.cdr.detectChanges();
            },
            error: (err: any) => console.error('Failed to load badges:', err)
        });
    }

    loadAvailableSites() {
        this.siteService.getAllSites().subscribe({
            next: (sites) => {
                this.availableSites = sites || [];
                this.cdr.detectChanges();
            },
            error: (err) => console.error('Failed to load sites:', err)
        });
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
        }
        this.cdr.detectChanges();
    }

    setBadgeMedalFilter(filter: 'ALL' | 'COMMUNITY' | 'SCIENCE' | 'SCOUT'): void {
        this.selectedBadgeMedalFilter = filter;
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

    formatSiteLabel(site: Site): string {
        if (!site) return '';
        const city = site.city || site.location || '';
        return city ? `${site.name} - ${city}` : site.name;
    }

    loadStats() {
        if (this.myOrganizerId == null) return;
        this.http.get<ApiResponse<any>>(`${this.apiUrl}/organizer/${this.myOrganizerId}/stats`).subscribe({
            next: (res) => {
                this.totalViews = res.data?.totalViews || 0;
                this.cdr.detectChanges();
            },
            error: (err) => console.error('Failed to load stats:', err)
        });
    }

    get filteredEvents() {
        return this.events.filter(event => {
            const matchesSearch = !this.searchTerm ||
                event.title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                event.location.toLowerCase().includes(this.searchTerm.toLowerCase());

            const matchesStatus = this.statusFilter === 'All Status' ||
                event.status === this.statusFilter;

            return matchesSearch && matchesStatus;
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

    private mapStatus(status: string): 'Published' | 'Draft' | 'Completed' {
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
            images: [],             // ADDED
            status: 'PUBLISHED',
            organizerId: null,
            siteId: null,
            gamificationIds: []
        };
        this.selectedBadgeIds.clear();
        this.editingEventId = null;
        this.otherEventType = '';
        this.otherCategory = '';
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

    // -1 => main picture, 0..n => gallery images
    currentUploadSlot: number | null = null;

    prepareMainUpload() {
        this.currentUploadSlot = -1;
    }

    handleGalleryUpload(slotIndex: number) {
        this.currentUploadSlot = slotIndex;
        const fileInput = document.getElementById('fileUpload') as HTMLInputElement;
        if (fileInput) fileInput.click();
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
            this.imagePreview = this.imagePreviews[0] || null;
            this.newEvent.picture = this.selectedFiles[0]?.name || '';
            input.value = ''; // Reset to allow re-selection
        }
    }

    removeImageAtIndex(index: number): void {
        if (this.imagePreviews[index]?.startsWith('blob:')) {
            URL.revokeObjectURL(this.imagePreviews[index]);
        }

        const existingCount = this.uploadedImages.length;
        if (index < existingCount) {
            this.uploadedImages.splice(index, 1);
        } else {
            this.selectedFiles.splice(index - existingCount, 1);
        }

        this.imagePreviews.splice(index, 1);
        this.imagePreview = this.imagePreviews[0] || null;
        this.newEvent.picture = this.uploadedImages[0] || this.selectedFiles[0]?.name || '';
        this.cdr.detectChanges();
    }

    removeImage() {
        this.imagePreviews.forEach(p => {
            if (p.startsWith('blob:')) URL.revokeObjectURL(p);
        });
        this.imagePreviews = [];
        this.imagePreview = null;
        this.selectedFiles = [];
        this.uploadedImages = [];
        this.newEvent.picture = '';
        this.imageError = '';
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

        this.loading = true;

        if (this.selectedFiles.length > 0) {
            this.uploadFilesBeforeSubmit(0, [], finalEventType, finalCategory);
        } else {
            this.proceedWithSubmit(finalEventType, finalCategory);
        }
    }

    private uploadFilesBeforeSubmit(index: number, uploaded: string[], finalEventType: string, finalCategory: string): void {
        if (index >= this.selectedFiles.length) {
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
        const organizerId = this.myOrganizerId ?? this.newEvent.organizerId;

        if (organizerId == null) {
            this.modalErrorMessage = 'Organizer profile not found. Please sign in again with your organizer account.';
            return;
        }
        // Validate required fields
        if (!this.newEvent.title) {
            this.modalErrorMessage = 'Le titre de l\'événement est obligatoire.';
            return;
        }

        // Conditional Location Validation
        const typeNeedsLocation = ['TRIP', 'CAMPING', 'HIKING'].includes(finalEventType.toUpperCase());
        if (typeNeedsLocation && !this.newEvent.location) {
            this.modalErrorMessage = 'Le lieu est obligatoire pour ce type d\'événement.';
            this.cdr.detectChanges();
            return;
        }

        if (!this.newEvent.startDate) {
            this.modalErrorMessage = 'La date de début est obligatoire.';
            return;
        }
        if (!this.newEvent.endDate) {
            this.modalErrorMessage = 'La date de fin est obligatoire.';
            return;
        }

        this.loading = true;

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

        const payload: Record<string, unknown> = {
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
            thumbnail: normalizedImages[0] || '',
            picture: normalizedImages[0] || '',
            images: normalizedImages,
            status: this.newEvent.status,
            organizerId
        };

        if (this.newEvent.siteId != null) {
            payload['siteId'] = this.newEvent.siteId;
        }

        payload['gamificationIds'] = Array.from(this.selectedBadgeIds);

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
            case 'Draft': return 'bg-slate-100 text-slate-700 border-slate-200';
            default: return 'bg-gray-100 text-gray-700';
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

        // Reset and populate images for the premium grid
        this.uploadedImages = [];
        this.imagePreviews = [];
        this.selectedFiles = [];

        if ((event as any).images && Array.isArray((event as any).images) && (event as any).images.length > 0) {
            this.uploadedImages = [...(event as any).images];
        } else if (event.picture) {
            this.uploadedImages = [event.picture];
        }

        this.imagePreviews = this.uploadedImages.map(img => this.resolveStoredImageUrl(img));

        this.newEvent = {
            title: event.name || event.title,
            description: event.description || '',
            eventType: event.eventType || '',
            category: event.category || '',
            startDate: event.startDate ? event.startDate.substring(0, 16) : '',
            endDate: event.endDate ? event.endDate.substring(0, 16) : '',
            location: event.location || '',
            maxParticipants: event.capacity || null,
            price: event.price || 0,
            isFree: event.isFree || false,
            picture: event.picture || '',
            images: this.uploadedImages,
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

        // ... existing badge loading logic ...
        this.http.get<ApiResponse<any>>(`${this.apiUrl}/${event.id}`).subscribe({
            next: (res) => {
                const gams = res.data?.gamifications || [];
                this.selectedBadgeIds = new Set(gams.map((g: any) => g.id));
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

    toggleBadgeSelection(badgeId: number) {
        if (this.selectedBadgeIds.has(badgeId)) {
            this.selectedBadgeIds.delete(badgeId);
        } else {
            this.selectedBadgeIds.add(badgeId);
        }
        this.cdr.detectChanges();
    }

    public resolveStoredImageUrl(path: string): string {
        if (!path) return '';
        if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('blob:')) {
            return path;
        }
        if (path.startsWith('/uploads/')) {
            return `${environment.apiUrl}${path}`;
        }
        return `${this.imageUrlBase}${path}`;
    }

    private normalizeStoredImagePath(path: string): string {
        if (!path) return '';
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
                            this.modalErrorMessage = '';
                            this.cdr.detectChanges();
                        },
                        error: (legacyErr) => {
                            console.error('Failed to load participants (legacy fallback):', legacyErr);
                            this.loading = false;
                            this.modalErrorMessage = legacyErr.error?.message || 'Failed to load participants.';
                            this.cdr.detectChanges();
                        }
                    });
                    return;
                }
                console.error('Failed to load participants:', err);
                this.loading = false;
                this.modalErrorMessage = err.error?.message || 'Failed to load participants.';
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
}
