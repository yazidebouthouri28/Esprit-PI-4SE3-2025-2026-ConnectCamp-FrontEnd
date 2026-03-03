import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Event {
    id: number;
    title: string;
    type: 'workshop' | 'trip' | 'festival';
    date: string;
    time: string;
    location: string;
    image: string;
    participants: number;
    maxParticipants: number;
    price: number;
    organizer: string;
    description?: string;
    sponsors?: string[];
    features?: string[];
}

@Component({
    selector: 'app-event-detail',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './event-detail.component.html',
    styleUrls: ['./event-detail.component.css']
})
export class EventDetailComponent {
    @Input() event: Event | null = null;
    @Output() back = new EventEmitter<void>();

    get progressPercent(): number {
        if (!this.event) return 0;
        return (this.event.participants / this.event.maxParticipants) * 100;
    }

    onBack() {
        this.back.emit();
    }
}
