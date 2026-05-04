import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CampingServiceService } from '../../services/camping-service.service';
import { EventServiceEntityService } from '../../services/event-service-entity.service';
import { CampingService } from '../../models/camping-service.model';
import { EventServiceEntityRequest } from '../../models/event-service-entity.model';
import { Event } from '../../models/event.model';

@Component({
    selector: 'app-b2b-service-picker',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-forest/80 backdrop-blur-md">
      <div class="bg-white w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden border border-white/20">
        <!-- Header -->
        <div class="bg-forest p-10 text-white relative">
          <button (click)="onClose()" class="absolute top-8 right-8 text-white/60 hover:text-white transition-colors">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div class="flex items-center gap-4 mb-2">
            <div class="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white backdrop-blur-sm">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h2 class="text-3xl font-black tracking-tight uppercase">B2B Service Selection</h2>
          </div>
          <p class="text-sage font-bold text-xs uppercase tracking-[0.2em] opacity-80">Add professional services to your event: {{ event?.title }}</p>
        </div>

        <!-- Body -->
        <div class="flex-1 overflow-y-auto p-10 bg-sage/5">
          @if (loading) {
            <div class="flex flex-col items-center justify-center py-20">
              <div class="w-12 h-12 border-4 border-forest/10 border-t-forest rounded-full animate-spin mb-4"></div>
              <p class="text-forest font-black uppercase tracking-widest text-xs">Loading services...</p>
            </div>
          } @else if (services.length === 0) {
            <div class="text-center py-20 bg-white rounded-3xl border-4 border-forest/5">
              <p class="text-olive font-black text-sm uppercase tracking-widest">No B2B services available from Admin yet.</p>
            </div>
          } @else {
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              @for (service of services; track service.id) {
                <div class="bg-white rounded-3xl p-6 shadow-sm border border-forest/5 hover:border-olive/20 transition-all group flex flex-col">
                  <div class="flex justify-between items-start mb-4">
                    <div>
                      <span class="px-3 py-1 bg-forest/5 text-forest rounded-lg text-[10px] font-black uppercase tracking-wider mb-2 inline-block">
                        {{ service.type }}
                      </span>
                      <h3 class="text-xl font-bold text-forest leading-tight">{{ service.name }}</h3>
                    </div>
                    <div class="text-right">
                      <p class="text-2xl font-black text-olive leading-tight">{{ service.price }} DT</p>
                      <p class="text-[9px] font-black text-sage uppercase tracking-widest">{{ service.pricingUnit || 'session' }}</p>
                    </div>
                  </div>
                  
                  <p class="text-olive text-sm font-medium mb-6 line-clamp-2 flex-1">{{ service.description }}</p>

                  <div class="mt-auto space-y-4">
                    <div class="pt-4 border-t border-forest/5">
                      <label class="block text-[10px] font-black text-forest/40 uppercase tracking-widest mb-2 ml-1">Staff Required (Qty)</label>
                      <div class="flex items-center gap-3">
                        <button (click)="qtyInputs[service.id!] = Math.max(1, (qtyInputs[service.id!] || 1) - 1)" 
                          class="w-10 h-10 rounded-xl border-2 border-forest/10 flex items-center justify-center text-forest hover:bg-forest/5 transition-colors">
                          -
                        </button>
                        <input type="number" [(ngModel)]="qtyInputs[service.id!]" 
                          class="w-16 h-10 bg-gray-50 border-2 border-forest/5 rounded-xl text-center font-black text-forest focus:border-olive focus:ring-0 outline-none">
                        <button (click)="qtyInputs[service.id!] = (qtyInputs[service.id!] || 1) + 1" 
                          class="w-10 h-10 rounded-xl border-2 border-forest/10 flex items-center justify-center text-forest hover:bg-forest/5 transition-colors">
                          +
                        </button>
                        
                        <button (click)="onAddService(service)" 
                          class="flex-1 h-12 bg-olive hover:bg-forest text-cream rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-olive/20 active:scale-95 ml-2">
                          Add Role to Event
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              }
            </div>
          }
        </div>

        <!-- Footer -->
        <div class="p-10 pt-0 bg-sage/5">
          <button (click)="onClose()" 
            class="w-full py-5 border-2 border-forest text-forest rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-forest hover:text-white transition-all">
            Done - View My Event
          </button>
        </div>
      </div>
    </div>
  `,
    styles: [`
    :host { display: contents; }
    input::-webkit-outer-spin-button,
    input::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
  `]
})
export class B2BServicePickerComponent implements OnInit {
    @Input() event: Event | null = null;
    @Output() close = new EventEmitter<void>();
    @Output() serviceAdded = new EventEmitter<void>();

    private campingService = inject(CampingServiceService);
    private eventServiceEntity = inject(EventServiceEntityService);

    services: CampingService[] = [];
    loading = true;
    qtyInputs: { [key: number]: number } = {};
    Math = Math;

    ngOnInit() {
        this.loadOrganizerServices();
    }

    loadOrganizerServices() {
        this.loading = true;
        this.campingService.getOrganizerServices(0, 100).subscribe({
            next: (response) => {
                this.services = response.data.content;
                // Initialize default qty
                this.services.forEach(s => {
                    if (s.id) this.qtyInputs[s.id] = 1;
                });
                this.loading = false;
            },
            error: (err) => {
                console.error('Failed to load organizer services', err);
                this.loading = false;
            }
        });
    }

    onAddService(service: CampingService) {
        if (!this.event || !service.id) return;

        const qty = this.qtyInputs[service.id] || 1;

        const request: EventServiceEntityRequest = {
            name: service.name,
            description: service.description,
            serviceType: service.type,
            price: service.price,
            quantiteRequise: qty,
            eventId: this.event.id,
            serviceId: service.id
        };

        this.eventServiceEntity.addServiceToEvent(request).subscribe({
            next: () => {
                alert(`${service.name} added to event successfully!`);
                this.serviceAdded.emit();
            },
            error: (err) => {
                console.error('Failed to add service', err);
                const errorMessage = err.error?.message || 'Check if service is already added.';
                alert(`Failed to add service: ${errorMessage}`);
            }
        });
    }

    onClose() {
        this.close.emit();
    }
}
