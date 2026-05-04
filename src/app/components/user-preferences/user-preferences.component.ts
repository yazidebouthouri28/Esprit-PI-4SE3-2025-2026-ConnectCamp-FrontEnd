import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ProfilePersonalizationService } from '../../services/profile-personalization.service';

interface Option {
    id: string;
    label: string;
}

interface Question {
    id: string;
    category: string;
    title: string;
    options: Option[];
    allowMultiple: boolean;
}

@Component({
    selector: 'app-user-preferences',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './user-preferences.component.html',
    styleUrls: ['./user-preferences.component.css']
})
export class UserPreferencesComponent implements OnInit {
    questions: Question[] = [
        {
            id: 'primary_goal',
            category: 'PRIMARY GOAL',
            title: "What's your main reason for camping?",
            allowMultiple: false,
            options: [
                { id: 'relax', label: 'Escape city life and relax' },
                { id: 'adventure', label: 'Adventure and exploration' },
                { id: 'nature', label: 'Connect with nature' },
                { id: 'family', label: 'Spend quality time with loved ones' },
                { id: 'photography', label: 'Photography and content creation' },
                { id: 'fitness', label: 'Physical fitness and hiking' },
                { id: 'meeting', label: 'Meeting like-minded adventurers' }
            ]
        },
        {
            id: 'experience',
            category: 'DEMOGRAPHIC PROFILE',
            title: 'How would you describe your camping experience?',
            allowMultiple: false,
            options: [
                { id: 'first_timer', label: 'First-timer (never camped before)' },
                { id: 'beginner', label: 'Beginner (1-3 camping trips)' },
                { id: 'intermediate', label: 'Intermediate (comfortable with basics)' },
                { id: 'experienced', label: 'Experienced (regular camper)' },
                { id: 'expert', label: 'Expert (could teach others)' }
            ]
        },
        {
            id: 'style',
            category: 'CAMPING STYLE',
            title: 'What type of camping appeals to you most?',
            allowMultiple: true,
            options: [
                { id: 'beach', label: 'Beachside/coastal camping' },
                { id: 'mountain', label: 'Mountain/highland camping' },
                { id: 'desert', label: 'Desert/Saharan camping' },
                { id: 'forest', label: 'Forest/woodland camping' },
                { id: 'lakeside', label: 'Lakeside camping' },
                { id: 'no_preference', label: 'No strong preference' }
            ]
        },
        {
            id: 'intensity',
            category: 'ADVENTURE VIBE',
            title: "What's your ideal camping vibe?",
            allowMultiple: false,
            options: [
                { id: 'relaxed', label: 'Relaxed & comfortable (glamping, amenities nearby)' },
                { id: 'moderate', label: 'Moderate adventure (basic facilities, some hiking)' },
                { id: 'rustic', label: 'Rustic experience (minimal facilities, nature immersion)' },
                { id: 'extreme', label: 'Extreme adventure (remote locations, challenging terrain)' }
            ]
        },
        {
            id: 'group',
            category: 'GROUP PREFERENCES',
            title: 'How do you prefer to camp?',
            allowMultiple: false,
            options: [
                { id: 'solo', label: 'Solo adventures' },
                { id: 'partner', label: 'With a partner/significant other' },
                { id: 'small_groups', label: 'Small groups (3-5 people)' },
                { id: 'large_groups', label: 'Large groups/family gatherings' },
                { id: 'meeting_new', label: 'Open to meeting new camping companions' }
            ]
        },
        {
            id: 'activities',
            category: 'ACTIVITY INTERESTS',
            title: 'What activities interest you during camping?',
            allowMultiple: true,
            options: [
                { id: 'hiking', label: 'Hiking/trekking' },
                { id: 'water', label: 'Swimming/water activities' },
                { id: 'photography', label: 'Photography' },
                { id: 'stargazing', label: 'Stargazing' },
                { id: 'fishing', label: 'Fishing' },
                { id: 'climbing', label: 'Rock climbing' },
                { id: 'wildlife', label: 'Wildlife observation' },
                { id: 'gathering', label: 'Campfire gatherings/socializing' },
                { id: 'reading', label: 'Reading/quiet relaxation' },
                { id: 'cooking', label: 'Cooking outdoors' }
            ]
        },
        {
            id: 'amenities',
            category: 'COMFORT LEVEL',
            title: 'What amenities are important to you?',
            allowMultiple: true,
            options: [
                { id: 'electricity', label: 'Electricity access' },
                { id: 'water', label: 'Running water/showers' },
                { id: 'restroom', label: 'Restroom facilities' },
                { id: 'wifi', label: 'WiFi connectivity' },
                { id: 'shops', label: 'Nearby shops/restaurants' },
                { id: 'parking', label: 'Parking availability' },
                { id: 'firepits', label: 'Fire pits/BBQ areas' },
                { id: 'none', label: 'None - I prefer wilderness camping' }
            ]
        },
        {
            id: 'distance',
            category: 'TRAVEL DISTANCE',
            title: 'How far are you willing to travel for camping?',
            allowMultiple: false,
            options: [
                { id: 'city', label: 'Within my city/governorate' },
                { id: '2h', label: 'Up to 2 hours away' },
                { id: '4h', label: 'Up to 4 hours away' },
                { id: 'tunisia', label: 'Anywhere in Tunisia' },
                { id: 'roadtrip', label: 'I love road trips - distance doesn\'t matter' }
            ]
        },
        {
            id: 'budget',
            category: 'BUDGET PREFERENCE',
            title: "What's your typical camping budget per night?",
            allowMultiple: false,
            options: [
                { id: 'budget', label: 'Budget-friendly (under 30 TND)' },
                { id: 'moderate', label: 'Moderate (30-70 TND)' },
                { id: 'comfortable', label: 'Comfortable (70-150 TND)' },
                { id: 'premium', label: 'Premium (150+ TND)' }
            ]
        },
        {
            id: 'season',
            category: 'SEASON PREFERENCES',
            title: 'When do you prefer to camp?',
            allowMultiple: true,
            options: [
                { id: 'spring', label: 'Spring (March-May)' },
                { id: 'summer', label: 'Summer (June-August)' },
                { id: 'fall', label: 'Fall (September-November)' },
                { id: 'winter', label: 'Winter (December-February)' },
                { id: 'flexible', label: "I'm flexible with seasons" }
            ]
        },
        {
            id: 'equipment',
            category: 'EQUIPMENT STATUS',
            title: 'Do you own camping equipment?',
            allowMultiple: false,
            options: [
                { id: 'complete', label: 'I have complete camping gear' },
                { id: 'basic', label: 'I have some basic equipment' },
                { id: 'rent_buy', label: 'I need to rent/buy equipment' },
                { id: 'provide', label: 'I prefer campsites that provide equipment' }
            ]
        },
        {
            id: 'special',
            category: 'SPECIAL INTERESTS',
            title: "Are there any specific features you're looking for?",
            allowMultiple: true,
            options: [
                { id: 'pet', label: 'Pet-friendly sites' },
                { id: 'family', label: "Family-friendly with kids' activities" },
                { id: 'accessible', label: 'Accessible facilities' },
                { id: 'eco', label: 'Eco-friendly/sustainable sites' },
                { id: 'cultural', label: 'Cultural/historical locations nearby' },
                { id: 'sports', label: 'Adventure sports facilities' }
            ]
        }
    ];

    currentIndex = 0;
    selections: { [key: string]: string[] } = {};
    isEditMode = false;

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private authService: AuthService,
        private profilePersonalization: ProfilePersonalizationService
    ) { }

    ngOnInit(): void {
        const user = this.authService.getCurrentUser();

        if (!user) {
            this.router.navigate(['/auth/login']);
            return;
        }

        this.isEditMode = this.route.snapshot.queryParamMap.get('edit') === 'true';
        this.selections = this.profilePersonalization.getPreferences(user);

        if (user.role === 'ADMIN' && !this.isEditMode) {
            this.router.navigate(['/admin']);
            return;
        }

        if (this.authService.hasCompletedPreferences(user) && !this.isEditMode) {
            this.router.navigate(['/home']);
            return;
        }

        const firstUnansweredIndex = this.questions.findIndex((question) => !this.selections[question.id]?.length);
        this.currentIndex = firstUnansweredIndex >= 0 ? firstUnansweredIndex : 0;
    }

    getIconPath(id: string): string {
        switch (id) {
            case 'primary_goal': return 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
            case 'experience': return 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253';
            case 'style': return 'M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z';
            case 'intensity': return 'M13 10V3L4 14h7v7l9-11h-7z';
            case 'group': return 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z';
            case 'activities': return 'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
            case 'amenities': return 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z';
            case 'distance': return 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7';
            case 'budget': return 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
            case 'season': return 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z';
            case 'equipment': return 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4';
            case 'special': return 'M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z';
            default: return 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
        }
    }

    get currentQuestion(): Question {
        return this.questions[this.currentIndex];
    }

    get progress(): number {
        return ((this.currentIndex + 1) / this.questions.length) * 100;
    }

    isOptionSelected(optionId: string, customQ?: Question): boolean {
        const questionId = customQ ? customQ.id : this.currentQuestion.id;
        return this.selections[questionId]?.includes(optionId) || false;
    }

    toggleOption(optionId: string, customQ?: Question) {
        const q = customQ || this.currentQuestion;
        if (!this.selections[q.id]) {
            this.selections[q.id] = [];
        }

        if (q.allowMultiple) {
            const index = this.selections[q.id].indexOf(optionId);
            if (index > -1) {
                this.selections[q.id].splice(index, 1);
            } else {
                this.selections[q.id].push(optionId);
            }
        } else {
            this.selections[q.id] = [optionId];
        }
    }

    get isLastQuestion(): boolean {
        return this.currentIndex === this.questions.length - 1;
    }

    get canGoNext(): boolean {
        const q = this.currentQuestion;
        return (this.selections[q.id] && this.selections[q.id].length > 0) || false;
    }

    next() {
        if (this.currentIndex < this.questions.length - 1) {
            this.currentIndex++;
        } else {
            this.finish();
        }
    }

    prev() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
        } else {
            this.router.navigate(['/login']);
        }
    }

    finish() {
        const user = this.authService.getCurrentUser();
        this.profilePersonalization.savePreferences(this.selections, user);
        this.authService.markPreferencesCompleted();
        this.router.navigate([this.isEditMode ? '/profile' : '/home']);
    }
}
