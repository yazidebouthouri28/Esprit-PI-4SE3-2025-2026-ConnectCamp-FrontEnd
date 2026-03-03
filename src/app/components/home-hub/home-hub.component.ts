import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-home-hub',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './home-hub.component.html',
    styleUrls: ['./home-hub.component.css']
})
export class HomeHubComponent {
    featuredCampsites = [
        { id: 1, name: 'Sahara Star Camp', location: 'Douz, Tunisia', image: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?q=80&w=800', price: 120, rating: 4.9 },
        { id: 2, name: 'Azure Haven Resort', location: 'Kelibia, Tunisia', image: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?q=80&w=800', price: 195, rating: 4.8 },
        { id: 3, name: 'Mountain Peak Retreat', location: 'Zaghouan, Tunisia', image: 'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?q=80&w=800', price: 85, rating: 4.7 }
    ];

    upcomingEvents = [
        { id: 1, title: 'Wilderness Survival Skills', type: 'Workshop', date: 'Feb 15', organizer: 'Tunis Adventure', price: 85, image: 'https://images.unsplash.com/photo-1533873984035-25970ab07451?q=80&w=800' },
        { id: 2, title: 'Summer Camping Music Fest', type: 'Festival', date: 'Jul 04', organizer: 'Carthage Sounds', price: 195, image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=800' }
    ];

    reviews = [
        { name: 'Emna Kolsi', role: 'Adventure Guide', rating: 5, avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=150', social: 'instagram', text: 'CampConnect has completely changed how I plan my outdoor trips. The recommendations are spot on!' },
        { name: 'Sami Ben Ammar', role: 'Photography Hobbyist', rating: 5, avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=150', social: 'facebook', text: 'The events are incredibly well-organized. I met so many like-minded nature lovers!' },
        { name: 'Yasmine Dridi', role: 'Eco-Traveler', rating: 5, avatar: 'https://images.unsplash.com/photo-1554151228-14d9def656e4?q=80&w=150', social: 'twitter', text: 'Finally, a platform that understands the beauty of Tunisian wild nature and brings everyone together.' }
    ];

    marketplaceItems = [
        { id: 1, name: 'Family Camping Tent', price: 299, image: 'https://images.unsplash.com/photo-1510672981848-a1c4f1cb5ccf?q=80&w=600' },
        { id: 2, name: 'Sleeping Bag Pro', price: 89, image: 'https://images.unsplash.com/photo-1626252346582-c7721d805e0d?q=80&w=600' }
    ];

    sponsors = [
        { name: 'Decathlon', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Decathlon_Logo.svg/1024px-Decathlon_Logo.svg.png' },
        { name: 'National Geographic', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/National_Geographic_logo.svg/1024px-National_Geographic_logo.svg.png' },
        { name: 'Wild Tunisia', logo: 'https://cdn-icons-png.flaticon.com/512/1042/1042188.png' },
        { name: 'Outdoor Pro', logo: 'https://cdn-icons-png.flaticon.com/512/2921/2921822.png' }
    ];
}
