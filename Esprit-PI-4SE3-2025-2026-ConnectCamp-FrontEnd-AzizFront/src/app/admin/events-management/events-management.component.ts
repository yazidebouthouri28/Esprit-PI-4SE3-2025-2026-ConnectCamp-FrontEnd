import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface AdminEvent {
    id: number;
    title: string;
    type: 'Workshop' | 'Trip' | 'Festival';
    location: string;
    date: string;
    participants: number;
    capacity: number;
    price: number;
    description: string;
    status: 'Published' | 'Draft' | 'Full';
}

@Component({
    selector: 'app-events-admin-management',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './events-management.component.html',
    styleUrls: ['./events-management.component.css']
})
export class EventsAdminManagementComponent {
    activeEventsTab: 'active' | 'requests' = 'active';

    events: AdminEvent[] = [
        { id: 1, title: 'Wilderness Survival', type: 'Workshop', location: 'Zaghouan', date: 'Feb 25, 2026', participants: 18, capacity: 20, price: 85, description: 'Learn fire starting and shelter building in the Atlas foothills.', status: 'Published' },
        { id: 2, title: 'Sahara Star Trek', type: 'Trip', location: 'Douz', date: 'Mar 15, 2026', participants: 12, capacity: 12, price: 450, description: 'A 3-day camel trek under the milky way stars.', status: 'Full' },
        { id: 3, title: 'Eco Festival', type: 'Festival', location: 'Kelibia', date: 'Jul 12, 2026', participants: 342, capacity: 500, price: 45, description: 'Music, food, and environmental workshops by the sea.', status: 'Published' },
        { id: 4, title: 'Photo Quest', type: 'Workshop', location: 'Haouaria', date: 'May 20, 2026', participants: 0, capacity: 15, price: 120, description: 'Capturing the migration of raptors at the tip of Cap Bon.', status: 'Draft' },
    ];

    organizationRequests = [
        { id: 101, requester: 'Sami Mansour', orgName: 'Tunisia Trail Runners', eventTitle: 'Atlas Mountain Ultra', proposedDate: 'Aug 2026', budget: 12000, status: 'pending' },
        { id: 102, requester: 'Maya Ben Ali', orgName: 'Green Youth TN', eventTitle: 'Eco-Camp Initiative', proposedDate: 'Jun 2026', budget: 5000, status: 'pending' },
    ];

    setTab(tab: 'active' | 'requests') {
        this.activeEventsTab = tab;
    }

    getStatusClass(status: string): string {
        switch (status) {
            case 'Published': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'Full': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'Draft': return 'bg-slate-100 text-slate-700 border-slate-200';
            case 'pending': return 'bg-orange-100 text-orange-700 border-orange-200';
            default: return 'bg-gray-100 text-gray-700';
        }
    }
}
