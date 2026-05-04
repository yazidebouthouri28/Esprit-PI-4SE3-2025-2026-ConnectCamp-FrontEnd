import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { InterventionService } from '../../services/intervention.service';

@Component({
    selector: 'app-intervention-create',
    standalone: true,
    imports: [CommonModule, RouterLink, ReactiveFormsModule],
    templateUrl: './intervention-create.component.html',
    styleUrls: ['./intervention-create.component.css']
})
export class InterventionCreateComponent implements OnInit {
    interventionForm!: FormGroup;
    loading = false;
    error: string | null = null;
    alertId: number | null = null;

    constructor(
        private fb: FormBuilder,
        private interventionService: InterventionService,
        private router: Router,
        private route: ActivatedRoute
    ) { }

    ngOnInit(): void {
        this.alertId = Number(this.route.snapshot.paramMap.get('alertId'));

        this.interventionForm = this.fb.group({
            type: ['MEDICAL', Validators.required],
            description: ['', [Validators.required, Validators.minLength(10)]],
            status: ['ON_SITE', Validators.required],
            equipe: ['', Validators.required],
            alerteId: [this.alertId, Validators.required]
        });
    }

    onSubmit(): void {
        if (this.interventionForm.invalid) return;

        this.loading = true;
        this.error = null;

        this.interventionService.create(this.interventionForm.value).subscribe({
            next: () => {
                this.loading = false;
                this.router.navigate(['/admin/emergency/detail', this.alertId]);
            },
            error: (err) => {
                console.error('Error creating intervention', err);
                this.error = 'Failed to create intervention.';
                this.loading = false;
            }
        });
    }
}
