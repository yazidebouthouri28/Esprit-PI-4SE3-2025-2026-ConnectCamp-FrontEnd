import { Component, OnInit, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SiteGeneralComponent } from './tabs/site-general.component';
import { SiteReviewsComponent } from './tabs/site-reviews.component';
import { SiteVirtualToursComponent } from './tabs/site-virtual-tours.component';
import { SiteCertificationsComponent } from './tabs/site-certifications.component';
import { Site } from '../../models/camping.models';
import { SiteService } from '../../services/site.service';
import { finalize, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { AuthService } from '../../services/auth.service';

interface Campsite extends Site {
    status: 'Available' | 'Fully Booked' | 'Maintenance' | any;
}

@Component({
    selector: 'app-campsites-management',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        SiteGeneralComponent,
        SiteReviewsComponent,
        SiteVirtualToursComponent,
        SiteCertificationsComponent
    ],
    templateUrl: './campsites-management.component.html',
    styleUrls: ['./campsites-management.component.css']
})
export class CampsitesManagementComponent implements OnInit {
    private readonly maxImagesPerSite = 20;
    private readonly createWatchdogMs = 35000;
    private createWatchdogTimer: ReturnType<typeof setTimeout> | null = null;

    campsites: Campsite[] = [];
    isLoading = false;
    isCreatingSite = false;
    errorMessage = '';
    searchTerm = '';
    selectedRegion = 'ALL';
    showCreateSiteForm = false;
    createSiteError = '';

    newSiteForm: Partial<Site> = this.getInitialSiteForm();
    newSiteImageFiles: File[] = [];
    newSiteImagePreviews: string[] = [];

    selectedSite = signal<Campsite | null>(null);
    activeTab = signal<'general' | 'reviews' | 'tours' | 'certs'>('general');

    constructor(
        private siteService: SiteService,
        private cdr: ChangeDetectorRef,
        private authService: AuthService
    ) { }

    ngOnInit(): void {
        this.loadCampsites();
    }

    loadCampsites() {
        this.isLoading = true;
        this.errorMessage = '';

        this.siteService.getAllSitesAdmin().subscribe({
            next: (sites) => {
                this.campsites = sites.map((site) => ({
                    ...site,
                    status: (site.status as Campsite['status']) ?? (site.isActive === false ? 'Maintenance' : 'Available')
                }));

                if (this.selectedSite()) {
                    const selectedId = this.selectedSite()!.id;
                    this.selectedSite.set(this.campsites.find((site) => site.id === selectedId) ?? null);
                }

                this.isLoading = false;
                this.cdr.detectChanges();
            },
            error: (error) => {
                this.errorMessage = this.getErrorMessage(error, 'Unable to load campsites from server.');
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    viewDetails(site: Campsite) {
        this.selectedSite.set(site);
        this.activeTab.set('general');
    }

    closeDetails() {
        this.selectedSite.set(null);
    }

    saveSite(site: Site) {
        this.siteService.updateSite(site.id, site).subscribe({
            next: (updated) => {
                this.campsites = this.campsites.map((camp) =>
                    camp.id === updated.id
                        ? {
                            ...updated,
                            status: (updated.status as Campsite['status']) ?? (updated.isActive === false ? 'Maintenance' : 'Available')
                        }
                        : camp
                );
                this.selectedSite.set(this.campsites.find((camp) => camp.id === updated.id) ?? null);
                this.cdr.detectChanges();
                window.alert('Campsite updated successfully!');
            },
            error: (error) => {
                this.errorMessage = this.getErrorMessage(error, 'Unable to save campsite changes.');
                this.cdr.detectChanges();
            }
        });
    }

    deleteSite(id: number) {
        if (!confirm('Permanently delete this campsite and all associated data?')) return;
        this.siteService.deleteSite(id).subscribe({
            next: () => {
                this.campsites = this.campsites.filter(c => c.id !== id);
                this.selectedSite.set(null);
                this.cdr.detectChanges();
            },
            error: () => {
                this.errorMessage = 'Unable to delete campsite.';
                this.cdr.detectChanges();
            }
        });
    }

    openCreateSiteForm() {
        this.showCreateSiteForm = true;
        this.createSiteError = '';
        this.newSiteForm = this.getInitialSiteForm();
        this.clearNewSiteImages();
    }

    closeCreateSiteForm() {
        this.showCreateSiteForm = false;
        this.isCreatingSite = false;
        this.createSiteError = '';
        this.newSiteForm = this.getInitialSiteForm();
        this.clearNewSiteImages();
    }

    submitCreateSite(siteForm?: any) {
        if (this.isCreatingSite) return;

        if (siteForm && siteForm.invalid) {
            this.createSiteError = 'Please fix the validation errors before submitting.';
            return;
        }

        const name = this.newSiteForm.name?.trim();
        const city = (this.newSiteForm.city || this.newSiteForm.location || '').trim();

        if (!name || !city) {
            this.createSiteError = 'Site name and city are required.';
            return;
        }

        this.isCreatingSite = true;
        this.createSiteError = '';
        const coordinates = this.resolveCoordinates(city);
        const hasImages = this.newSiteImageFiles.length > 0;

        // Get current user ID
        const currentUser = this.authService.getCurrentUser();
        if (!currentUser?.id) {
            this.createSiteError = 'You must be logged in to create a campsite.';
            this.isCreatingSite = false;
            return;
        }

        const ownerIdNum = Number(currentUser.id);
        if (!Number.isFinite(ownerIdNum)) {
            this.createSiteError = 'Your account cannot own a campsite (invalid user id).';
            this.isCreatingSite = false;
            return;
        }

        const payload: any = {
            id: 0,
            name,
            description: this.newSiteForm.description ?? '',
            type: this.newSiteForm.type ?? '',
            address: this.newSiteForm.address ?? '',
            location: city,
            city,
            country: this.newSiteForm.country || 'Tunisia',
            latitude: coordinates.latitude,
            longitude: coordinates.longitude,
            averageRating: 0,
            image: '',
            images: [],
            amenities: this.newSiteForm.amenities ?? [],
            capacity: this.newSiteForm.capacity ?? 10,
            price: this.newSiteForm.price ?? this.newSiteForm.pricePerNight ?? 0,
            pricePerNight: this.newSiteForm.pricePerNight ?? this.newSiteForm.price ?? 0,
            contactPhone: this.newSiteForm.contactPhone ?? '',
            contactEmail: this.newSiteForm.contactEmail ?? '',
            isActive: this.newSiteForm.isActive ?? true,
            status: (this.newSiteForm.isActive ?? true) ? 'Available' : 'Maintenance',
            checkInTime: this.newSiteForm.checkInTime,
            checkOutTime: this.newSiteForm.checkOutTime,
            houseRules: this.newSiteForm.houseRules,
            ownerId: ownerIdNum
        };

        this.siteService.createSite(payload).pipe(
            switchMap((created) => {
                if (!hasImages) return of(created);
                const files = [...this.newSiteImageFiles];
                return this.siteService.uploadSiteImages(created.id, files);
            }),
            finalize(() => {
                this.clearCreateWatchdog();
                this.isCreatingSite = false;
                this.cdr.detectChanges();
            })
        ).subscribe({
            next: (created) => {
                this.clearNewSiteImages();
                this.campsites = [
                    ...this.campsites,
                    {
                        ...created,
                        status: (created.status as Campsite['status']) ?? (created.isActive === false ? 'Maintenance' : 'Available')
                    }
                ];
                this.closeCreateSiteForm();
                this.cdr.detectChanges();
            },
            error: (error) => {
                this.createSiteError = this.getErrorMessage(error, 'Unable to create campsite. Check required fields.');
                this.cdr.detectChanges();
            }
        });

        this.startCreateWatchdog();
    }

    async onSiteImagesSelected(event: Event): Promise<void> {
        const input = event.target as HTMLInputElement;
        const files = input.files;
        if (!files?.length) return;

        const availableSlots = this.maxImagesPerSite - this.newSiteImageFiles.length;

        if (availableSlots <= 0) {
            this.createSiteError = `Maximum ${this.maxImagesPerSite} images allowed.`;
            input.value = '';
            return;
        }

        const selectedFiles = Array.from(files).slice(0, availableSlots);
        for (const file of selectedFiles) {
            if (!file.type.startsWith('image/')) continue;
            this.newSiteImageFiles.push(file);
            this.newSiteImagePreviews.push(URL.createObjectURL(file));
        }

        if (files.length > selectedFiles.length) {
            this.createSiteError = `Only ${this.maxImagesPerSite} images are allowed per campsite.`;
        } else {
            this.createSiteError = '';
        }

        input.value = '';
    }

    removeSelectedImage(index: number) {
        const preview = this.newSiteImagePreviews[index];
        if (preview) URL.revokeObjectURL(preview);
        this.newSiteImageFiles = this.newSiteImageFiles.filter((_, i) => i !== index);
        this.newSiteImagePreviews = this.newSiteImagePreviews.filter((_, i) => i !== index);
    }

    private clearNewSiteImages(): void {
        for (const preview of this.newSiteImagePreviews) {
            URL.revokeObjectURL(preview);
        }
        this.newSiteImageFiles = [];
        this.newSiteImagePreviews = [];
    }

    get regions(): string[] {
        return [...new Set(this.campsites.map((site) => site.location || site.city).filter(Boolean))] as string[];
    }

    get filteredCampsites(): Campsite[] {
        const term = this.searchTerm.trim().toLowerCase();

        return this.campsites.filter((site) => {
            const location = (site.location || site.city || '').toLowerCase();
            const name = site.name.toLowerCase();
            const matchesText = !term || name.includes(term) || location.includes(term);
            const matchesRegion = this.selectedRegion === 'ALL' || location === this.selectedRegion.toLowerCase();
            return matchesText && matchesRegion;
        });
    }

    get totalCapacity(): number {
        return this.campsites.reduce((sum, site) => sum + (site.capacity ?? 0), 0);
    }

    get maintenanceCount(): number {
        return this.campsites.filter((site) => site.status === 'Maintenance' || site.isActive === false).length;
    }

    get averageRatingValue(): number {
        if (!this.campsites.length) return 0;
        const total = this.campsites.reduce((sum, site) => sum + (site.averageRating ?? 0), 0);
        return Number((total / this.campsites.length).toFixed(1));
    }

    getStatusClass(status: string): string {
        switch (status) {
            case 'Available': return 'bg-green-100 text-green-700';
            case 'Fully Booked': return 'bg-blue-100 text-blue-700';
            case 'Maintenance': return 'bg-orange-100 text-orange-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    }

    private getInitialSiteForm(): Partial<Site> {
        return {
            name: '',
            description: '',
            type: 'FOREST',
            address: '',
            city: '',
            country: 'Tunisia',
            capacity: 10,
            pricePerNight: 0,
            images: [],
            amenities: [],
            contactPhone: '',
            contactEmail: '',
            isActive: true,
            checkInTime: '14:00',
            checkOutTime: '11:00',
            houseRules: ''
        };
    }

    private resolveCoordinates(city: string): { latitude: number; longitude: number } {
        const key = city.trim().toLowerCase();
        const coordinatesMap: Record<string, { latitude: number; longitude: number }> = {
            tunis: { latitude: 36.8065, longitude: 10.1815 },
            zaghouan: { latitude: 36.4029, longitude: 10.1429 },
            'ain draham': { latitude: 36.7759, longitude: 8.6835 },
            fernana: { latitude: 36.6558, longitude: 8.6967 },
            haouaria: { latitude: 37.0509, longitude: 11.0142 },
            bizerte: { latitude: 37.2746, longitude: 9.8739 },
            douz: { latitude: 33.4669, longitude: 9.0203 },
            sousse: { latitude: 35.8256, longitude: 10.6084 },
            sfax: { latitude: 34.7406, longitude: 10.7603 }
        };

        return coordinatesMap[key] ?? { latitude: 36.8065, longitude: 10.1815 };
    }

    private getErrorMessage(error: any, fallbackMessage: string): string {
        if (error?.name === 'TimeoutError') {
            return 'Request timed out. Try with fewer/smaller images.';
        }

        if (error?.status === 0) {
            return 'Server is unreachable. Check backend connection.';
        }

        if (error?.status === 413) {
            return 'Uploaded images are too large for the server. Reduce image size or count.';
        }

        if (error?.status >= 500) {
            return 'Server failed to save data. Restart backend and retry.';
        }

        return fallbackMessage;
    }

    private startCreateWatchdog(): void {
        this.clearCreateWatchdog();
        this.createWatchdogTimer = setTimeout(() => {
            if (!this.isCreatingSite) return;
            this.isCreatingSite = false;
            this.createSiteError = 'Server is taking too long. Verify backend on http://localhost:8089 and retry.';
            this.cdr.detectChanges();
        }, this.createWatchdogMs);
    }

    private clearCreateWatchdog(): void {
        if (!this.createWatchdogTimer) return;
        clearTimeout(this.createWatchdogTimer);
        this.createWatchdogTimer = null;
    }
}