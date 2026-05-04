import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { CampHighlightService } from '../../services/camp-highlight.service';
import { SiteService } from '../../services/site.service';
import { CampHighlight, Site } from '../../models/camping.models';

@Component({
  selector: 'app-camp-highlights-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-8 space-y-8 animate-fade-in bg-transparent min-h-screen">
      <div class="flex justify-between items-center gap-4 flex-wrap">
        <div>
          <h1 class="text-2xl font-black text-[#1a2e1a]">CampHighLight</h1>
          <p class="text-sm text-[#617152] font-medium">Manage factual highlights per campsite (flora, fauna, climate, geology, history).</p>
        </div>
        <div class="flex items-center gap-3">
          <select [(ngModel)]="selectedSiteId" (change)="onSiteChange()"
            class="px-3 py-2 border border-gray-200 rounded-lg text-sm font-bold text-[#1a2e1a] bg-white min-w-[220px]">
            <option [ngValue]="null">Select campsite</option>
            <option *ngFor="let site of sites" [ngValue]="site.id">{{ site.name }}</option>
          </select>
          <button (click)="openCreateForm()"
            class="px-4 py-2 bg-[#2C4A3C] text-white rounded-lg text-sm font-bold hover:bg-[#1a2e1a] transition-all shadow-sm">
            + Add Highlight
          </button>
        </div>
      </div>

      <div *ngIf="errorMessage" class="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-bold">
        {{ errorMessage }}
      </div>

      <div *ngIf="showForm" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-2xl p-8 max-w-2xl w-full shadow-2xl space-y-6">
          <h2 class="text-xl font-bold text-[#1a2e1a]">{{ editingHighlight ? 'Edit' : 'Add' }} Highlight</h2>
          <form #highlightForm="ngForm" (ngSubmit)="saveHighlight(highlightForm)" class="grid grid-cols-2 gap-4">
            <div class="col-span-2">
              <label class="block text-xs font-bold text-gray-400 uppercase mb-1">Campsite *</label>
              <select [(ngModel)]="currentHighlight.siteId" name="siteId" required #siteRef="ngModel"
                class="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm outline-none"
                [ngClass]="{'border-red-500': siteRef.invalid && siteRef.touched}">
                <option [ngValue]="undefined">Select campsite</option>
                <option *ngFor="let site of sites" [ngValue]="site.id">{{ site.name }}</option>
              </select>
              <div *ngIf="siteRef.invalid && siteRef.touched" class="text-xs text-red-500 mt-1">Campsite is required</div>
            </div>
            <div class="col-span-2">
              <label class="block text-xs font-bold text-gray-400 uppercase mb-1">Title</label>
              <input [(ngModel)]="currentHighlight.title" name="title" required minlength="3" maxlength="200" #titleRef="ngModel"
                class="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#1a2e1a]/10 outline-none"
                [ngClass]="{'border-red-500': titleRef.invalid && titleRef.touched}">
              <div *ngIf="titleRef.invalid && titleRef.touched" class="text-xs text-red-500 mt-1">Title is required (3-200 chars)</div>
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-400 uppercase mb-1">Category</label>
              <select [(ngModel)]="currentHighlight.category" name="category" required #catRef="ngModel"
                class="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm outline-none">
                <option value="FLORA">Flora</option>
                <option value="FAUNA">Fauna</option>
                <option value="CLIMATE">Climate</option>
                <option value="GEOLOGY">Geology</option>
                <option value="HISTORY">History</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-400 uppercase mb-1">Media (Image/Video)</label>
              <div class="flex items-center gap-3">
                <input #highlightImageInput type="file" accept="image/*,video/*" class="hidden"
                  (change)="onHighlightImageSelected($event)">
                <button type="button" (click)="highlightImageInput.click()"
                  class="px-4 py-2 bg-[#2C4A3C] text-white rounded-lg text-xs font-black uppercase tracking-widest hover:bg-[#1a2e1a] transition-all">
                  + Import Image/Video
                </button>
                <span class="text-xs text-[#617152] font-bold" *ngIf="currentHighlight.imageUrl">
                  {{ isVideoMedia(currentHighlight.imageUrl) ? 'Video selected' : 'Image selected' }}
                </span>
                <span class="text-xs text-gray-400 font-bold" *ngIf="!currentHighlight.imageUrl">
                  No media selected
                </span>
              </div>
              <div *ngIf="currentHighlight.imageUrl" class="mt-3 inline-block relative rounded-xl overflow-hidden border border-gray-200 bg-white">
                <video *ngIf="isVideoMedia(currentHighlight.imageUrl); else mediaImagePreview"
                  [src]="currentHighlight.imageUrl" class="w-40 h-24 object-cover" controls muted playsinline></video>
                <ng-template #mediaImagePreview>
                  <img [src]="currentHighlight.imageUrl" alt="Highlight media preview" class="w-40 h-24 object-cover">
                </ng-template>
                <button type="button" (click)="clearHighlightImage()"
                  class="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white text-xs font-black">
                  x
                </button>
              </div>
            </div>
            <div class="col-span-2">
              <label class="block text-xs font-bold text-gray-400 uppercase mb-1">Content</label>
              <textarea [(ngModel)]="currentHighlight.content" name="content" required minlength="10" maxlength="5000" rows="4" #contentRef="ngModel"
                class="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm outline-none"
                [ngClass]="{'border-red-500': contentRef.invalid && contentRef.touched}"></textarea>
              <div *ngIf="contentRef.invalid && contentRef.touched" class="text-xs text-red-500 mt-1">Content is required (10-5000 chars)</div>
            </div>
            <div class="col-span-2 flex items-center gap-2">
              <input id="published" type="checkbox" name="isPublished" [(ngModel)]="currentHighlight.isPublished">
              <label for="published" class="text-xs font-bold text-gray-500 uppercase tracking-widest">Published</label>
            </div>
          <div class="flex justify-end gap-3 pt-4 col-span-2">
            <button type="button" (click)="closeForm()" class="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-700">Cancel</button>
            <button type="submit"
              [disabled]="isSaving || highlightForm.invalid"
              class="px-6 py-2 bg-[#2C4A3C] text-white rounded-lg text-sm font-bold disabled:opacity-60 disabled:cursor-not-allowed">
              {{ isSaving ? 'Saving...' : 'Save Highlight' }}
            </button>
          </div>
          </form>
        </div>
      </div>

      <div *ngIf="!selectedSiteId" class="py-14 text-center rounded-2xl border-2 border-dashed border-gray-200 bg-white">
        <p class="text-sm font-bold text-gray-500">Select a campsite to manage its highlights.</p>
      </div>

      <div *ngIf="selectedSiteId" class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div *ngFor="let h of highlights" class="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm group">
          <div class="h-40 bg-gray-100 relative overflow-hidden">
            <video *ngIf="isVideoMedia(h.imageUrl); else highlightImageCard"
              [src]="h.imageUrl" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" muted playsinline></video>
            <ng-template #highlightImageCard>
              <img [src]="h.imageUrl || 'assets/images/logo.png'" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
            </ng-template>
            <div class="absolute top-3 left-3 px-2 py-1 bg-white/90 backdrop-blur rounded text-[10px] font-black uppercase tracking-widest text-[#2C4A3C]">
              {{ h.category }}
            </div>
          </div>
          <div class="p-4 space-y-2">
            <h3 class="font-bold text-[#1a2e1a]">{{ h.title }}</h3>
            <p class="text-xs text-[#617152] line-clamp-2">{{ h.content }}</p>
            <div class="flex justify-between items-center pt-2 border-t border-gray-50">
              <span class="text-[10px] text-gray-400 font-bold">{{ h.createdAt | date:'shortDate' }}</span>
              <div class="flex gap-2">
                <button (click)="editHighlight(h)" class="text-emerald-600 hover:bg-emerald-50 p-1.5 rounded-lg transition-colors">Edit</button>
                <button (click)="deleteHighlight(h.id)" class="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors">Del</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div *ngIf="selectedSiteId && !isLoading && !highlights.length" class="py-12 text-center bg-white rounded-2xl border border-dashed border-gray-200">
        <p class="text-gray-400 font-bold">No highlights yet for this campsite.</p>
      </div>
    </div>
  `,
  styles: [`
    .animate-fade-in { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class CampHighlightsManagementComponent implements OnInit {
  sites: Site[] = [];
  highlights: CampHighlight[] = [];
  selectedSiteId: number | null = null;
  isLoading = false;
  showForm = false;
  editingHighlight = false;
  errorMessage = '';
  isSaving = false;
  selectedMediaFile: File | null = null;
  currentHighlight: Partial<CampHighlight> = {
    category: 'FLORA',
    isPublished: true
  };

  constructor(
    private highlightService: CampHighlightService,
    private siteService: SiteService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.loadSites();
  }

  onHighlightImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      input.value = '';
      return;
    }
    this.selectedMediaFile = file;

    const reader = new FileReader();
    reader.onload = () => {
      this.currentHighlight.imageUrl = typeof reader.result === 'string' ? reader.result : '';
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(file);
    input.value = '';
  }

  clearHighlightImage() {
    this.currentHighlight.imageUrl = '';
    this.selectedMediaFile = null;
    this.cdr.detectChanges();
  }

  isVideoMedia(mediaUrl?: string): boolean {
    if (!mediaUrl) return false;
    if (mediaUrl.startsWith('data:')) {
      return mediaUrl.startsWith('data:video/');
    }
    const normalized = mediaUrl.split('?')[0].toLowerCase();
    return /\.(mp4|webm|ogg|mov|m4v)$/.test(normalized);
  }

  loadSites() {
    this.siteService.getAllSites().subscribe({
      next: (sites) => {
        this.sites = sites;
        this.highlights = [];
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = 'Unable to load campsites for highlight assignment.';
        this.cdr.detectChanges();
      }
    });
  }

  onSiteChange() {
    this.closeForm();
    this.loadHighlights();
  }

  loadHighlights() {
    if (!this.selectedSiteId) {
      this.highlights = [];
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.highlightService.getHighlightsBySite(this.selectedSiteId).subscribe({
      next: (highlights) => {
        this.highlights = highlights;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = 'Unable to load highlights for selected campsite.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  openCreateForm() {
    this.resetForm();
    this.errorMessage = '';
    this.showForm = true;
  }

  editHighlight(highlight: CampHighlight) {
    this.currentHighlight = { ...highlight };
    this.selectedMediaFile = null;
    if (highlight.siteId) {
      this.selectedSiteId = highlight.siteId;
    }
    this.editingHighlight = true;
    this.showForm = true;
  }

  saveHighlight(highlightForm?: any) {
    if (this.isSaving) return;
    
    if (highlightForm && highlightForm.invalid) {
      this.errorMessage = 'Please fix the validation errors before saving.';
      return;
    }

    const targetSiteId = this.currentHighlight.siteId ?? this.selectedSiteId;
    if (!targetSiteId) {
      this.errorMessage = 'Please select a campsite before saving highlight.';
      return;
    }
    if (!this.currentHighlight.title?.trim() || !this.currentHighlight.content?.trim()) return;

    const payload: Partial<CampHighlight> = {
      ...this.currentHighlight,
      siteId: targetSiteId,
      category: this.currentHighlight.category ?? 'FLORA',
      imageUrl: this.currentHighlight.imageUrl ?? '',
      isPublished: this.currentHighlight.isPublished ?? true
    };

    const mediaUpload$ = this.selectedMediaFile
      ? this.highlightService.uploadHighlightMedia(targetSiteId, this.selectedMediaFile)
      : of(payload.imageUrl ?? '');

    this.isSaving = true;
    this.errorMessage = '';

    mediaUpload$.pipe(
      switchMap((uploadedMediaUrl) => {
        const finalPayload: Partial<CampHighlight> = {
          ...payload,
          imageUrl: this.selectedMediaFile ? uploadedMediaUrl : (payload.imageUrl ?? '')
        };
        if (this.editingHighlight && this.currentHighlight.id) {
          return this.highlightService.updateHighlight(this.currentHighlight.id, finalPayload);
        }
        return this.highlightService.createHighlight(targetSiteId, finalPayload);
      })
    ).subscribe({
      next: () => {
        this.selectedSiteId = targetSiteId;
        this.isSaving = false;
        this.loadHighlights();
        this.closeForm();
      },
      error: (error) => {
        this.isSaving = false;
        this.errorMessage = error?.message || (this.editingHighlight ? 'Unable to update highlight.' : 'Unable to create highlight.');
        this.cdr.detectChanges();
      }
    });
  }

  deleteHighlight(id: number) {
    if (!confirm('Delete this highlight?')) return;
    this.highlightService.deleteHighlight(id).subscribe({
      next: () => this.loadHighlights(),
      error: () => {
        this.errorMessage = 'Unable to delete highlight.';
        this.cdr.detectChanges();
      }
    });
  }

  closeForm() {
    this.isSaving = false;
    this.showForm = false;
    this.resetForm();
  }

  private resetForm() {
    this.editingHighlight = false;
    this.selectedMediaFile = null;
    this.currentHighlight = {
      category: 'FLORA',
      isPublished: true,
      siteId: this.selectedSiteId ?? undefined
    };
  }
}
