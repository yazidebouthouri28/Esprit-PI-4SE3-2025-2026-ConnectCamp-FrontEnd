import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css'],
})
export class AdminDashboardComponent {
  @Output() sectionSelected = new EventEmitter<string>();

  stats = [
    { title: 'Global Volume', value: '2,450', change: '+2.4%', trend: 'up', subtitle: 'TOTAL SKU REGISTRY', icon: '📊' },
    { title: 'Market Value', value: '12.5k DT', change: '+5.7%', trend: 'up', subtitle: 'LIQUID ASSET APPRAISAL', icon: '💰' },
    { title: 'Resource Alert', value: '8', change: 'Alert', trend: 'down', subtitle: 'CRITICAL STOCK THRESHOLDS', icon: '⚠️' },
    { title: 'Operational Yield', value: '+14% WoW', change: 'Growth', trend: 'up', subtitle: 'TRANSACTION VELOCITY', icon: '📈' },
  ];

  activities = [
    { user: 'Marie Dubois', action: 'reserved Pine Valley Campground', time: '5 min ago' },
    { user: 'Thomas Martin', action: 'bought a 4-person tent', time: '12 min ago' },
    { user: 'Sophie Laurent', action: "registered for Summer Festival", time: '23 min ago' },
    { user: 'Pierre Rousseau', action: 'posted in the forum', time: "1h ago" },
    { user: 'Julie Bernard', action: 'created an account', time: '2h ago' },
  ];

  openSection(section: string): void {
    this.sectionSelected.emit(section);
  }
}
