import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CampsitesManagementComponent } from './campsites-management.component';
import { SiteService } from '../../services/site.service';
import { AuthService } from '../../services/auth.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('CampsitesManagementComponent', () => {
    let component: CampsitesManagementComponent;
    let fixture: ComponentFixture<CampsitesManagementComponent>;
    let mockSiteService: jasmine.SpyObj<SiteService>;
    let mockAuthService: jasmine.SpyObj<AuthService>;

    beforeEach(async () => {
        mockSiteService = jasmine.createSpyObj('SiteService', ['getAllSites', 'getAllSitesAdmin', 'createSite', 'updateSite', 'deleteSite', 'uploadSiteImages']);
        mockAuthService = jasmine.createSpyObj('AuthService', ['getCurrentUser']);

        mockSiteService.getAllSites.and.returnValue(of([]));
        mockSiteService.getAllSitesAdmin.and.returnValue(of([]));
        mockAuthService.getCurrentUser.and.returnValue({ id: '1', name: 'Test User' } as any);

        await TestBed.configureTestingModule({
            imports: [CampsitesManagementComponent, HttpClientTestingModule, FormsModule],
            providers: [
                { provide: SiteService, useValue: mockSiteService },
                { provide: AuthService, useValue: mockAuthService }
            ],
            schemas: [NO_ERRORS_SCHEMA]
        }).compileComponents();

        fixture = TestBed.createComponent(CampsitesManagementComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should not submit form if form is explicitly marked as invalid', () => {
        component.showCreateSiteForm = true;
        component.isCreatingSite = false;
        
        // Mock an invalid form
        const invalidFormMock = { invalid: true };
        
        component.submitCreateSite(invalidFormMock);
        
        expect(component.createSiteError).toBe('Please fix the validation errors before submitting.');
        expect(mockSiteService.createSite).not.toHaveBeenCalled();
    });

    it('should show error if name or city are missing manually (fallback check)', () => {
        component.showCreateSiteForm = true;
        component.isCreatingSite = false;
        component.newSiteForm.name = '   ';
        component.newSiteForm.city = '';
        
        // Passing a valid form mock to let it proceed to manual checks
        const validFormMock = { invalid: false };
        
        component.submitCreateSite(validFormMock);
        
        expect(component.createSiteError).toBe('Site name and city are required.');
        expect(mockSiteService.createSite).not.toHaveBeenCalled();
    });
});
