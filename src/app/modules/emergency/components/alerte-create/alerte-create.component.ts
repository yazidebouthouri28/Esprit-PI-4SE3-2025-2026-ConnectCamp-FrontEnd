import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AlerteService } from '../../services/alerte.service';
import { EonetService } from '../../services/eonet.service';
import { EonetEvent, EmergencyMLResponse } from '../../models/alerte.model';
import { UserService } from '../../../../services/user.service';
import { HttpClient } from '@angular/common/http';

import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

declare var L: any;

@Component({
    selector: 'app-alerte-create',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterLink],
    templateUrl: './alerte-create.component.html',
    styleUrls: ['./alerte-create.component.css']
})
export class AlerteCreateComponent implements OnInit, AfterViewInit {
    alertForm: FormGroup;
    loading = false;
    submitted = false;
    errorMessage = '';
    locationLoading = false;
    map: any;
    marker: any;

    alertTypes = ['FIRE', 'MEDICAL', 'SECURITY', 'WEATHER', 'OTHER'];
    levels = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

    nearbyEvents: EonetEvent[] = [];
    eonetLoading = false;
    appliedEonetId: string | null = null;

    // ML state
    mlResult: EmergencyMLResponse | null = null;
    mlLoading = false;
    mlError: string | null = null;

    constructor(
        private fb: FormBuilder,
        private alerteService: AlerteService,
        private eonetService: EonetService,
        private router: Router,
        private userService: UserService,
        private sanitizer: DomSanitizer,
        private http: HttpClient
    ) {
        const currentUser = this.userService.getLoggedInUser();
        const reporterName = currentUser ? currentUser.name : 'Unknown User';

        this.alertForm = this.fb.group({
            title: ['', [Validators.required, Validators.minLength(5)]],
            description: ['', [Validators.required, Validators.minLength(10)]],
            emergencyType: ['', Validators.required],
            severity: ['MEDIUM', Validators.required],
            location: ['', Validators.required],
            latitude: [null],
            longitude: [null]
        });
    }

    ngOnInit(): void {
        this.captureLocation();
    }

    ngAfterViewInit(): void {
        this.initMap();
    }

    initMap(): void {
        if (typeof L === 'undefined') { console.warn('Leaflet not loaded'); return; }
        // Default center
        this.map = L.map('map').setView([36.0, 10.0], 7);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap'
        }).addTo(this.map);

        this.map.on('click', (e: any) => {
            this.updateMarker(e.latlng.lat, e.latlng.lng);
        });

        const lat = this.alertForm.get('latitude')?.value;
        const lng = this.alertForm.get('longitude')?.value;
        if (lat && lng) {
            this.updateMarker(lat, lng);
            this.map.setView([lat, lng], 15);
        }
    }

    updateMarker(lat: number, lng: number): void {
        if (this.marker) {
            this.map.removeLayer(this.marker);
        }
        this.marker = L.marker([lat, lng]).addTo(this.map);
        this.alertForm.patchValue({ latitude: lat, longitude: lng });
        this.reverseGeocode(lat, lng);
    }

    reverseGeocode(lat: number, lng: number): void {
        this.alertForm.patchValue({ location: 'Analyzing coordinates...' });
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;

        this.http.get<any>(url).subscribe({
            next: (data) => {
                if (data && data.display_name) {
                    const addr = data.address;
                    let locationName = data.display_name; // Fallback

                    if (addr) {
                        const spot = addr.amenity || addr.leisure || addr.building || addr.tourism || addr.shop;
                        const street = addr.road || addr.pedestrian || addr.footway || addr.path;
                        const city = addr.city || addr.town || addr.village || addr.suburb || addr.municipality;

                        if (spot && street && city) locationName = `${spot}, ${street}, ${city}`;
                        else if (spot && city) locationName = `${spot}, ${city}`;
                        else if (street && city) locationName = `${street}, ${city}`;
                        else if (city) locationName = city;
                    }
                    this.alertForm.patchValue({ location: locationName });
                } else {
                    this.alertForm.patchValue({ location: 'Unknown Map Location' });
                }
            },
            error: (err) => {
                console.error('Reverse geocoding error', err);
                this.alertForm.patchValue({ location: 'Coordinates Secured' });
            }
        });
    }

    captureLocation(): void {
        if (navigator.geolocation) {
            this.locationLoading = true;
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    this.alertForm.patchValue({
                        latitude: lat,
                        longitude: lng
                    });
                    if (this.map) {
                        this.updateMarker(lat, lng);
                        this.map.setView([lat, lng], 15);
                    }
                    this.locationLoading = false;
                    this.fetchNearbyEonetEvents(lat, lng);
                },
                (error) => {
                    console.error('Error capturing location', error);
                    this.locationLoading = false;
                },
                { enableHighAccuracy: true, timeout: 5000 }
            );
        }
    }

    private fetchNearbyEonetEvents(lat: number, lon: number): void {
        this.eonetLoading = true;
        this.nearbyEvents = [];
        this.eonetService.getNearbyEvents(lat, lon).subscribe({
            next: events => {
                this.nearbyEvents = events;
                this.eonetLoading = false;
            },
            error: () => { this.eonetLoading = false; }
        });
    }

    eonetCategoryIcon(evt: EonetEvent): string {
        return this.eonetService.categoryIcon(this.eonetService.getFirstCategoryId(evt));
    }

    applyEonetSuggestion(evt: EonetEvent): void {
        const catId = this.eonetService.getFirstCategoryId(evt);
        const emergencyType = this.eonetService.mapCategoryToType(catId);
        const severity = this.eonetService.mapCategoryToSeverity(catId);

        // Auto-remplir le titre si vide
        const currentTitle = this.alertForm.get('title')?.value;
        const autoTitle = currentTitle?.trim()
            ? currentTitle
            : `[NASA] ${evt.title}`;

        this.alertForm.patchValue({
            emergencyType,
            severity,
            title: autoTitle
        });

        // Marquer cet événement comme appliqué (feedback visuel)
        this.appliedEonetId = evt.id;
    }

    get canPredict(): boolean {
        const f = this.alertForm.value;
        return !!(f.emergencyType && f.title?.length >= 5 && f.description?.length >= 10);
    }

    runMLPredict(): void {
        const f = this.alertForm.value;
        this.mlLoading = true;
        this.mlResult = null;
        this.mlError = null;

        this.alerteService.predictSeverity(
            f.title,
            f.description,
            f.emergencyType,
            1,
            false
        ).subscribe({
            next: (result) => {
                this.mlResult = result;
                this.mlLoading = false;
            },
            error: () => {
                this.mlError = 'ML server unavailable. Make sure the Python server is running.';
                this.mlLoading = false;
            }
        });
    }

    applyMLSeverity(): void {
        if (this.mlResult?.predictedSeverity) {
            this.alertForm.patchValue({ severity: this.mlResult.predictedSeverity });
        }
    }

    mlSeverityColor(s: string): string {
        const m: Record<string, string> = {
            CRITICAL: 'text-red-600', HIGH: 'text-orange-500',
            MEDIUM: 'text-amber-500', LOW: 'text-green-600'
        };
        return m[s] ?? 'text-gray-500';
    }

    mlSeverityBg(s: string): string {
        const m: Record<string, string> = {
            CRITICAL: 'bg-red-50 border-red-200',
            HIGH:     'bg-orange-50 border-orange-200',
            MEDIUM:   'bg-amber-50 border-amber-200',
            LOW:      'bg-green-50 border-green-200'
        };
        return m[s] ?? 'bg-gray-50 border-gray-200';
    }

    onSubmit(): void {
        this.submitted = true;
        if (this.alertForm.invalid) return;

        this.loading = true;
        this.alerteService.create(this.alertForm.value).subscribe({
            next: () => {
                this.loading = false;
                this.router.navigate(['/emergency/list']);
            },
            error: (err) => {
                console.error('Error reporting alert', err);
                this.errorMessage = 'Critical: Failed to send alert. Contact staff directly.';
                this.loading = false;
            }
        });
    }
}
