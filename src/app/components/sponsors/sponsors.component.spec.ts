import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { environment } from '../../../environments/environment';
import { SponsorsComponent } from './sponsors.component';

describe('SponsorsComponent', () => {
  let component: SponsorsComponent;
  let fixture: ComponentFixture<SponsorsComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SponsorsComponent, HttpClientTestingModule],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(SponsorsComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should categorize sponsors by tier', () => {
    fixture.detectChanges();

    const req = httpMock.expectOne(`${environment.apiUrl}/api/sponsors`);
    expect(req.request.method).toBe('GET');

    req.flush({
      data: [
        {
          id: 1,
          name: 'GoldCo',
          logo: 'gold.png',
          description: 'Gold sponsor',
          website: 'https://gold.example',
          tier: 'GOLD',
        },
        {
          id: 2,
          name: 'SilverCo',
          logo: 'silver.png',
          description: 'Silver sponsor',
          website: 'https://silver.example',
          tier: 'SILVER',
        },
        {
          id: 3,
          name: 'BronzeCo',
          logo: 'bronze.png',
          description: 'Bronze sponsor',
          website: 'https://bronze.example',
          tier: 'BRONZE',
        },
        {
          id: 4,
          name: 'PlatinumCo',
          logo: 'platinum.png',
          description: 'Community partner',
          website: 'https://platinum.example',
          tier: 'PLATINUM',
        },
        {
          id: 5,
          name: 'DiamondCo',
          logo: 'diamond.png',
          description: 'Community partner',
          website: 'https://diamond.example',
          tier: 'DIAMOND',
        }
      ]
    });

    expect(component.goldSponsors.length).toBe(1);
    expect(component.goldSponsors[0].name).toBe('GoldCo');

    expect(component.silverSponsors.length).toBe(1);
    expect(component.silverSponsors[0].name).toBe('SilverCo');

    expect(component.bronzeSponsors.length).toBe(1);
    expect(component.bronzeSponsors[0].name).toBe('BronzeCo');

    expect(component.communityPartners).toEqual([
      { name: 'PlatinumCo', icon: '🤝' },
      { name: 'DiamondCo', icon: '🤝' }
    ]);
  });

  it('should handle missing data as empty lists', () => {
    fixture.detectChanges();

    const req = httpMock.expectOne(`${environment.apiUrl}/api/sponsors`);
    req.flush({});

    expect(component.goldSponsors).toEqual([]);
    expect(component.silverSponsors).toEqual([]);
    expect(component.bronzeSponsors).toEqual([]);
    expect(component.communityPartners).toEqual([]);
  });
});

