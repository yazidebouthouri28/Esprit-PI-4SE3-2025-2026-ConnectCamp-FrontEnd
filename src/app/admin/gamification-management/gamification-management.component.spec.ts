import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GamificationManagementComponent } from './gamification-management.component';
import { GamificationService } from '../../services/gamification.service';
import { AuthService } from '../../services/auth.service';
import { of } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('GamificationManagementComponent', () => {
    let component: GamificationManagementComponent;
    let fixture: ComponentFixture<GamificationManagementComponent>;
    let gamificationService: jasmine.SpyObj<GamificationService>;

    beforeEach(async () => {
        const gamificationSpy = jasmine.createSpyObj('GamificationService',
            ['getBadges', 'getMedals', 'createBadge', 'createMedal']);
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

        gamificationService.getBadges.and.returnValue(of([]));
        gamificationService.getMedals.and.returnValue(of([]));
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should show error if name is too short', () => {
        component.modalType = 'badge';
        component.currentBadge = { name: 'A' };
        component.saveBadge();
        expect(component.modalErrorMessage).toBe('Le nom doit contenir au moins 2 caractères.');
    });

    it('should call createBadge when valid badge is submitted', () => {
        component.modalType = 'badge';
        component.currentBadge = { name: 'Super Hero', icon: 'badge1.png' };
        gamificationService.createBadge.and.returnValue(of({} as any));

        component.saveBadge();

        expect(gamificationService.createBadge).toHaveBeenCalled();
        expect(component.modalErrorMessage).toBe('');
    });
});
