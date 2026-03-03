import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';

interface Review {
    author: string;
    avatar: string;
    rating: number;
    date: string;
    text: string;
}

interface Campsite {
    id: number;
    name: string;
    location: string;
    images: string[];
    rating: number;
    reviews: number;
    price: number;
    description: string;
    amenities: { icon: string; label: string }[];
    maxGuests: number;
    reviewsList: Review[];
}

@Component({
    selector: 'app-campsite-detail',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './campsite-detail.component.html',
    styleUrls: ['./campsite-detail.component.css']
})
export class CampsiteDetailComponent implements OnInit {
    campsite: Campsite | undefined;

    // Mock data - in a real app this would come from a service
    private campsites: Campsite[] = [
        {
            id: 1,
            name: 'Pine Valley Campground',
            location: 'Yosemite National Park, CA',
            images: [
                'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?q=80&w=1200', // Main
                'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?q=80&w=800',  // Top Right
                'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?q=80&w=800',  // Bottom Right
            ],
            rating: 4.8,
            reviews: 324,
            price: 45,
            description: 'Nestled in the heart of Yosemite, Pine Valley Campground offers a serene escape with breathtaking views of granite cliffs and towering pines. Our spacious ocean-view suites (forest-view cabins) are thoughtfully designed with floor-to-ceilling windows, private terraces, and premium amenities to ensure unparalleled comfort. Unwind in our natural infinity pool that blends seamlessly with the horizon, or indulge in the exclusivity of our private trails, where serenity and breathtaking views come standard.',
            amenities: [
                { icon: '🌲', label: 'Nature Trails' },
                { icon: '🔥', label: 'Campfire Rings' },
                { icon: '🚿', label: 'Hot Showers' },
                { icon: '📶', label: 'WiFi (Lodge)' }
            ],
            maxGuests: 6,
            reviewsList: [
                {
                    author: 'Sarah Jenkins',
                    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100',
                    rating: 5,
                    date: 'Oct 2025',
                    text: 'Absolutely stunning location! The facilities were clean and the staff was incredibly helpful. Waking up to the sound of the river was magical.'
                },
                {
                    author: 'Mike Ross',
                    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=100',
                    rating: 4,
                    date: 'Sep 2025',
                    text: 'Great campsite with plenty of space. The only downside was the weak WiFi signal, but honestly, it was nice to disconnect for a while.'
                }
            ]
        },
        // Fallback for other IDs for demo purposes
        {
            id: 2,
            name: 'Crystal Lake Retreat',
            location: 'Tahoe National Forest, CA',
            images: [
                'https://images.unsplash.com/photo-1763771056927-557d39cb5e02?q=80&w=1200',
                'https://images.unsplash.com/photo-1492648272180-61e45a8d98a7?q=80&w=800',
                'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?q=80&w=800'
            ],
            rating: 4.9,
            reviews: 512,
            price: 55,
            description: 'Experience the crystal clear waters of Lake Tahoe from your doorstep. Crystal Lake Retreat provides a premium camping experience with secluded spots, private beach access, and boat rentals available.',
            amenities: [
                { icon: '🚣', label: 'Boat Rentals' },
                { icon: '🎣', label: 'Fishing' },
                { icon: '🔌', label: 'RV Hookups' },
                { icon: '🛒', label: 'General Store' }
            ],
            maxGuests: 8,
            reviewsList: []
        }
    ];

    constructor(
        private route: ActivatedRoute,
        private location: Location
    ) { }

    ngOnInit() {
        this.route.params.subscribe(params => {
            const id = +params['id'];
            // For demo: if ID exists in mock use it, otherwise use ID 1 as default/fallback
            this.campsite = this.campsites.find(c => c.id === id) || this.campsites[0];
            // Update name if it was a fallback but keep the ID valid for the view
            if (!this.campsites.find(c => c.id === id)) {
                this.campsite = { ...this.campsites[0], id: id, name: 'Sample Campsite ' + id };
            }
        });
    }

    goBack() {
        this.location.back();
    }
}
