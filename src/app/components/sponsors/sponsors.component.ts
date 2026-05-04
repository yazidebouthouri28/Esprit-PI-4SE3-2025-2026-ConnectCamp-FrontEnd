import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface Sponsor {
    id: number;
    name: string;
    logo: string;
    description: string;
    website: string;
    tier: 'GOLD' | 'SILVER' | 'BRONZE' | 'PLATINUM' | 'DIAMOND' | 'TITLE_SPONSOR';
}
interface SponsorTier {
    name: string;
    icon: string;
    price: string;
    description: string;
    perks: string[];
}

@Component({
    selector: 'app-sponsors',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './sponsors.component.html',
    styleUrls: ['./sponsors.component.css'],
})
export class SponsorsComponent implements OnInit {

    goldSponsors: Sponsor[] = [];
    silverSponsors: Sponsor[] = [];
    bronzeSponsors: Sponsor[] = [];
    communityPartners: { name: string; icon: string }[] = [];

    constructor(private http: HttpClient) {}

ngOnInit() {
    console.log('Sponsors component loaded');
    this.http.get<any>(`${environment.apiUrl}/api/sponsors`).subscribe({
  next: (res) => {
    console.log('Sponsors response:', res);
    const sponsors: Sponsor[] = res.data ?? [];
    console.log('Sponsors array:', sponsors);
    console.log('Gold:', sponsors.filter(s => s.tier === 'GOLD'));
    this.goldSponsors   = sponsors.filter(s => s.tier === 'GOLD');
    this.silverSponsors = sponsors.filter(s => s.tier === 'SILVER');
    this.bronzeSponsors = sponsors.filter(s => s.tier === 'BRONZE');
    this.communityPartners = sponsors
        .filter(s => s.tier === 'PLATINUM' || s.tier === 'DIAMOND')
        .map(s => ({ name: s.name, icon: '🤝' }));
},
error: (err) => console.error('Failed to load sponsors', err)
    });
}

    sponsorTiers: SponsorTier[] = [
        {
            name: 'Gold',
            icon: '🥇',
            price: '5 000 DT',
            description: 'Premium visibility and maximum impact',
            perks: [
                'Oversized logo on all event materials',
                'Dedicated booth at all ConnectCamp events',
                'Featured in homepage hero banner',
                'Social media spotlight (10 posts)',
                'Exclusive speaking slot at events',
            ],
        },
        {
            name: 'Silver',
            icon: '🥈',
            price: '2 500 DT',
            description: 'Strong presence across the platform',
            perks: [
                'Large logo on event materials',
                'Shared booth space at events',
                'Featured on sponsors page',
                'Social media mentions (5 posts)',
                'Logo on event merchandise',
            ],
        },
        {
            name: 'Bronze',
            icon: '🥉',
            price: '1 000 DT',
            description: 'Great entry-level sponsorship',
            perks: [
                'Logo on sponsors page',
                'Mention in event newsletters',
                'Social media mention (2 posts)',
                'Name on event program',
            ],
        },
    ];
}