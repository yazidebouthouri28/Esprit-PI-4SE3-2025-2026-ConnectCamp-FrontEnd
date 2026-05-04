import { Component, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Site } from '../../../models/camping.models';
import { MAX_SITE_TAGS, normalizeSiteTags, SITE_TAG_OPTIONS } from '../../../models/site-tags';
import { SiteService } from '../../../services/site.service';
import { AiPriceSuggestionComponent } from '../../../components/ml/ai-price-suggestion/ai-price-suggestion.component';
import { ImageAnalyzerComponent } from '../../../components/ml/image-analyzer/image-analyzer.component';

@Component({
  selector: 'app-site-general',
  standalone: true,
  imports: [CommonModule, FormsModule, AiPriceSuggestionComponent, ImageAnalyzerComponent],
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
          <div class="flex items-center justify-between gap-4">
            <label class="text-xs font-black text-gray-400 uppercase tracking-widest">Campsite Tags</label>
            <span class="text-[11px] font-black uppercase tracking-widest"
              [ngClass]="(site.tags ?? []).length >= maxSiteTags ? 'text-[#2C4A3C]' : 'text-gray-400'">
              {{ (site.tags ?? []).length }}/{{ maxSiteTags }} Selected
            </span>
          </div>
          <p class="text-sm text-[#617152] font-medium">Pick up to 5 tags to highlight this campsite on its public page.</p>
          <div class="flex flex-wrap gap-2">
            @for (tag of siteTagOptions; track tag) {
            <button type="button" (click)="toggleTag(tag)" [disabled]="isTagDisabled(tag)"
              class="px-3 py-2 rounded-full border text-xs font-black tracking-wide transition-all"
              [ngClass]="isTagSelected(tag)
                ? 'bg-[#2C4A3C] border-[#2C4A3C] text-white shadow-sm'
                : 'bg-white border-gray-200 text-[#1a2e1a] hover:border-[#2C4A3C]/40 hover:bg-[#f8f5e6] disabled:opacity-45 disabled:cursor-not-allowed'">
              {{ tag }}
            </button>
            }
          </div>
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
        <div class="md:col-span-2 space-y-6 border-t border-gray-200 pt-6 mt-2">
          <p class="text-xs font-black text-[#2C4A3C] uppercase tracking-widest">AI assistant</p>
          <p class="text-sm text-[#617152]">Suggested pricing uses campsite ID {{ site.id }}. Image analysis merges detected amenities into this site&apos;s amenities list before you save.</p>
          @if (site.id) {
          <app-ai-price-suggestion
            [siteId]="site.id"
            [currentPrice]="priceForMlAssist()"
            (priceApplied)="applyMlSuggestedPrice($event)" />
          <div class="space-y-2">
            <p class="text-xs font-black text-gray-400 uppercase tracking-widest">Photo analysis</p>
            <app-image-analyzer (done)="onMlImagesAnalyzed($event)" />
          </div>
          }
        </div>
      </div>
      <div class="flex flex-col items-end pt-4 gap-1">
        <button (click)="onSave()" class="px-8 py-3 bg-[#2C4A3C] text-white rounded-xl font-bold hover:bg-[#1a2e1a] transition-all shadow-lg shadow-emerald-900/20">
          Update Site Information
        </button>
        <p class="text-[10px] text-gray-400 font-bold italic">
          Updates will be reflected on the public campsite detail page (name, location, tags, price, times, rules, and images).
        </p>
      </div>
    </div>
  `
})
export class SiteGeneralComponent {
  private readonly maxImagesPerSite = 20;
  readonly maxSiteTags = MAX_SITE_TAGS;
  readonly siteTagOptions = SITE_TAG_OPTIONS;

  @Input() site!: Site;
  @Output() save = new EventEmitter<Site>();

  isUploadingImages = false;

  constructor(private siteService: SiteService, private cdr: ChangeDetectorRef) { }

  priceForMlAssist(): number {
    return Number(this.site?.pricePerNight ?? this.site?.price ?? 0);
  }

  applyMlSuggestedPrice(value: number): void {
    if (!this.site || !Number.isFinite(value)) return;
    this.site.pricePerNight = value;
    this.site.price = value;
    this.cdr.detectChanges();
  }

  onMlImagesAnalyzed(results: Array<{ analysis?: { amenities?: string[] } }>): void {
    if (!this.site?.id) return;
    if (!this.site.amenities) {
      this.site.amenities = [];
    }
    const merged = new Set(this.site.amenities.map(String));
    for (const row of results || []) {
      for (const a of row.analysis?.amenities ?? []) {
        if (a) merged.add(String(a));
      }
    }
    this.site.amenities = [...merged];
    this.cdr.detectChanges();
  }

  toggleTag(tag: string): void {
    const currentTags = normalizeSiteTags(this.site.tags);
    if (currentTags.includes(tag)) {
      this.site.tags = currentTags.filter((currentTag) => currentTag !== tag);
      return;
    }

    if (currentTags.length >= this.maxSiteTags) {
      return;
    }

    this.site.tags = normalizeSiteTags([...currentTags, tag]);
  }

  isTagSelected(tag: string): boolean {
    return normalizeSiteTags(this.site.tags).includes(tag);
  }

  isTagDisabled(tag: string): boolean {
    return !this.isTagSelected(tag) && normalizeSiteTags(this.site.tags).length >= this.maxSiteTags;
  }

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
    this.site.tags = normalizeSiteTags(this.site.tags);

    this.save.emit(this.site);
  }
}
