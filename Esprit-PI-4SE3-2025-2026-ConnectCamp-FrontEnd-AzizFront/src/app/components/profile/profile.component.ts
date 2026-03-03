import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { UserService, User } from '../../services/user.service';

interface Post {
    id: number;
    userName: string;
    date: string;
    content: string;
    image?: string;
}

interface Highlight {
    id: number;
    title: string;
    image: string;
}

@Component({
    selector: 'app-profile',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './profile.component.html',
    styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
    currentUser: User | null = null;
    viewedUser: User | null = null;
    activeTab: string = 'adventure';
    isOwnProfile: boolean = false;

    posts: Post[] = [
        {
            id: 1,
            userName: '',
            date: 'December 31, 2025',
            content: 'Just updated my profile picture for the new year adventure!',
            image: 'https://images.unsplash.com/photo-1627820988643-8077d82eed7d?q=80&w=1080'
        },
        {
            id: 2,
            userName: '',
            date: 'December 28, 2025',
            content: 'Incredible experience at Jebel ech Chambi. The view from the top is worth every drop of sweat! 🏔️✨',
            image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1080'
        },
        {
            id: 3,
            userName: '',
            date: 'December 20, 2025',
            content: 'Starting my digital detox week. See you guys back in the wilderness! 🌲📵'
        }
    ];

    follows = [
        { name: 'Sarah Johnson', avatar: 'SJ', role: 'Mountain Guide', bio: 'Exploring the peaks since 2015.' },
        { name: 'Mike Chen', avatar: 'MC', role: 'Outdoor Photographer', bio: 'Capturing nature one frame at a time.' },
        { name: 'Emma Wilson', avatar: 'EW', role: 'Backpacking Expert', bio: 'Living out of a bag 6 months a year.' },
        { name: 'David Brown', avatar: 'DB', role: 'Survivalist', bio: 'Wilderness is my second home.' }
    ];

    highlights: Highlight[] = [
        { id: 1, title: 'Gym', image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=600' },
        { id: 2, title: 'Diving', image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=600' },
        { id: 3, title: 'Gaming', image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=600' },
        { id: 4, title: 'Skydiving', image: 'https://images.unsplash.com/photo-1521033029917-5975a2d7c37e?q=80&w=600' },
        { id: 5, title: 'Books', image: 'https://images.unsplash.com/photo-1491843325424-02fe657702f3?q=80&w=600' },
        { id: 6, title: 'Kilimanjaro', image: 'https://images.unsplash.com/photo-1589118949245-7d38baf380d6?q=80&w=600' },
        { id: 7, title: 'Surf Agadir', image: 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?q=80&w=600' }
    ];

    constructor(
        private route: ActivatedRoute,
        private userService: UserService,
        private location: Location
    ) { }

    ngOnInit() {
        this.currentUser = this.userService.getCurrentUser();

        this.route.params.subscribe(params => {
            const id = params['id'];
            if (id && id !== 'me' && id !== this.currentUser?.id) {
                this.viewedUser = this.userService.getUserById(id) || null;
                this.isOwnProfile = false;
            } else {
                this.viewedUser = this.currentUser;
                this.isOwnProfile = true;
            }

            if (this.viewedUser) {
                this.posts.forEach(post => post.userName = this.viewedUser?.name || 'Explorer');
            }
        });
    }

    setActiveTab(tab: string) {
        this.activeTab = tab;
    }

    addHighlight() {
        // TODO: Implement highlight addition feature
    }

    goBack() {
        this.location.back();
    }
}
