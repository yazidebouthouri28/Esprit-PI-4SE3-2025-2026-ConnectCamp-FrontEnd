import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { ProtocoleService } from '../../services/protocole.service';
import { Protocole } from '../../models/protocole.model';

@Component({
    selector: 'app-protocole-edit',
    standalone: true,
    imports: [CommonModule, RouterLink, ReactiveFormsModule],
    templateUrl: './protocole-edit.component.html',
    styleUrls: ['./protocole-edit.component.css']
})
export class ProtocoleEditComponent implements OnInit {
    protocoleForm!: FormGroup;
    loading = false;
    saving = false;
    error: string | null = null;
    protocoleId!: number;

    constructor(
        private fb: FormBuilder,
        private protocoleService: ProtocoleService,
        private route: ActivatedRoute,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.protocoleId = Number(this.route.snapshot.paramMap.get('id'));

        this.protocoleForm = this.fb.group({
            id: [this.protocoleId],
            name: ['', [Validators.required, Validators.minLength(5)]],
            description: ['', [Validators.required, Validators.minLength(20)]],
            emergencyType: ['FIRE', Validators.required],
            protocolSteps: this.fb.array([]),
            updatedBy: ['Admin']
        });

        this.loadData();
    }

    loadData(): void {
        this.loading = true;
        this.protocoleService.getById(this.protocoleId).subscribe({
            next: (data) => {
                // Populate form
                this.protocoleForm.patchValue({
                    name: data.name,
                    description: data.description,
                    emergencyType: data.emergencyType
                });

                // Populate steps array
                const stepsFormArray = this.protocoleForm.get('protocolSteps') as FormArray;
                data.stepsList.forEach(step => {
                    stepsFormArray.push(this.fb.control(step, Validators.required));
                });

                if (data.stepsList.length === 0) {
                    this.addStep();
                }

                this.loading = false;
            },
            error: (err) => {
                this.error = 'Failed to load protocol data.';
                this.loading = false;
            }
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

        this.saving = true;
        this.error = null;

        const val = this.protocoleForm.value;
        const payload = {
            id: this.protocoleId,
            name: val.name,
            description: val.description,
            emergencyType: val.emergencyType,
            stepsList: val.protocolSteps,
            isActive: true
        };

        this.protocoleService.update(this.protocoleId, payload as any).subscribe({
            next: () => {
                this.saving = false;
                this.router.navigate(['/admin/emergency/protocole/detail', this.protocoleId]);
            },
            error: (err) => {
                console.error('Error updating protocole', err);
                this.error = 'Failed to update safety protocol.';
                this.saving = false;
            }
        });
    }
}
