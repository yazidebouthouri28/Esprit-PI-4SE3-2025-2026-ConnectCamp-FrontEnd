import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { AccountProfileService } from './account-profile.service';
import { User as SessionUser } from '../models/api.models';

export interface User {
    id: string;
    name: string;
    avatar: string;
    role: string;
    email?: string;
    status?: 'online' | 'offline' | 'typing';
    lastSeen?: string;
    bio?: string;
    coverImage?: string;
    location?: string;
    hashtags?: string[];
    followers?: string;
    gallery?: string[];
    achievements?: { title: string; icon: string; description?: string; date?: string }[];
    experiencePoints?: number;
    level?: number;
    earnedBadges?: any[];
}

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private fallbackCurrentUser: User = {
        id: 'me',
        name: 'Ahmed Ben Salem',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=150',
        role: 'Adventure Guide',
        email: 'ahmed@connectcamp.tn',
        bio: 'Professional guide with 10 years of experience in the Tunisian mountains.',
        coverImage: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1200',
        location: 'Hammamet, Tunisia',
        hashtags: ['#Hiking', '#Guide'],
        followers: '1.2K',
        gallery: [
            'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?q=80&w=400',
            'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?q=80&w=400',
            'https://images.unsplash.com/photo-1496062031456-07b8f162a322?q=80&w=400',
            'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?q=80&w=400'
        ],
        achievements: [
            { title: 'Peak Conqueror', icon: '🏔️', description: 'Reached the summit of 5 different Tunisian peaks.', date: 'Oct 2025' },
            { title: 'Night Owl', icon: '🦉', description: 'Completed 10 solo night camping trips in the Tunisian desert.', date: 'Dec 2025' }
        ]
    };

    private mockUsers: User[] = [
        {
            id: '1',
            name: 'Yassine Trabelsi',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150',
            role: 'Gear Expert',
            bio: 'Gear specialist and outdoor enthusiast. If you need equipment advice for the Sahara, I am your guy!',
            coverImage: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1200',
            location: 'Tunis, Tunisia',
            hashtags: ['#Gear', '#Camping'],
            followers: '5k+',
            gallery: [
                'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?q=80&w=400',
                'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?q=80&w=400'
            ],
            achievements: [{ title: 'Peak Conqueror', icon: '🏔️' }, { title: 'First Aid', icon: '🩹' }]
        },
        {
            id: '2',
            name: 'Mariem Guezguez',
            avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150',
            role: 'Survivalist',
            bio: 'Exploring the wild side of Tunisia.',
            coverImage: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?q=80&w=1200',
            location: 'Sousse, Tunisia',
            hashtags: ['#Survival', '#Wild'],
            followers: '2.5k'
        },
        {
            id: '3',
            name: 'Selim Riahi',
            avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=150',
            role: 'Trail Photographer',
            bio: 'Capturing the beauty of Tunisian landscapes.',
            coverImage: 'https://images.unsplash.com/photo-1496062031456-07b8f162a322?q=80&w=1200',
            location: 'Bizerte, Tunisia',
            hashtags: ['#Photography', '#Nature'],
            followers: '10k'
        }
    ];

    constructor(
        private authService: AuthService,
        private accountProfile: AccountProfileService
    ) { }

    getCurrentUser(): User {
        return this.mapSessionUser(this.authService.getCurrentUser()) || this.fallbackCurrentUser;
    }

    getUserById(id: string): User | undefined {
        const currentUser = this.getCurrentUser();
        if (id === 'me' || id === currentUser.id) return currentUser;
        return this.mockUsers.find(u => u.id === id);
    }

    private mapSessionUser(user: SessionUser | null): User | null {
        if (!user) {
            return null;
        }

        const name = user.name || user.username || 'ConnectCamp User';
        const avatar =
            this.accountProfile.resolveStoredImageUrl(user.avatar)
            || this.accountProfile.buildGeneratedAvatar(name);
        const coverImage =
            this.accountProfile.resolveStoredImageUrl(user.coverImage)
            || 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1200';

        return {
            id: String(user.id),
            name,
            avatar,
            role: user.role,
            email: user.email,
            bio: user.bio || 'ConnectCamp member.',
            coverImage,
            location: user.location || user.country || 'Tunisia',
            hashtags: [],
            followers: '0',
            gallery: [avatar],
            achievements: [],
            experiencePoints: user.experiencePoints || 0,
            level: user.level || 1,
            earnedBadges: user.earnedBadges || []
        };
    }

    // Aliases used by Farah's modules (emergency & services)
    getLoggedInUser(): any | null {
        return this.authService.getCurrentUser() || null;
    }

    isAdmin(): boolean { return this.authService.isAdmin(); }
    isOrganizer(): boolean { return this.authService.isOrganizer(); }
    isParticipant(): boolean { return this.authService.hasRole('PARTICIPANT'); }
    isUser(): boolean { return this.authService.hasRole('USER') || this.authService.hasRole('CAMPER') || this.authService.isClient(); }
}
