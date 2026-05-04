import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CampHighlightsManagementComponent } from './camp-highlights-management.component';
import { CampHighlightService } from '../../services/camp-highlight.service';
import { SiteService } from '../../services/site.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('CampHighlightsManagementComponent', () => {
  let component: CampHighlightsManagementComponent;
  let fixture: ComponentFixture<CampHighlightsManagementComponent>;
  let mockHighlightService: jasmine.SpyObj<CampHighlightService>;
  let mockSiteService: jasmine.SpyObj<SiteService>;

  beforeEach(async () => {
    mockHighlightService = jasmine.createSpyObj('CampHighlightService', ['getHighlightsBySite', 'createHighlight', 'updateHighlight', 'deleteHighlight']);
    mockSiteService = jasmine.createSpyObj('SiteService', ['getAllSites']);

    mockSiteService.getAllSites.and.returnValue(of([{ id: 1, name: 'Test Site' } as any]));
    mockHighlightService.getHighlightsBySite.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [CampHighlightsManagementComponent, HttpClientTestingModule, FormsModule],
      providers: [
        { provide: CampHighlightService, useValue: mockHighlightService },
        { provide: SiteService, useValue: mockSiteService }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(CampHighlightsManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should block save Highlight if form is invalid', () => {
    component.showForm = true;
    const invalidFormMock = { invalid: true };
    
    component.saveHighlight(invalidFormMock);
    
    expect(component.errorMessage).toBe('Please fix the validation errors before saving.');
    expect(mockHighlightService.createHighlight).not.toHaveBeenCalled();
  });

  it('should block save Highlight if campsite is not selected (fallback)', () => {
    component.showForm = true;
    component.currentHighlight.siteId = undefined;
    component.selectedSiteId = null;
    const validFormMock = { invalid: false };
    
    component.saveHighlight(validFormMock);
    
    expect(component.errorMessage).toBe('Please select a campsite before saving highlight.');
    expect(mockHighlightService.createHighlight).not.toHaveBeenCalled();
  });
});
