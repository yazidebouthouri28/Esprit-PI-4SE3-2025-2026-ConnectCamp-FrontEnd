import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ServiceService } from '../../services/service.service';
import { environment } from '../../../../../environments/environment';
import { CartService } from '../../../../services/cart.service';

@Component({
    selector: 'app-service-edit',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: '../service-create/service-create.component.html', // Re-using the same template
    styleUrls: ['../service-create/service-create.component.css']
})
export class ServiceEditComponent implements OnInit {
    serviceForm: FormGroup;
    loading = false;
    submitted = false;
    errorMessage = '';
    serviceId!: number;
    imagePreviews: string[] = [];
    uploadedImageNames: string[] = [];
    isUploading = false;

    serviceTypes = [
        { value: 'ACCOMMODATION', label: 'Hébergement' },
        { value: 'CATERING', label: 'Restauration' },
        { value: 'TRANSPORT', label: 'Transport' },
        { value: 'SECURITY', label: 'Sécurité' },
        { value: 'MEDICAL', label: 'Médical' },
        { value: 'ENTERTAINMENT', label: 'Divertissement' },
        { value: 'GUIDE', label: 'Guide Touristique' },
        { value: 'OTHER', label: 'Autre' }
    ];

    constructor(
        private fb: FormBuilder,
        private serviceService: ServiceService,
        private router: Router,
        private route: ActivatedRoute,
        private http: HttpClient,
        public cartService: CartService
    ) {
        this.serviceForm = this.fb.group({
            name: ['', [Validators.required, Validators.minLength(3)]],
            description: ['', [Validators.required, Validators.maxLength(500)]],
            price: [0, [Validators.required, Validators.min(0)]],
            type: ['', Validators.required],
            available: [true],
            campingId: [null]
        });
    }

    ngOnInit(): void {
        this.serviceId = Number(this.route.snapshot.paramMap.get('id'));
        if (this.serviceId) {
            this.loadService();
        }
    }

    loadService(): void {
        this.loading = true;
        this.serviceService.getById(this.serviceId).subscribe({
            next: (service) => {
                this.serviceForm.patchValue(service);
                if (service.images && service.images.length > 0) {
                    this.imagePreviews = [...service.images];
                    this.uploadedImageNames = [...service.images];
                }
                this.loading = false;
            },
            error: (err) => {
                console.error('Error loading service', err);
                this.errorMessage = 'Could not load service data.';
                this.loading = false;
            }
        });
    }
    onFilesSelected(event: any): void {
        const files: FileList = event.target.files;
        if (!files || files.length === 0) return;

        this.isUploading = true;
        this.errorMessage = '';

        Array.from(files).forEach(file => {
            if (file.size > 20 * 1024 * 1024) {
                this.errorMessage = `"${file.name}" dépasse 20 MB.`;
                return;
            }
            const formData = new FormData();
            formData.append('file', file);

            // Create local preview
            const reader = new FileReader();
            reader.onload = (e: any) => {
                this.imagePreviews.push(e.target.result);
            };
            reader.readAsDataURL(file);

            // Upload to server
            this.http.post<any>(`${environment.apiUrl}/api/files/upload`, formData)
                .subscribe({
                    next: (res: any) => {
                        const fileName = res.data?.fileName || res.fileName || res.data;
                        if (fileName) {
                            this.uploadedImageNames.push(fileName);
                        }
                        this.isUploading = false;
                    },
                    error: (err: any) => {
                        console.error('Upload failed', err);
                        this.errorMessage = 'Some images failed to upload.';
                        this.isUploading = false;
                    }
                });
        });
    }

    removeImage(index: number): void {
        this.imagePreviews.splice(index, 1);
        this.uploadedImageNames.splice(index, 1);
    }

    onFileSelected(event: Event): void {
        // Alias for template compatibility if needed, but we use onFilesSelected
        this.onFilesSelected(event);
    }

    onSubmit(): void {
        this.submitted = true;
        if (this.serviceForm.invalid) {
            return;
        }

        this.loading = true;

        const payload = { ...this.serviceForm.value };
        payload.images = this.uploadedImageNames;

        this.serviceService.update(this.serviceId, payload).subscribe({
            next: () => {
                this.loading = false;
                if (this.router.url.includes('/admin')) this.router.navigate(['/admin']);
                else this.router.navigate(['/services/list']);
            },
            error: (err) => {
                console.error('Error updating service', err);
                this.errorMessage = 'Failed to update service.';
                this.loading = false;
            }
        });
    }

    goBack(): void {
        if (this.router.url.includes('/admin')) this.router.navigate(['/admin']);
        else this.router.navigate(['/services/list']);
    }

    getImageUrl(imagePath: string | undefined): string {
        return this.cartService.getImageUrl(imagePath);
    }
}
