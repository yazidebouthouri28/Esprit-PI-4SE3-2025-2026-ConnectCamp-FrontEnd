import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Sponsor {
    name: string;
    logo: string;
    description: string;
    website: string;
    tier: 'gold' | 'silver' | 'bronze' | 'community';
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
export class SponsorsComponent {

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

    goldSponsors: Sponsor[] = [
        {
            name: 'Ooredoo Tunisia',
            logo: 'https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?q=80&w=200',
            description: 'Leading telecom operator in Tunisia, connecting adventurers across the country with reliable network coverage even in remote camping locations.',
            website: 'https://www.ooredoo.tn',
            tier: 'gold',
        },
        {
            name: 'Tunisie Telecom',
            logo: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=200',
            description: 'Tunisia\'s national telecommunications company, proud supporter of outdoor activities and eco-tourism across all 24 governorates.',
            website: 'https://www.tunisietelecom.tn',
            tier: 'gold',
        },
        {
            name: 'ONTT – Office National du Tourisme',
            logo: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=200',
            description: 'The National Tourism Office of Tunisia, promoting eco-tourism, adventure travel, and sustainable camping throughout Tunisia\'s diverse landscapes.',
            website: 'https://www.tourisme.gov.tn',
            tier: 'gold',
        },
    ];

    silverSponsors: Sponsor[] = [
        {
            name: 'Baya Camping Gear',
            logo: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?q=80&w=200',
            description: 'Tunisian-made outdoor equipment designed for the Mediterranean climate. Tents, sleeping bags, and hiking gear built to last.',
            website: '#',
            tier: 'silver',
        },
        {
            name: 'Carthage Adventures',
            logo: 'https://images.unsplash.com/photo-1551632811-561732d1e306?q=80&w=200',
            description: 'Premier adventure tour operator offering guided hiking, mountain biking, and camping excursions from Tabarka to Djerba.',
            website: '#',
            tier: 'silver',
        },
        {
            name: 'Délice Danone',
            logo: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?q=80&w=200',
            description: 'Tunisia\'s leading dairy brand, fueling campers and hikers with nutritious snacks and refreshing drinks on every trail.',
            website: '#',
            tier: 'silver',
        },
        {
            name: 'Aziza Supermarket',
            logo: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?q=80&w=200',
            description: 'Your one-stop shop for camping supplies, trail snacks, and outdoor essentials available in over 100 locations across Tunisia.',
            website: '#',
            tier: 'silver',
        },
    ];

    bronzeSponsors: Sponsor[] = [
        {
            name: 'Café Meddeb',
            logo: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=200',
            description: 'Handcrafted Tunisian coffee blends perfect for early morning campfire brews.',
            website: '#',
            tier: 'bronze',
        },
        {
            name: 'Nabeul Pottery Co.',
            logo: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?q=80&w=200',
            description: 'Traditional Tunisian pottery and artisan crafts, bringing local culture to every campsite.',
            website: '#',
            tier: 'bronze',
        },
        {
            name: 'Sahara Solar',
            logo: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?q=80&w=200',
            description: 'Portable solar chargers and eco-friendly power solutions for off-grid camping.',
            website: '#',
            tier: 'bronze',
        },
        {
            name: 'Medina Maps',
            logo: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=200',
            description: 'Detailed trail maps and GPS guides for Tunisia\'s most scenic hiking routes.',
            website: '#',
            tier: 'bronze',
        },
        {
            name: 'Djerba Watersports',
            logo: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=200',
            description: 'Kayaking, windsurfing, and beach camping experiences on the beautiful island of Djerba.',
            website: '#',
            tier: 'bronze',
        },
    ];

    communityPartners: { name: string; icon: string }[] = [
        { name: 'Scouts Tunisiens', icon: '⚜️' },
        { name: 'Association Tourisme Vert', icon: '🌿' },
        { name: 'Club Alpin Tunisien', icon: '🏔️' },
        { name: 'SOS Nature Tunisie', icon: '🌍' },
        { name: 'Fédération Randonnée', icon: '🥾' },
        { name: 'Youth Hostel Tunisia', icon: '🏠' },
        { name: 'Éco-Village Sejnane', icon: '🏕️' },
        { name: 'Patrimoine Vert', icon: '🌳' },
    ];
}
