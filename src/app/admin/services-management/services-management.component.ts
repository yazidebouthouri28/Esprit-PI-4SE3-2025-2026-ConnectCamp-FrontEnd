import { Component } from '@angular/core';

@Component({
  selector: 'app-services-management',
  imports: [],
  templateUrl: './services-management.component.html',
  styleUrl: './services-management.component.css'
})
export class ServicesManagementComponent {
  services = [
    { id: 1, name: 'Expert Wilderness Guide', type: 'Excursion', provider: 'Zakaria Ben Hmida', price: 120, icon: '🧭', usage: 45 },
    { id: 2, name: 'Catering: Desert Oasis', type: 'Gastronomy', provider: 'Oasis Table Co.', price: 85, icon: '🥘', usage: 28 },
    { id: 3, name: 'Extreme Gear Setup', type: 'Logistics', provider: 'CampTech Tunisia', price: 60, icon: '⚒️', usage: 112 },
    { id: 4, name: 'Eco-Photography Workshop', type: 'Workshop', provider: 'Hichem Lens', price: 150, icon: '📸', usage: 15 },
  ];
}
