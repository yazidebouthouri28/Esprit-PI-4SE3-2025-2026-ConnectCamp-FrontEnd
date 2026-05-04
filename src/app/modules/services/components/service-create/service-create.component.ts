import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ServiceService } from '../../services/service.service';
import { environment } from '../../../../../environments/environment';
import { CartService } from '../../../../services/cart.service';

@Component({
    selector: 'app-service-create',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './service-create.component.html',
    styleUrls: ['./service-create.component.css']
})
export class ServiceCreateComponent implements OnInit {
    serviceForm: FormGroup;
    loading = false;
    submitted = false;
    errorMessage = '';
    imagePreviews: string[] = [];
    selectedFiles: File[] = [];
    uploadedFileNames: string[] = [];
    private uploadUrl = `${environment.apiUrl}/api/files/upload`;

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
        private http: HttpClient,
        public cartService: CartService
    ) {
        this.serviceForm = this.fb.group({
            name: ['', [Validators.required, Validators.minLength(3)]],
            description: ['', [Validators.required, Validators.maxLength(500)]],
            price: [0, [Validators.required, Validators.min(0.01)]],
            type: ['', Validators.required],
            targetRole: ['USER', Validators.required],
            available: [true],
            campingId: [null]
        });
    }

    ngOnInit(): void { }

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
        if (this.serviceForm.invalid) return;

        this.loading = true;
        this.errorMessage = '';

        if (this.selectedFiles.length > 0) {
            this.uploadAllFiles().then((fileNames) => {
                this.submitService(fileNames);
            }).catch((err) => {
                console.error('Upload failed:', err);
                this.errorMessage = 'Échec du chargement des images.';
                this.loading = false;
            });
        } else {
            this.submitService([]);
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

    private submitService(imageFileNames: string[]): void {
        const payload = { ...this.serviceForm.value };
        if (imageFileNames.length > 0) {
            payload.images = imageFileNames;
        }

        this.serviceService.create(payload).subscribe({
            next: () => {
                this.loading = false;
                if (this.router.url.includes('/admin')) this.router.navigate(['/admin']);
                else this.router.navigate(['/services/list']);
            },
            error: (err) => {
                console.error('Error creating service', err);
                const detail = err.error?.message || err.message || 'Erreur inconnue';
                this.errorMessage = `Erreur (${err.status || '?'}) : ${detail}`;
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
