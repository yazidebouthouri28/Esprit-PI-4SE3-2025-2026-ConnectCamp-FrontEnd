import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { PackService } from '../../services/pack.service';
import { ServiceService } from '../../services/service.service';
import { Service } from '../../models/service.model';
import { Pack } from '../../models/pack.model';
import { environment } from '../../../../../environments/environment';
import { CartService } from '../../../../services/cart.service';
import { SiteService } from '../../../../services/site.service';
import { AiService } from '../../../../services/ai.service';

@Component({
    selector: 'app-pack-edit',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './pack-edit.component.html',
    styleUrls: ['./pack-edit.component.css']
})
export class PackEditComponent implements OnInit {
    packForm: FormGroup;
    services: Service[] = [];
    sites: any[] = [];
    loading = false;
    isGeneratingAI = false;
    submitted = false;
    errorMessage = '';
    imagePreviews: string[] = [];
    selectedFiles: File[] = [];
    uploadedImageNames: string[] = [];
    packId: number | null = null;
    private uploadUrl = `${environment.apiUrl}/api/files/upload`;
    loadingData = true;

    constructor(
        private fb: FormBuilder,
        private packService: PackService,
        private serviceService: ServiceService,
        private router: Router,
        private route: ActivatedRoute,
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
            serviceIds: [[], [Validators.required, Validators.minLength(1)]],
            available: [true],
            imageUrl: [''],
            category: ['FAMILY', Validators.required],
            durationDays: [1, [Validators.required, Validators.min(1)]],
            maxPersons: [1, [Validators.required, Validators.min(1)]],
            siteId: [null, Validators.required]
        });
    }

    ngOnInit(): void {
        this.loadServices();
        this.loadSites();
        this.route.paramMap.subscribe(params => {
            const id = params.get('id');
            if (id) {
                this.packId = +id;
                this.loadPackData(this.packId);
            }
        });
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

    loadPackData(id: number): void {
        this.packService.getById(id).subscribe({
            next: (pack) => {
                this.packForm.patchValue({
                    name: pack.name,
                    description: pack.description,
                    price: pack.price,
                    discount: pack.discount,
                    serviceIds: pack.serviceIds || [],
                    available: pack.available,
                    imageUrl: pack.imageUrl || '',
                    category: this.isValidCategory(pack.category) ? pack.category : 'FAMILY',
                    durationDays: pack.durationDays || 1,
                    maxPersons: pack.maxPersons || 1,
                    siteId: pack.siteId
                });
                if (pack.images && pack.images.length > 0) {
                    this.imagePreviews = [...pack.images];
                    this.uploadedImageNames = [...pack.images];
                } else if (pack.image) {
                    this.imagePreviews = [pack.image];
                    this.uploadedImageNames = [pack.image];
                }
                this.loadingData = false;
            },
            error: () => {
                this.errorMessage = 'Failed to load bundle details.';
                this.loadingData = false;
            }
        });
    }

    toggleService(id: number): void {
        const currentIds: number[] = this.packForm.get('serviceIds')?.value || [];
        const index = currentIds.indexOf(id);
        if (index === -1) {
            currentIds.push(id);
        } else {
            currentIds.splice(index, 1);
        }
        this.packForm.get('serviceIds')?.setValue([...currentIds]);
    }

    isServiceSelected(id: number): boolean {
        return (this.packForm.get('serviceIds')?.value || []).includes(id);
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
        const preview = this.imagePreviews[index];
        if (!preview.startsWith('blob:')) {
            this.uploadedImageNames = this.uploadedImageNames.filter(img => img !== preview);
        } else {
            // Find index in selectedFiles
            const existingCount = this.imagePreviews.filter(p => !p.startsWith('blob:')).length;
            const fileIndex = index - existingCount;
            if (fileIndex >= 0) {
                this.selectedFiles.splice(fileIndex, 1);
            }
        }

        URL.revokeObjectURL(this.imagePreviews[index]);
        this.imagePreviews.splice(index, 1);
    }

    onFileSelected(event: Event): void {
        this.onFilesSelected(event);
    }

    onSubmit(): void {
        this.submitted = true;

        if (this.packForm.invalid) {
            this.errorMessage = 'Please fill all required fields correctly.';
            console.log('Form errors:', this.packForm.errors);
            // Mark all fields as touched to show errors visually
            Object.values(this.packForm.controls).forEach(control => {
                control.markAsTouched();
            });
            return;
        }

        if (!this.packId) {
            this.errorMessage = 'Pack ID is missing.';
            return;
        }

        this.loading = true;
        this.errorMessage = '';

        if (this.selectedFiles.length > 0) {
            this.uploadAllFiles().then((newFileNames) => {
                const finalImages = [...this.uploadedImageNames, ...newFileNames];
                this.submitPack(finalImages);
            }).catch((err) => {
                console.error('Upload failed:', err);
                this.errorMessage = 'Échec du chargement des images.';
                this.loading = false;
            });
        } else {
            this.submitPack(this.uploadedImageNames);
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
            id: this.packId as number,
            name: f.name,
            description: f.description,
            price: Number(f.price),
            discount: Number(f.discount),
            discountPercentage: Number(f.discount),
            category: f.category || 'FAMILY',
            packType: f.category || 'FAMILY',
            serviceIds: f.serviceIds,
            durationDays: Number(f.durationDays || 1),
            maxPersons: Number(f.maxPersons || 1),
            siteId: f.siteId,
            available: f.available,
            isActive: f.available,
            images: imageFileNames.length > 0 ? imageFileNames : this.uploadedImageNames,
            imageUrl: imageFileNames.length > 0 ? imageFileNames[0] : (this.uploadedImageNames.length > 0 ? this.uploadedImageNames[0] : ''),
            image_url: imageFileNames.length > 0 ? imageFileNames[0] : (this.uploadedImageNames.length > 0 ? this.uploadedImageNames[0] : ''),
            image: imageFileNames.length > 0 ? imageFileNames[0] : (this.uploadedImageNames.length > 0 ? this.uploadedImageNames[0] : '')
        };

        this.packService.update(this.packId as number, payload).subscribe({
            next: () => {
                this.loading = false;
                if (this.router.url.includes('/admin')) this.router.navigate(['/admin']);
                else this.router.navigate(['/services/packs']);
            },
            error: (err) => {
                console.error("error pack", err);
                let detail = err.error?.message || err.message || 'Erreur inconnue';
                if (err.error?.errors) {
                    detail += ': ' + Object.entries(err.error.errors).map(([k, v]) => `${k} ${v}`).join(', ');
                }
                this.errorMessage = `Failed to update pack: ${detail}`;
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

    isValidCategory(category: string | undefined): boolean {
        if (!category) return false;
        const validCategories = ['ADVENTURE', 'CUSTOM', 'FAMILY', 'RELAXATION', 'PREMIUM', 'VIP', 'BASIC', 'GROUP', 'STANDARD'];
        return validCategories.includes(category);
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
