import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EventsAdminManagementComponent } from './events-management.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { SiteService } from '../../services/site.service';
import { GamificationService } from '../../services/gamification.service';
import { of } from 'rxjs';
import { ActivatedRoute } from '@angular/router';

describe('EventsAdminManagementComponent', () => {
    let component: EventsAdminManagementComponent;
    let fixture: ComponentFixture<EventsAdminManagementComponent>;

    beforeEach(async () => {
        const authSpy = jasmine.createSpyObj('AuthService', ['hasRole', 'getCurrentUser', 'isAuthenticated']);
        const siteSpy = jasmine.createSpyObj('SiteService', ['getAllSites']);
        const gamificationSpy = jasmine.createSpyObj('GamificationService', ['getBadges']);

        authSpy.getCurrentUser.and.returnValue({ id: 1, name: 'Admin', role: 'ADMIN' });
        siteSpy.getAllSites.and.returnValue(of([]));
        gamificationSpy.getBadges.and.returnValue(of([]));

        await TestBed.configureTestingModule({
            imports: [EventsAdminManagementComponent, FormsModule, HttpClientTestingModule],
            providers: [
                { provide: AuthService, useValue: authSpy },
                { provide: SiteService, useValue: siteSpy },
                { provide: GamificationService, useValue: gamificationSpy },
                {
                    provide: ActivatedRoute,
                    useValue: { queryParams: of({}) }
                }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(EventsAdminManagementComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should show error if title is too short', () => {
        component.newEvent.picture = 'dummy.jpg';
        component.newEvent.title = 'Hi'; // Less than 3
        component.submitEvent();
        expect(component.modalErrorMessage).toBe('Le titre doit contenir au moins 3 caractères.');
    });

    it('should show error if end date is before start date', () => {
        component.newEvent.picture = 'dummy.jpg';
        component.newEvent.title = 'Valid Title';
        component.newEvent.startDate = '2026-12-01T10:00';
        component.newEvent.endDate = '2026-11-01T10:00';
        component.submitEvent();
        expect(component.modalErrorMessage).toBe('La date de début doit être antérieure à la date de fin.');
    });

    it('should show error if price is negative', () => {
        component.newEvent.picture = 'dummy.jpg';
        component.newEvent.title = 'Valid Title';
        component.newEvent.isFree = false;
        component.newEvent.price = -5;
        component.submitEvent();
        expect(component.modalErrorMessage).toBe('Le prix ne peut pas être négatif.');
    });
});
