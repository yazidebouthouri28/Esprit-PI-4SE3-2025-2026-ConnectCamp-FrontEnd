import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

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
export class UserPreferencesComponent {
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

    constructor(private router: Router) { }

    get currentQuestion(): Question {
        return this.questions[this.currentIndex];
    }

    get progress(): number {
        return ((this.currentIndex + 1) / this.questions.length) * 100;
    }

    isOptionSelected(optionId: string): boolean {
        const questionId = this.currentQuestion.id;
        return this.selections[questionId]?.includes(optionId) || false;
    }

    toggleOption(optionId: string) {
        const q = this.currentQuestion;
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
        // Get current user email for account-specific tracking
        const userJson = localStorage.getItem('campconnect_user');
        if (userJson) {
            const user = JSON.parse(userJson);
            localStorage.setItem(`campconnect_preferences_done_${user.email}`, 'true');
        }

        this.router.navigate(['/home']);
    }
}
