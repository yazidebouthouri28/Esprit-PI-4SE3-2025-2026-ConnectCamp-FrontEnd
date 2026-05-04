import { Component, OnInit, ChangeDetectorRef, Pipe, PipeTransform, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, of } from 'rxjs';
import { switchMap, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { CampHighlightService, SiteHighlightStats } from '../../services/camp-highlight.service';
import { SiteService } from '../../services/site.service';
import { CampHighlight, Site } from '../../models/camping.models';

import * as L from 'leaflet';
import { Chart, registerables } from 'chart.js';
import { HighlightClassifierComponent } from '../../components/ml/highlight-classifier/highlight-classifier.component';

Chart.register(...registerables);

@Pipe({
  name: 'textHighlight',
  standalone: true
})
export class TextHighlightPipe implements PipeTransform {
  transform(value: string, searchKeyword: string): string {
    if (!searchKeyword || !value) return value;
    const regex = new RegExp(`(${searchKeyword})`, 'gi');
    return value.replace(regex, `<mark class="bg-yellow-300 rounded px-1 font-bold text-black drop-shadow-sm">$1</mark>`);
  }
}

@Component({
  selector: 'app-camp-highlights-management',
  standalone: true,
  imports: [CommonModule, FormsModule, TextHighlightPipe, DatePipe, HighlightClassifierComponent],
  template: `
    <div class="p-8 space-y-8 animate-fade-in bg-transparent min-h-screen relative">
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
          <button (click)="openCreateForm()" title="Add highlight with AI category classifier"
            class="px-4 py-2 bg-[#2C4A3C] text-white rounded-lg text-sm font-bold hover:bg-[#1a2e1a] transition-all shadow-sm">
            + Add Highlight + AI
          </button>
        </div>
      </div>

      <div *ngIf="errorMessage" class="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-bold">
        {{ errorMessage }}
      </div>

      <div class="flex items-center justify-between mb-3 px-1">
        <h2 class="text-sm font-black text-[#1a2e1a] uppercase tracking-widest flex items-center gap-2">
            <svg class="w-5 h-5 text-[#2C4A3C]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
            Dashboard Analytics
        </h2>
        <div class="flex items-center gap-4">
            <!-- 2. Live Synchronization Pulse -->
            <div class="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100 shadow-inner">
                <span class="relative flex h-3 w-3">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <span class="text-xs font-black text-emerald-700 tracking-widest uppercase">System Sync Active</span>
            </div>

            <button type="button" (click)="loadSiteStats()"
              class="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-black uppercase tracking-widest text-[#1a2e1a] hover:bg-white shadow-sm flex items-center gap-1.5 transition-colors">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
              Sync Stats
            </button>
        </div>
      </div>
      
      <!-- 1. Chart.js Visualization Pane -->
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8" *ngIf="selectedSiteId && currentSiteStat; else noStats">
        <div class="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200 p-6 shadow-sm relative overflow-hidden group col-span-1 lg:col-span-1">
           <h3 class="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Highlights Status</h3>
           <div class="relative h-40 flex justify-center">
             <canvas #doughnutChart></canvas>
           </div>
        </div>
        
        <div class="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col justify-center col-span-1 lg:col-span-3"
             style="background-image: radial-gradient(circle at bottom right, rgba(44, 74, 60, 0.1), transparent 42%); background-repeat: no-repeat;">
            <p class="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Campsite Overview</p>
            <h3 class="text-2xl font-black text-[#1a2e1a] leading-tight mb-6">{{ currentSiteStat.siteName }}</h3>
            <div class="flex items-center gap-8">
              <div>
                <p class="text-4xl font-black text-[#2C4A3C]">{{ currentSiteStat.totalHighlights }}</p>
                <p class="text-xs text-gray-500 font-bold uppercase tracking-wider mt-1">Total Highlights</p>
              </div>
              <div class="w-px h-12 bg-gray-200"></div>
              <div>
                <p class="text-4xl font-black text-[#617152]">{{ currentSiteStat.publishedHighlights }}</p>
                <p class="text-xs text-gray-500 font-bold uppercase tracking-wider mt-1">Active / Published</p>
              </div>
            </div>
        </div>
      </div>
      <ng-template #noStats>
        <div class="p-8 text-center border-2 border-dashed border-gray-200 rounded-2xl bg-white/50" *ngIf="selectedSiteId">
          <p class="text-sm font-bold text-gray-400">No active statistical data available. Chart waiting for data.</p>
        </div>
      </ng-template>

      <!-- Advanced Main Content Area -->
      <div *ngIf="selectedSiteId" class="flex flex-col lg:flex-row gap-6">
          
          <!-- LEFT PANE: SEARCH & GRID (66%) -->
          <div class="w-full lg:w-2/3 space-y-6">
              
              <!-- 4. RxJS Debounced Search Input -->
              <div class="flex items-center gap-3">
                <input [ngModel]="searchKeyword" (ngModelChange)="onSearchInput($event)"
                  placeholder="Dynamically search across highlights & campsite data..."
                  class="w-full px-4 py-3 border border-gray-200 shadow-inner rounded-xl text-sm font-medium outline-none focus:ring-2 focus:border-transparent focus:ring-[#2C4A3C]/40 transition-all">
                <button type="button" (click)="clearSearch()" *ngIf="searchKeyword"
                  class="px-4 py-3 border border-gray-200 rounded-xl text-xs font-black uppercase tracking-widest text-red-500 hover:bg-red-50 transition-all">
                  Clear
                </button>
              </div>

              <!-- 4. Skeleton Loaders while isSearching -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6" *ngIf="isSearching">
                 <div *ngFor="let i of [1,2,3,4]" class="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm animate-pulse">
                    <div class="h-48 bg-gray-200 w-full"></div>
                    <div class="p-5 flex flex-col gap-3">
                       <div class="h-5 bg-gray-200 rounded w-3/4"></div>
                       <div class="h-3 bg-gray-200 rounded w-full"></div>
                       <div class="h-3 bg-gray-200 rounded w-5/6"></div>
                       <div class="mt-4 h-3 bg-gray-200 rounded w-1/3"></div>
                    </div>
                 </div>
              </div>

              <!-- Highlight Cards Grid -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6" *ngIf="!isSearching">
                <div *ngFor="let h of highlights" (mouseenter)="focusMapOnHighlight(h)" class="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group hover:-translate-y-1">
                  <div class="h-48 bg-gray-100 relative overflow-hidden">
                    <video *ngIf="isVideoMedia(h.imageUrl); else highlightImageCard"
                      [src]="h.imageUrl" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" muted playsinline loop></video>
                    <ng-template #highlightImageCard>
                      <img [src]="h.imageUrl || 'assets/images/logo.png'" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110">
                    </ng-template>
                    <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-80 group-hover:opacity-100 transition-opacity"></div>
                    
                    <div class="absolute top-3 left-3 px-2.5 py-1 bg-white/95 backdrop-blur-md rounded-lg text-[10px] font-black uppercase tracking-widest text-[#2C4A3C] shadow-sm">
                      {{ h.category }}
                    </div>
                    
                    <div class="absolute top-3 right-3" *ngIf="!h.isPublished">
                      <div class="w-2.5 h-2.5 bg-yellow-400 rounded-full shadow-[0_0_8px_rgba(250,204,21,0.8)]" title="Draft"></div>
                    </div>
                    
                    <!-- Quick Actions Over Media -->
                    <div class="absolute bottom-3 right-3 flex gap-2 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                        <button (click)="editHighlight(h)" title="Edit with AI classifier" class="w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm text-emerald-600 hover:bg-emerald-500 hover:text-white flex items-center justify-center transition-colors shadow-md">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                        </button>
                        <button (click)="deleteHighlight(h.id)" title="Delete" class="w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center transition-colors shadow-md">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                    </div>
                  </div>
                  
                  <div class="p-5 flex flex-col min-h-[170px]">
                    <!-- 3. Search Term Highlighting using [innerHTML] -->
                    <h3 class="font-bold text-[#1a2e1a] text-lg mb-1 leading-tight line-clamp-1" [innerHTML]="h.title | textHighlight:searchKeyword"></h3>
                    <p class="text-xs text-gray-500 leading-relaxed line-clamp-2 flex-1" [innerHTML]="h.content | textHighlight:searchKeyword"></p>
                    <div *ngIf="h.tags?.length" class="flex flex-wrap gap-1.5 mt-3">
                      <span *ngFor="let tag of h.tags" class="px-2 py-1 rounded-full bg-emerald-50 text-[#2C4A3C] border border-emerald-100 text-[10px] font-black">
                        #{{ tag }}
                      </span>
                    </div>
                    <div class="flex items-center gap-1.5 mt-auto pt-3 border-t border-gray-100">
                      <svg class="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                      <span class="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{{ h.createdAt | date:'longDate' }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div *ngIf="!isLoading && !isSearching && !highlights.length" class="py-12 text-center bg-white rounded-2xl border border-dashed border-gray-200">
                <p class="text-gray-400 font-bold">No highlights matched your criteria.</p>
              </div>
          </div>

          <!-- 5. RIGHT PANE: LEAFLET MAP (33%) -->
          <div class="hidden lg:block w-1/3">
             <div class="sticky top-8 bg-white rounded-2xl border border-gray-200 shadow-sm p-4 h-[600px] flex flex-col">
                 <h3 class="text-xs font-black uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2">
                     <svg class="w-4 h-4 text-[#2C4A3C]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                     Interactive Map
                 </h3>
                 <div id="highlightMap" class="w-full flex-1 rounded-xl bg-gray-100 border border-gray-200 overflow-hidden relative z-0"></div>
                 <p class="text-[10px] font-bold text-gray-400 text-center mt-3 uppercase">Hover over a highlight to locate</p>
             </div>
          </div>

      </div>

      <div *ngIf="!selectedSiteId" class="py-14 text-center rounded-2xl border-2 border-dashed border-gray-200 bg-white">
        <p class="text-sm font-bold text-gray-500">Select a campsite to manage its highlights.</p>
      </div>

      <!-- CREATE/EDIT FORM MODAL -->
      <!-- (Unchanged structure, purely semantic) -->
      <div *ngIf="showForm" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
        <div class="bg-white rounded-2xl p-8 max-w-4xl w-full shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto">
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
            <div class="col-span-2 rounded-xl border border-emerald-100 bg-emerald-50/40 p-4">
              <app-highlight-classifier
                [assistFromParentForm]="true"
                [title]="currentHighlight.title || ''"
                [content]="currentHighlight.content || ''"
                (categorySelected)="applyMlHighlightCategory($event)"
                (tagsSelected)="applyMlHighlightTags($event)"
              ></app-highlight-classifier>
            </div>
            <div class="col-span-2" *ngIf="currentHighlight.tags?.length">
              <label class="block text-xs font-bold text-gray-400 uppercase mb-2">AI Generated Tags</label>
              <div class="flex flex-wrap gap-2">
                <span *ngFor="let tag of currentHighlight.tags"
                  class="px-3 py-1.5 rounded-full bg-[#2C4A3C]/10 text-[#2C4A3C] border border-[#2C4A3C]/10 text-xs font-black">
                  #{{ tag }}
                </span>
              </div>
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
    </div>
  `,
  styles: [`
    .animate-fade-in { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class CampHighlightsManagementComponent implements OnInit, OnDestroy {
  sites: Site[] = [];
  highlights: CampHighlight[] = [];
  siteStats: SiteHighlightStats[] = [];
  currentSiteStat: SiteHighlightStats | null = null;
  selectedSiteId: number | null = null;
  
  searchKeyword = '';
  private searchSubject = new Subject<string>();
  isSearching = false;
  
  isLoading = false;
  showForm = false;
  editingHighlight = false;
  errorMessage = '';
  isSaving = false;
  selectedMediaFile: File | null = null;
  currentHighlight: Partial<CampHighlight> = {
    category: 'FLORA',
    isPublished: true,
    tags: []
  };

  // Maps and Charts
  map: L.Map | null = null;
  chart: Chart | null = null;
  
  @ViewChild('doughnutChart') doughnutChartRef!: ElementRef;

  constructor(
    private highlightService: CampHighlightService,
    private siteService: SiteService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.loadSites();
    this.loadSiteStats();

    // 4. RxJS Debounced Search implementation
    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(searchTerm => {
      this.executeSearch(searchTerm);
    });
  }

  ngOnDestroy() {
      if (this.chart) this.chart.destroy();
      if (this.map) this.map.remove();
  }

  onSearchInput(value: string) {
    this.searchKeyword = value;
    this.isSearching = true; // Trigger skeleton loader immediately
    this.searchSubject.next(value);
  }

  executeSearch(keyword: string) {
    if (!this.selectedSiteId) return;

    this.errorMessage = '';
    const safeKeyword = keyword.trim();
    const request$ = safeKeyword
      ? this.highlightService.searchHighlights(safeKeyword)
      : this.highlightService.getHighlightsBySite(this.selectedSiteId);

    request$.subscribe({
      next: (highlights) => {
        this.highlights = safeKeyword
          ? highlights.filter((h) => h.siteId === this.selectedSiteId)
          : highlights;
        this.isSearching = false; // Disable skeleton loaders
        this.updateMapMarkers(); // Refresh map with filtered markers
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = 'Unable to fetch highlights.';
        this.isSearching = false;
        this.cdr.detectChanges();
      }
    });
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
    if (mediaUrl.startsWith('data:')) return mediaUrl.startsWith('data:video/');
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
    this.searchKeyword = '';
    this.currentSiteStat = this.siteStats.find(s => s.siteId === this.selectedSiteId) || null;
    
    // De-render map momentarily to prevent weird dimensions, will re-init
    if (this.map) {
        this.map.remove();
        this.map = null;
    }

    if (this.selectedSiteId) {
        this.isSearching = true; // Use skeleton loaders
        this.executeSearch('');
        // Initialize Map in next tick so the DOM container exists
        setTimeout(() => {
            this.initMap();
            this.initChart();
        }, 100);
    } else {
        this.highlights = [];
    }
  }

  initChart() {
      if (!this.doughnutChartRef || !this.currentSiteStat) return;
      if (this.chart) this.chart.destroy();

      const total = this.currentSiteStat.totalHighlights;
      const published = this.currentSiteStat.publishedHighlights;
      const unpub = total - published;

      this.chart = new Chart(this.doughnutChartRef.nativeElement, {
          type: 'doughnut',
          data: {
              labels: ['Published', 'Draft'],
              datasets: [{
                  data: [published, unpub],
                  backgroundColor: ['#617152', '#D1D5DB'],
                  borderWidth: 0,
                  hoverOffset: 4
              }]
          },
          options: {
              responsive: true,
              maintainAspectRatio: false,
              cutout: '75%',
              plugins: {
                  legend: { display: false }
              },
              animation: {
                  animateScale: true,
                  animateRotate: true
              }
          }
      });
  }

  initMap() {
    const mapElement = document.getElementById('highlightMap');
    if (!mapElement) return;

    // Use selected site coordinate if available, otherwise default Tunisia
    const site = this.sites.find(s => s.id === this.selectedSiteId);
    const lat = site?.latitude || 33.8869;
    const lng = site?.longitude || 9.5375;

    this.map = L.map('highlightMap', {
        zoomControl: false
    }).setView([lat, lng], 13);
    
    L.control.zoom({ position: 'bottomright' }).addTo(this.map);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://carto.com/">CARTO</a>'
    }).addTo(this.map);

    this.updateMapMarkers();
  }

  private highlightMarkers: L.Marker[] = [];
  
  updateMapMarkers() {
      if (!this.map) return;
      
      // Clear old markers
      this.highlightMarkers.forEach(m => m.remove());
      this.highlightMarkers = [];

      const site = this.sites.find(s => s.id === this.selectedSiteId);
      const baseLat = site?.latitude || 33.8869;
      const baseLng = site?.longitude || 9.5375;

      // Add a home marker for the campsite
      const homeIcon = L.divIcon({
          className: 'custom-div-icon',
          html: `<div style="background-color:#1a2e1a; width:16px; height:16px; border-radius:50%; border:3px solid white; box-shadow:0 2px 5px rgba(0,0,0,0.3);"></div>`,
          iconSize: [20, 20],
          iconAnchor: [10, 10]
      });
      L.marker([baseLat, baseLng], { icon: homeIcon }).addTo(this.map).bindPopup(`<b>${site?.name}</b>`);

      // Map each highlight to the exact Campsite location
      this.highlights.forEach((h, index) => {
          const offsetLat = baseLat;
          const offsetLng = baseLng;

          const hIcon = L.divIcon({
              className: 'custom-div-icon',
              html: `<div style="background-color:#617152; width:14px; height:14px; border-radius:50%; border:2px solid white; box-shadow:0 2px 4px rgba(0,0,0,0.3);"></div>`,
              iconSize: [18, 18],
              iconAnchor: [9, 9]
          });
          
          const marker = L.marker([offsetLat, offsetLng], { icon: hIcon }).addTo(this.map!);
          marker.bindPopup(`<b>${h.title}</b><br><span style="font-size:10px; color:gray">${h.category}</span>`);
          
          // Store a reference to identify it when hovered in the list
          (marker as any).highlightId = h.id; 
          this.highlightMarkers.push(marker);
      });
  }

  focusMapOnHighlight(h: CampHighlight) {
      if (!this.map) return;
      const marker = this.highlightMarkers.find(m => (m as any).highlightId === h.id);
      if (marker) {
          marker.openPopup();
      }
  }

  loadHighlights() {
      // Manual trigger for refresh
      this.isSearching = true;
      this.executeSearch(this.searchKeyword);
  }

  loadSiteStats() {
    this.highlightService.getSiteHighlightStats().subscribe({
      next: (stats) => {
        this.siteStats = stats;
        if(this.selectedSiteId) {
            this.currentSiteStat = this.siteStats.find(s => s.siteId === this.selectedSiteId) || null;
            this.initChart(); // Refresh chart with new stats
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.siteStats = [];
        this.cdr.detectChanges();
      }
    });
  }

  clearSearch() {
    this.searchKeyword = '';
    this.isSearching = true;
    this.searchSubject.next('');
  }

  private readonly highlightMlCategories = ['FLORA', 'FAUNA', 'CLIMATE', 'GEOLOGY', 'HISTORY'] as const;

  applyMlHighlightCategory(raw: string): void {
    const normalized = this.normalizeMlCategory(raw);
    if (normalized) {
      this.currentHighlight.category = normalized;
      this.errorMessage = '';
      this.cdr.detectChanges();
    }
  }

  applyMlHighlightTags(tags: string[]): void {
    this.currentHighlight.tags = this.normalizeHighlightTags(tags);
    this.errorMessage = '';
    this.cdr.detectChanges();
  }

  private normalizeMlCategory(raw: string): CampHighlight['category'] | null {
    const u = String(raw || '').trim().toUpperCase().replace(/\s+/g, '_');
    if ((this.highlightMlCategories as readonly string[]).includes(u)) return u as CampHighlight['category'];
    const compact = u.replace(/[^A-Z]/g, '');
    for (const code of this.highlightMlCategories) {
      if (compact === code || u.includes(code)) return code as CampHighlight['category'];
    }
    if (u.includes('FLORA') || u.includes('PLANT') || u.includes('BOTAN')) return 'FLORA';
    if (u.includes('FAUNA') || u.includes('WILD') || u.includes('ANIMAL')) return 'FAUNA';
    if (u.includes('CLIMATE') || u.includes('WEATHER')) return 'CLIMATE';
    if (u.includes('GEOLOGY') || u.includes('ROCK') || u.includes('TERRAIN')) return 'GEOLOGY';
    if (u.includes('HISTORY') || u.includes('HISTORIC')) return 'HISTORY';
    return null;
  }

  openCreateForm() {
    this.resetForm();
    this.errorMessage = '';
    this.showForm = true;
  }

  editHighlight(highlight: CampHighlight) {
    this.currentHighlight = { ...highlight };
    this.errorMessage = '';
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
      isPublished: this.currentHighlight.isPublished ?? true,
      tags: this.normalizeHighlightTags(this.currentHighlight.tags)
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
        this.loadSiteStats();
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
      next: () => {
        this.loadHighlights();
        this.loadSiteStats();
      },
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
      tags: [],
      siteId: this.selectedSiteId ?? undefined
    };
  }

  private normalizeHighlightTags(tags?: string[] | null): string[] {
    const normalized: string[] = [];
    for (const raw of tags ?? []) {
      const tag = String(raw || '').trim().replace(/^#/, '');
      if (tag && !normalized.some((current) => current.toLowerCase() === tag.toLowerCase())) {
        normalized.push(tag);
      }
    }
    return normalized.slice(0, 8);
  }
}
