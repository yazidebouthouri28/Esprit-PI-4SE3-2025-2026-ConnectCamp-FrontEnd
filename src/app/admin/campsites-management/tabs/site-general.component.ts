import { Component, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Site } from '../../../models/camping.models';
import { SiteService } from '../../../services/site.service';

@Component({
  selector: 'app-site-general',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6 animate-fade-in">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="space-y-2">
          <label class="text-xs font-black text-gray-400 uppercase tracking-widest">Site Name</label>
          <input [(ngModel)]="site.name" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2C4A3C]/20 outline-none font-bold text-[#1a2e1a]">
        </div>
        <div class="space-y-2">
          <label class="text-xs font-black text-gray-400 uppercase tracking-widest">Location</label>
          <input [(ngModel)]="site.location" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2C4A3C]/20 outline-none font-bold text-[#1a2e1a]">
        </div>
        <div class="md:col-span-2 space-y-2">
          <label class="text-xs font-black text-gray-400 uppercase tracking-widest">Update Description Here</label>
          <textarea [(ngModel)]="site.description" rows="3" placeholder="Update description here"
            class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2C4A3C]/20 outline-none font-bold text-[#1a2e1a]"></textarea>
        </div>
        <div class="space-y-2">
          <label class="text-xs font-black text-gray-400 uppercase tracking-widest">Capacity (Slots)</label>
          <input type="number" [(ngModel)]="site.capacity" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2C4A3C]/20 outline-none font-bold text-[#1a2e1a]">
        </div>
        <div class="space-y-2">
          <label class="text-xs font-black text-gray-400 uppercase tracking-widest">Base Price (DT)</label>
          <input type="number" [(ngModel)]="site.pricePerNight" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2C4A3C]/20 outline-none font-bold text-[#1a2e1a]">
        </div>
        <div class="space-y-2">
          <label class="text-xs font-black text-gray-400 uppercase tracking-widest">Check-in Time</label>
          <input type="time" [(ngModel)]="site.checkInTime" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2C4A3C]/20 outline-none font-bold text-[#1a2e1a]">
        </div>
        <div class="space-y-2">
          <label class="text-xs font-black text-gray-400 uppercase tracking-widest">Check-out Time</label>
          <input type="time" [(ngModel)]="site.checkOutTime" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2C4A3C]/20 outline-none font-bold text-[#1a2e1a]">
        </div>
        <div class="md:col-span-2 space-y-2">
          <label class="text-xs font-black text-gray-400 uppercase tracking-widest">House Rules</label>
          <textarea [(ngModel)]="site.houseRules" rows="3" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2C4A3C]/20 outline-none font-bold text-[#1a2e1a]"></textarea>
        </div>
        <div class="md:col-span-2 space-y-3">
          <label class="text-xs font-black text-gray-400 uppercase tracking-widest">Campsite Images</label>
          <div class="flex flex-wrap items-center gap-3">
            <input #siteImagesInput type="file" accept="image/*" multiple class="hidden" (change)="onImagesSelected($event)">
            <button type="button" (click)="siteImagesInput.click()"
              class="px-4 py-2 bg-[#2C4A3C] text-white rounded-lg text-xs font-black uppercase tracking-widest hover:bg-[#1a2e1a] transition-all">
              + Import Images
            </button>
            <span class="text-xs font-bold text-[#617152]">{{ (site.images ?? []).length }} image(s) selected</span>
          </div>
          @if ((site.images ?? []).length) {
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
            @for (image of site.images ?? []; track i; let i = $index) {
            <div class="relative rounded-xl overflow-hidden border border-gray-200 bg-white group">
              <img [src]="image" alt="Site image preview" class="w-full h-24 object-cover">
              <button type="button" (click)="removeImage(i)"
                class="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white text-xs font-black opacity-0 group-hover:opacity-100 transition-opacity">
                x
              </button>
            </div>
            }
          </div>
          }
        </div>
      </div>
      <div class="flex flex-col items-end pt-4 gap-1">
        <button (click)="onSave()" class="px-8 py-3 bg-[#2C4A3C] text-white rounded-xl font-bold hover:bg-[#1a2e1a] transition-all shadow-lg shadow-emerald-900/20">
          Update Site Information
        </button>
        <p class="text-[10px] text-gray-400 font-bold italic">
          Updates will be reflected on the public campsite detail page (name, location, price, times, rules, and images).
        </p>
      </div>
    </div>
  `
})
export class SiteGeneralComponent {
  private readonly maxImagesPerSite = 20;

  @Input() site!: Site;
  @Output() save = new EventEmitter<Site>();

  isUploadingImages = false;

  constructor(private siteService: SiteService, private cdr: ChangeDetectorRef) { }

  async onImagesSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (!files?.length) return;

    const existingImages = this.site.images ?? [];
    const availableSlots = this.maxImagesPerSite - existingImages.length;
    if (availableSlots <= 0) {
      input.value = '';
      return;
    }

    const selectedFiles = Array.from(files).slice(0, availableSlots);
    this.isUploadingImages = true;
    this.siteService.uploadSiteImages(this.site.id, selectedFiles).subscribe({
      next: (updated) => {
        this.site.images = updated.images ?? [];
        this.site.image = this.site.images[0] ?? '';
        this.isUploadingImages = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isUploadingImages = false;
        this.cdr.detectChanges();
      }
    });
    input.value = '';
  }

  removeImage(index: number): void {
    const images = this.site.images ?? [];
    const url = images[index];
    if (!url) return;

    this.isUploadingImages = true;
    this.siteService.removeSiteImage(this.site.id, url).subscribe({
      next: (updated) => {
        this.site.images = updated.images ?? [];
        this.site.image = this.site.images[0] ?? '';
        this.isUploadingImages = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isUploadingImages = false;
        this.cdr.detectChanges();
      }
    });
  }

  onSave(): void {
    // Keep price fields in sync
    const pricePerNight = Number(this.site.pricePerNight ?? this.site.price ?? 0);
    this.site.pricePerNight = pricePerNight;
    this.site.price = pricePerNight;

    // Ensure city/location stay aligned – Location field is the source of truth
    if (this.site.location) {
      this.site.city = this.site.location;
    } else if (this.site.city) {
      this.site.location = this.site.city;
    }

    // Primary image
    this.site.image = this.site.images?.[0] ?? this.site.image ?? '';

    this.save.emit(this.site);
  }
}
