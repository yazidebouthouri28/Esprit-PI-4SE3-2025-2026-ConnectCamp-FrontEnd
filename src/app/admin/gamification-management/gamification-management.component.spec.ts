import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GamificationManagementComponent } from './gamification-management.component';
import { GamificationService } from '../../services/gamification.service';
import { AuthService } from '../../services/auth.service';
import { of, throwError } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('GamificationManagementComponent', () => {
    let component: GamificationManagementComponent;
    let fixture: ComponentFixture<GamificationManagementComponent>;
    let gamificationService: jasmine.SpyObj<GamificationService>;
    let authService: jasmine.SpyObj<AuthService>;

    beforeEach(async () => {
        const gamificationSpy = jasmine.createSpyObj('GamificationService', ['getAll', 'create', 'update', 'delete']);
        const authSpy = jasmine.createSpyObj('AuthService', ['hasRole', 'getCurrentUser']);

        await TestBed.configureTestingModule({
            imports: [GamificationManagementComponent, FormsModule, HttpClientTestingModule],
            providers: [
                { provide: GamificationService, useValue: gamificationSpy },
                { provide: AuthService, useValue: authSpy }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(GamificationManagementComponent);
        component = fixture.componentInstance;
        gamificationService = TestBed.inject(GamificationService) as jasmine.SpyObj<GamificationService>;
        authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;

        gamificationService.getAll.and.returnValue(of([]));
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should show error if name is too short', () => {
        component.currentBadge.name = 'A';
        component.saveBadge();
        expect(component.modalErrorMessage).toBe('Le nom doit contenir au moins 2 caractères.');
    });

    it('should show error if points are negative', () => {
        component.currentBadge.name = 'Valid Name';
        component.currentBadge.pointsValue = -10;
        component.saveBadge();
        expect(component.modalErrorMessage).toBe('Les points ne peuvent pas être négatifs.');
    });

    it('should call create when valid badge is submitted', () => {
        component.currentBadge = { name: 'Super Hero', pointsValue: 500, icon: '🌟', description: 'Test' };
        gamificationService.create.and.returnValue(of({} as any));

        component.saveBadge();

        expect(gamificationService.create).toHaveBeenCalled();
        expect(component.modalErrorMessage).toBe('');
    });
});
