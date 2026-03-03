import { Component } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';

interface StatCard {
    label: string;
    value: string;
    trend: string;
    trendUp: boolean;
    icon: string;
    color: string;
}

@Component({
    selector: 'app-reports-management',
    standalone: true,
    imports: [CommonModule, NgClass],
    templateUrl: './reports-management.component.html',
    styleUrl: './reports-management.component.css'
})
export class ReportsManagementComponent {
    stats: StatCard[] = [
        { label: 'Total Revenue', value: '45,280 DT', trend: '+12.5%', trendUp: true, icon: '💰', color: 'emerald' },
        { label: 'Active Bookings', value: '184', trend: '+8.2%', trendUp: true, icon: '📅', color: 'blue' },
        { label: 'New Members', value: '124', trend: '+15.4%', trendUp: true, icon: '👥', color: 'purple' },
        { label: 'Gear Sales', value: '12,450 DT', trend: '-2.1%', trendUp: false, icon: '📦', color: 'orange' },
    ];

    topProducts = [
        { name: 'Professional 4-Season Tent', sales: 42, revenue: '8,400 DT' },
        { name: 'Ultra-Light Sleeping Bag', sales: 38, revenue: '4,560 DT' },
        { name: 'Portable Gas Stove', sales: 25, revenue: '1,250 DT' },
    ];

    popularCampsites = [
        { name: 'Zaghouan Mountain Retreat', bookings: 112, rating: 4.9 },
        { name: 'Ain Draham Forest Camp', bookings: 98, rating: 4.8 },
        { name: 'Beni M Tir Eco-Village', bookings: 76, rating: 4.7 },
    ];

    moderationReports = [
        { id: 'REP-001', type: 'Toxic Behavior', user: 'Slim_22', reporter: 'Ali_K', status: 'Resolved', date: '2026-02-15', description: 'Harassing other campers in the community hub.' },
        { id: 'REP-002', type: 'Sabotage', user: 'Unknown_Guest', reporter: 'System_Audit', status: 'Crucial', date: '2026-02-16', description: 'Attempting to inject malicious scripts into marketplace listings.' },
        { id: 'REP-003', type: 'Toxic Behavior', user: 'Zied_H', reporter: 'Sarah_M', status: 'Under Review', date: '2026-02-16', description: 'Spreading misinformation and inciting conflict in event comments.' },
    ];
    marketShare = [
        { label: 'Equipment', value: 45, color: 'bg-emerald-500' },
        { label: 'Expeditions', value: 32, color: 'bg-[#1a2e1a]' },
        { label: 'Real Estate', value: 23, color: 'bg-amber-500' }
    ];
}
