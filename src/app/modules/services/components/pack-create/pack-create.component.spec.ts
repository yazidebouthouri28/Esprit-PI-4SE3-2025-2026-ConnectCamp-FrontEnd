import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { PackCreateComponent } from './pack-create.component';
import { PackService } from '../../services/pack.service';
import { ServiceService } from '../../services/service.service';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';

describe('PackCreateComponent', () => {
    let component: PackCreateComponent;
    let fixture: ComponentFixture<PackCreateComponent>;
    let mockPackService: any;
    let mockServiceService: any;

    beforeEach(async () => {
        mockPackService = jasmine.createSpyObj('PackService', ['create']);
        mockServiceService = jasmine.createSpyObj('ServiceService', ['getAll']);

        // Stub services list
        mockServiceService.getAll.and.returnValue(of([
            { id: 1, name: 'Tent', price: 100 },
            { id: 2, name: 'Food', price: 50 }
        ]));

        await TestBed.configureTestingModule({
            imports: [
                PackCreateComponent,
                ReactiveFormsModule,
                RouterTestingModule
            ],
            providers: [
                { provide: PackService, useValue: mockPackService },
                { provide: ServiceService, useValue: mockServiceService }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(PackCreateComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create and load services on init', () => {
        expect(component).toBeTruthy();
        expect(mockServiceService.getAll).toHaveBeenCalled();
        expect(component.services.length).toBe(2);
    });

    it('should toggle service ids correctly', () => {
        // Initially empty
        expect(component.packForm.get('serviceIds')?.value).toEqual([]);

        // Select service 1
        component.toggleService(1);
        expect(component.packForm.get('serviceIds')?.value).toEqual([1]);
        expect(component.isServiceSelected(1)).toBeTrue();

        // Select service 2
        component.toggleService(2);
        expect(component.packForm.get('serviceIds')?.value).toEqual([1, 2]);
        expect(component.isServiceSelected(2)).toBeTrue();

        // Deselect service 1
        component.toggleService(1);
        expect(component.packForm.get('serviceIds')?.value).toEqual([2]);
        expect(component.isServiceSelected(1)).toBeFalse();
    });

    it('should call PackService on valid submit', () => {
        component.packForm.patchValue({
            name: 'Test Pack',
            description: 'Test Pack Description',
            price: 130,
            discount: 10,
            packType: 'COUPLE',
            serviceIds: [1, 2],
            available: true
        });

        expect(component.packForm.valid).toBeTrue();

        mockPackService.create.and.returnValue(of({ id: 10, name: 'Test Pack' }));

        component.onSubmit();

        expect(component.submitted).toBeTrue();
        expect(mockPackService.create).toHaveBeenCalledWith(jasmine.objectContaining({
            name: 'Test Pack',
            price: 130,
            serviceIds: [1, 2]
        }));
        expect(component.loading).toBeFalse();
    });
});
