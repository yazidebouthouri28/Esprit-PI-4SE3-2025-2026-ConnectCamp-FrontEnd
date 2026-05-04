import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { AlerteCreateComponent } from './alerte-create.component';
import { AlerteService } from '../../services/alerte.service';
import { UserService } from '../../../../services/user.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';

// Mock Leaflet 'L' globally for testing
(window as any).L = {
    map: () => ({
        setView: jasmine.createSpy('setView').and.returnValue({
            on: jasmine.createSpy('on')
        }),
        on: jasmine.createSpy('on')
    }),
    tileLayer: () => ({
        addTo: jasmine.createSpy('addTo')
    }),
    marker: () => ({
        addTo: jasmine.createSpy('addTo')
    })
};

describe('AlerteCreateComponent', () => {
    let component: AlerteCreateComponent;
    let fixture: ComponentFixture<AlerteCreateComponent>;
    let mockAlerteService: any;
    let mockUserService: any;

    beforeEach(async () => {
        mockAlerteService = jasmine.createSpyObj('AlerteService', ['create']);
        mockUserService = jasmine.createSpyObj('UserService', ['getLoggedInUser']);

        // Stub logged in user
        mockUserService.getLoggedInUser.and.returnValue({ id: 1, name: 'Test Camper', role: 'CAMPER' });

        await TestBed.configureTestingModule({
            imports: [
                AlerteCreateComponent, // Standalone component
                ReactiveFormsModule,
                HttpClientTestingModule,
                RouterTestingModule
            ],
            providers: [
                { provide: AlerteService, useValue: mockAlerteService },
                { provide: UserService, useValue: mockUserService }
            ]
        }).compileComponents();

        // Mock geolocation to avoid test hangs
        spyOn(navigator.geolocation, 'getCurrentPosition').and.callFake(
            (successCallback, errorCallback) => {
                // We will just do nothing to keep tests fast, or mock success
            }
        );

        fixture = TestBed.createComponent(AlerteCreateComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('form should be invalid when empty', () => {
        expect(component.alertForm.valid).toBeFalsy();
    });

    it('should validate form and call service on submit', () => {
        component.alertForm.patchValue({
            title: 'Valid Title SOS',
            description: 'Need help urgently here!',
            emergencyType: 'MEDICAL',
            severity: 'HIGH',
            location: 'Test Location',
            latitude: 10,
            longitude: 20
        });

        expect(component.alertForm.valid).toBeTruthy();

        mockAlerteService.create.and.returnValue(of({ id: 1, status: 'ACTIVE' }));

        component.onSubmit();

        expect(component.submitted).toBeTrue();
        expect(mockAlerteService.create).toHaveBeenCalled();
        expect(component.loading).toBeFalse();
    });

    it('should not call service if form is invalid on submit', () => {
        component.alertForm.patchValue({ title: 'Short' }); // Invalid: requires minLength(5)

        component.onSubmit();

        expect(component.alertForm.invalid).toBeTrue();
        expect(mockAlerteService.create).not.toHaveBeenCalled();
    });
});
