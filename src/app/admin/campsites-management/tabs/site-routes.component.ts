import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouteGuideService } from '../../../services/route-guide.service';
import { RouteGuide } from '../../../models/camping.models';

@Component({
    selector: 'app-site-routes',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="space-y-8 animate-fade-in">
      <div class="flex justify-between items-center">
        <div>
          <h3 class="text-lg font-black text-[#1a2e1a]">Pre-calculated Itineraries</h3>
          <p class="text-xs text-[#617152] font-medium">Define distance, duration, and instructions from major cities.</p>
        </div>
        <button (click)="showForm = true" class="px-4 py-2 bg-[#2C4A3C] text-white rounded-lg text-xs font-black uppercase tracking-widest hover:bg-[#1a2e1a] transition-all">
          New Route
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div *ngFor="let route of routes" class="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group border-l-4 border-l-emerald-500">
          <div class="flex justify-between items-start mb-4">
            <div>
              <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">From</p>
              <h4 class="text-xl font-black text-[#1a2e1a]">{{ route.originCity }}</h4>
            </div>
            <div class="text-right">
              <p class="font-black text-[#1a2e1a]">{{ route.distanceKm }} KM</p>
              <p class="text-[10px] font-bold text-gray-400 capitalize">{{ route.durationMin }} Min Drive</p>
            </div>
          </div>
          <div class="py-3 border-y border-gray-50 mb-4">
             <p class="text-xs text-[#617152] font-medium">Map Link: <a [href]="route.mapUrl" target="_blank" class="text-blue-500 hover:underline">View on Google Maps</a></p>
          </div>
          <div class="space-y-2">
            <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Quick Instructions</p>
            <p class="text-xs text-[#1a2e1a] font-medium italic">{{ route.instructions }}</p>
          </div>
        </div>
      </div>

      <!-- Add Route Modal -->
      <div *ngIf="showForm" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-2xl p-8 max-w-lg w-full shadow-2xl space-y-6">
          <h2 class="text-xl font-bold text-[#1a2e1a]">New Route Guide</h2>
          <div class="grid grid-cols-2 gap-4">
            <div class="col-span-2">
              <label class="block text-xs font-bold text-gray-400 uppercase mb-1">Origin City</label>
              <input [(ngModel)]="newRoute.originCity" placeholder="Ex: Tunis, Sousse..." class="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm outline-none">
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-400 uppercase mb-1">Distance (KM)</label>
              <input type="number" [(ngModel)]="newRoute.distanceKm" class="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm outline-none">
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-400 uppercase mb-1">Duration (Min)</label>
              <input type="number" [(ngModel)]="newRoute.durationMin" class="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm outline-none">
            </div>
            <div class="col-span-2">
              <label class="block text-xs font-bold text-gray-400 uppercase mb-1">Google Maps URL</label>
              <input [(ngModel)]="newRoute.mapUrl" class="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm outline-none">
            </div>
            <div class="col-span-2">
              <label class="block text-xs font-bold text-gray-400 uppercase mb-1">Instructions</label>
              <textarea [(ngModel)]="newRoute.instructions" rows="2" class="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm outline-none"></textarea>
            </div>
          </div>
          <div class="flex justify-end gap-3 pt-4">
            <button (click)="showForm = false" class="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-700">Cancel</button>
            <button (click)="saveRoute()" class="px-6 py-2 bg-[#2C4A3C] text-white rounded-lg text-sm font-bold">Save Route</button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class SiteRoutesComponent implements OnInit, OnChanges {
    @Input() siteId!: number;
    routes: RouteGuide[] = [];
    showForm = false;
    newRoute: Partial<RouteGuide> = {};

    constructor(private routeService: RouteGuideService) { }

    ngOnInit() {
        this.loadRoutes();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['siteId'] && !changes['siteId'].firstChange) {
            this.loadRoutes();
        }
    }

    loadRoutes() {
        if (!this.siteId) {
            this.routes = [];
            return;
        }
        this.routeService.getRoutesBySite(this.siteId).subscribe(r => this.routes = r);
    }

    saveRoute() {
        if (this.newRoute.originCity && this.newRoute.distanceKm) {
            const route = {
                ...this.newRoute,
                durationMin: this.newRoute.durationMin ?? 0,
                estimatedDurationMinutes: this.newRoute.durationMin ?? 0,
                siteId: this.siteId
            } as RouteGuide;
            this.routeService.createRoute(route).subscribe(() => {
                this.loadRoutes();
                this.showForm = false;
                this.newRoute = {};
            });
        }
    }
}
