import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { ProtocoleService } from '../../services/protocole.service';

@Component({
    selector: 'app-protocole-create',
    standalone: true,
    imports: [CommonModule, RouterLink, ReactiveFormsModule],
    templateUrl: './protocole-create.component.html',
    styleUrls: ['./protocole-create.component.css']
})
export class ProtocoleCreateComponent implements OnInit {
    protocoleForm!: FormGroup;
    loading = false;
    error: string | null = null;

    constructor(
        private fb: FormBuilder,
        private protocoleService: ProtocoleService,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.protocoleForm = this.fb.group({
            name: ['', [Validators.required, Validators.minLength(5)]],
            description: ['', [Validators.required, Validators.minLength(20)]],
            emergencyType: ['FIRE', Validators.required],
            protocolSteps: this.fb.array([this.createStepControl()]),
            updatedBy: ['Admin']
        });
    }

    get protocolSteps() {
        return this.protocoleForm.get('protocolSteps') as FormArray;
    }

    createStepControl() {
        return this.fb.control('', Validators.required);
    }

    addStep() {
        this.protocolSteps.push(this.createStepControl());
    }

    removeStep(index: number) {
        if (this.protocolSteps.length > 1) {
            this.protocolSteps.removeAt(index);
        }
    }

    onSubmit(): void {
        if (this.protocoleForm.invalid) return;

        this.loading = true;
        this.error = null;

        const val = this.protocoleForm.value;

        // Construct clean payload - 'steps' is now ignored by backend
        const payload = {
            name: val.name,
            description: val.description,
            emergencyType: val.emergencyType,
            stepsList: val.protocolSteps,
            isActive: true
        };

        this.protocoleService.create(payload as any).subscribe({
            next: (createdProtocole) => {
                this.loading = false;
                if (createdProtocole && createdProtocole.id) {
                    this.router.navigate(['/admin/emergency/protocole/detail', createdProtocole.id]);
                } else {
                    this.router.navigate(['/admin']);
                }
            },
            error: (err) => {
                console.error('Error creating protocole', err);
                const detail = err.error?.message || err.message || 'Erreur inconnue';
                this.error = `Erreur (${err.status || '?'}): ${detail}`;
                this.loading = false;
            }
        });
    }
}
