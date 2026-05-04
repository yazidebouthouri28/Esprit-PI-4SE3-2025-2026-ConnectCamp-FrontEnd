import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { PackService } from '../../services/pack.service';
import { ServiceService } from '../../services/service.service';
import { Service } from '../../models/service.model';
import { environment } from '../../../../../environments/environment';
import { CartService } from '../../../../services/cart.service';
import { SiteService } from '../../../../services/site.service';
import { AiService } from '../../../../services/ai.service';

@Component({
    selector: 'app-pack-create',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './pack-create.component.html',
    styleUrls: ['./pack-create.component.css']
})
export class PackCreateComponent implements OnInit {
    packForm: FormGroup;
    services: Service[] = [];
    sites: any[] = [];
    loading = false;
    isGeneratingAI = false;
    submitted = false;
    errorMessage = '';
    imagePreviews: string[] = [];
    selectedFiles: File[] = [];
    private uploadUrl = `${environment.apiUrl}/api/files/upload`;

    constructor(
        private fb: FormBuilder,
        private packService: PackService,
        private serviceService: ServiceService,
        private router: Router,
        private http: HttpClient,
        public cartService: CartService,
        private siteService: SiteService,
        private aiService: AiService
    ) {
        this.packForm = this.fb.group({
            name: ['', [Validators.required, Validators.minLength(3)]],
            description: ['', [Validators.required]],
            price: [0, [Validators.required, Validators.min(0)]],
            discount: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
            category: ['FAMILY', Validators.required],
            serviceIds: [[], [Validators.required, Validators.minLength(1)]],
            durationDays: [1, [Validators.required, Validators.min(1)]],
            maxPersons: [1, [Validators.required, Validators.min(1)]],
            siteId: [null, Validators.required],
            available: [true]
        });
    }

    ngOnInit(): void {
        this.loadServices();
        this.loadSites();
    }

    loadSites(): void {
        this.siteService.getAllSites().subscribe({
            next: (data) => this.sites = data,
            error: (err) => console.error('Error loading sites', err)
        });
    }

    loadServices(): void {
        this.serviceService.getAll().subscribe({
            next: (data) => this.services = data.filter(s => !s.isOrganizerService),
            error: (err) => console.error('Error loading services', err)
        });
    }

    toggleService(id: number): void {
        const currentIds: number[] = this.packForm.get('serviceIds')?.value;
        const index = currentIds.indexOf(id);
        if (index === -1) {
            currentIds.push(id);
        } else {
            currentIds.splice(index, 1);
        }
        this.packForm.get('serviceIds')?.setValue([...currentIds]);
    }

    isServiceSelected(id: number): boolean {
        return this.packForm.get('serviceIds')?.value.includes(id);
    }

    onFilesSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files) {
            for (let i = 0; i < input.files.length; i++) {
                const file = input.files[i];
                if (file.size > 20 * 1024 * 1024) {
                    this.errorMessage = `"${file.name}" dépasse 20 MB.`;
                    continue;
                }
                this.selectedFiles.push(file);
                this.imagePreviews.push(URL.createObjectURL(file));
            }
            input.value = '';
        }
    }

    removeImage(index: number): void {
        URL.revokeObjectURL(this.imagePreviews[index]);
        this.imagePreviews.splice(index, 1);
        this.selectedFiles.splice(index, 1);
    }

    onSubmit(): void {
        this.submitted = true;
        if (this.packForm.invalid) return;

        this.loading = true;
        this.errorMessage = '';

        if (this.selectedFiles.length > 0) {
            this.uploadAllFiles().then((fileNames) => {
                this.submitPack(fileNames);
            }).catch((err) => {
                console.error('Upload failed:', err);
                this.errorMessage = 'Échec du chargement des images.';
                this.loading = false;
            });
        } else {
            this.submitPack([]);
        }
    }

    private async uploadAllFiles(): Promise<string[]> {
        const fileNames: string[] = [];
        for (const file of this.selectedFiles) {
            const formData = new FormData();
            formData.append('file', file);
            const res: any = await this.http.post(this.uploadUrl, formData).toPromise();
            const fileName = res.data?.fileName || res.fileName || res.data;
            if (fileName) fileNames.push(fileName);
        }
        return fileNames;
    }

    private submitPack(imageFileNames: string[]): void {
        const f = this.packForm.value;
        const payload: any = {
            name: f.name,
            description: f.description,
            price: Number(f.price),
            discount: Number(f.discount),
            discountPercentage: Number(f.discount), // Add for backend compatibility
            category: f.category || 'FAMILY',
            packType: f.category || 'FAMILY', // Restore packType as it is mandatory on backend
            serviceIds: f.serviceIds,
            durationDays: Number(f.durationDays || 1),
            maxPersons: Number(f.maxPersons || 1),
            siteId: f.siteId,
            available: f.available,
            isActive: f.available,
            images: imageFileNames,
            // Fallback fields for legacy backend support
            imageUrl: imageFileNames.length > 0 ? imageFileNames[0] : '', // Match backend DTO
            image_url: imageFileNames.length > 0 ? imageFileNames[0] : '',
            image: imageFileNames.length > 0 ? imageFileNames[0] : ''
        };

        console.log('Final Payload being sent:', payload);

        this.packService.create(payload).subscribe({
            next: () => {
                this.loading = false;
                if (this.router.url.includes('/admin')) this.router.navigate(['/admin']);
                else this.router.navigate(['/services/packs']);
            },
            error: (err) => {
                console.error("Full Error Object:", err);
                let detail = err.error?.message || err.message || 'Erreurs de validation';

                // If the backend returned a map of errors (field -> message)
                if (err.error?.errors) {
                    const errorList = Object.entries(err.error.errors)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(', ');
                    detail = `${detail} (${errorList})`;
                } else if (err.error && typeof err.error === 'object') {
                    // Try to stringify any other error object structure
                    try {
                        const otherDetails = JSON.stringify(err.error);
                        if (otherDetails !== '{}') detail = `${detail} - ${otherDetails}`;
                    } catch (e) { }
                }

                this.errorMessage = `Failed to create pack: ${detail}`;
                this.loading = false;
            }
        });
    }

    goBack(): void {
        if (this.router.url.includes('/admin')) this.router.navigate(['/admin']);
        else this.router.navigate(['/services/packs']);
    }

    getImageUrl(imagePath: string | undefined): string {
        return this.cartService.getImageUrl(imagePath);
    }

    generateAIDescription(): void {
        const name = this.packForm.get('name')?.value;
        const siteId = this.packForm.get('siteId')?.value;
        const serviceIds = this.packForm.get('serviceIds')?.value;

        if (!name || !siteId) {
            this.errorMessage = 'Please enter a name and select a site first to use AI generation.';
            return;
        }

        const site = this.sites.find(s => s.id === Number(siteId))?.name || 'Unknown Location';
        const selectedServices = this.services
            .filter(s => serviceIds.includes(s.id))
            .map(s => s.name)
            .join(', ');

        this.isGeneratingAI = true;
        this.errorMessage = '';

        this.aiService.generatePackDescription(name, selectedServices || 'Various camping services', site)
            .subscribe({
                next: (desc) => {
                    this.packForm.patchValue({ description: desc });
                    this.isGeneratingAI = false;
                },
                error: (err) => {
                    console.error('AI generation failed', err);
                    this.errorMessage = 'Failed to generate AI description.';
                    this.isGeneratingAI = false;
                }
            });
    }
}
