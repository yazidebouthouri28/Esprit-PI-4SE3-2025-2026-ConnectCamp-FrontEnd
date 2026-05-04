import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VirtualTourService } from '../../../services/virtual-tour.service';
import { VirtualTour, Scene360 } from '../../../models/camping.models';

@Component({
  selector: 'app-site-virtual-tours',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-8 animate-fade-in">
      <div class="flex justify-between items-center">
        <div>
          <h3 class="text-lg font-black text-[#1a2e1a]">Virtual Experiences</h3>
          <p class="text-xs text-[#617152] font-medium">Create 360° panoramic tours for this campsite.</p>
        </div>
        <button (click)="openCreateTourForm()" class="px-4 py-2 bg-[#2C4A3C] text-white rounded-lg text-xs font-black uppercase tracking-widest hover:bg-[#1a2e1a] transition-all">
          New Tour
        </button>
      </div>

      <p *ngIf="loadError" class="text-xs font-bold text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
        {{ loadError }}
      </p>

      <div *ngFor="let tour of tours" class="bg-gray-50 border border-gray-200 rounded-2xl p-6 space-y-6 shadow-sm">
        <div class="flex justify-between items-center border-b border-gray-200 pb-4">
          <h4 class="font-black text-[#1a2e1a] flex items-center gap-2">
            <span class="text-xl">🌐</span> {{ tour.title }}
          </h4>
          <div class="flex items-center gap-2">
            <button type="button" (click)="startEditTour(tour)" title="Edit Tour"
              class="w-8 h-8 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-600 flex items-center justify-center transition-colors">
              ✏️
            </button>
            <button type="button" (click)="deleteTour(tour.id)" title="Delete Tour"
              class="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 flex items-center justify-center transition-colors">
              🗑️
            </button>
            <button type="button" (click)="selectedTour = tour" class="text-xs font-black text-emerald-600 uppercase tracking-widest ml-2">+ Add Scene</button>
          </div>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div *ngFor="let scene of tour.scenes" class="relative group bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
            <div class="h-28 bg-gray-200 relative">
               <img [src]="scene.thumbnailUrl || scene.panoramaUrl" class="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity">
               <button type="button" (click)="openPanorama(scene.panoramaUrl || scene.imageUrl)"
                 class="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/40 transition-colors">
                 <span class="px-3 py-1 rounded-full bg-[#2C4A3C] text-white text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 shadow-lg">360° View</span>
               </button>
            </div>
            <div class="p-3 flex justify-between items-start">
              <div>
                <p class="text-[10px] font-black text-[#1a2e1a] truncate">{{ scene.name }}</p>
                <p class="text-[8px] text-gray-400 uppercase font-black tracking-tighter">Order: {{ scene.sceneOrder }}</p>
              </div>
              <button type="button" (click)="deleteScene(scene.id)" title="Delete Scene"
                class="w-6 h-6 rounded-md bg-red-50 hover:bg-red-100 text-red-400 flex items-center justify-center text-xs transition-colors opacity-0 group-hover:opacity-100">
                🗑️
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Create Tour Modal -->
      <div *ngIf="showCreateTour" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-2xl p-8 max-w-lg w-full shadow-2xl space-y-6 border border-[#e9e6df]">
          <h2 class="text-xl font-black text-[#1a2e1a]">New 360° virtual tour</h2>
          <p class="text-xs text-[#617152] -mt-4">Add a title and optional cover image. Then use <strong>+ Add Scene</strong> to import equirectangular panoramas and open them in the 360° viewer.</p>
          <div class="space-y-4">
            <div>
              <label class="block text-xs font-bold text-gray-400 uppercase mb-1">Tour title</label>
              <input [(ngModel)]="createTourForm.title" placeholder="e.g. Lake overlook, Main trail"
                class="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#2C4A3C]/20">
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-400 uppercase mb-1">Description</label>
              <textarea [(ngModel)]="createTourForm.description" rows="3"
                class="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#2C4A3C]/20"
                placeholder="What visitors will see in this tour"></textarea>
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-400 uppercase mb-1">Thumbnail (optional)</label>
              <div class="flex items-center gap-3">
                <input #tourThumbInput type="file" accept="image/*" class="hidden"
                  (change)="onTourThumbnailSelected($event)">
                <button type="button" (click)="tourThumbInput.click()"
                  class="px-4 py-2 bg-[#2C4A3C] text-white rounded-lg text-xs font-black uppercase tracking-widest hover:bg-[#1a2e1a] transition-all">
                  + Import Thumbnail
                </button>
                <span class="text-xs text-[#617152] font-bold" *ngIf="createTourForm.thumbnailUrl && !isUploadingThumb">
                  Image selected
                </span>
                <span class="text-xs text-amber-500 font-bold" *ngIf="isUploadingThumb">
                  Uploading...
                </span>
                <span class="text-xs text-gray-400 font-bold" *ngIf="!createTourForm.thumbnailUrl && !isUploadingThumb">
                  No image selected
                </span>
              </div>
              <div *ngIf="createTourForm.thumbnailUrl && !isUploadingThumb"
                class="mt-3 inline-block relative rounded-xl overflow-hidden border border-gray-200 bg-white">
                <img [src]="createTourForm.thumbnailUrl" alt="Tour thumbnail preview" class="w-40 h-24 object-cover">
                <button type="button" (click)="clearTourThumbnail()"
                  class="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white text-xs font-black">
                  x
                </button>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <input id="featuredTour" type="checkbox" [(ngModel)]="createTourForm.isFeatured">
              <label for="featuredTour" class="text-xs font-bold text-gray-500 uppercase tracking-widest">
                Mark as featured
              </label>
            </div>
          </div>
          <div class="flex justify-end gap-3 pt-4">
            <button (click)="closeCreateTourForm()"
              class="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-700">Cancel</button>
            <button (click)="createNewTour()" [disabled]="isCreatingTour || isUploadingThumb"
              class="px-6 py-2 bg-[#2C4A3C] text-white rounded-lg text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed">
              {{ isCreatingTour ? 'Creating...' : 'Create Tour' }}
            </button>
          </div>
          <p *ngIf="tourActionError" class="text-xs font-bold text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {{ tourActionError }}
          </p>
        </div>
      </div>

      <!-- Edit Tour Modal -->
      <div *ngIf="editingTour" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl space-y-6">
          <h2 class="text-xl font-bold text-[#1a2e1a]">Edit Tour</h2>
          <div class="space-y-4">
            <div>
              <label class="block text-xs font-bold text-gray-400 uppercase mb-1">Tour Title</label>
              <input [(ngModel)]="editingTour.title" class="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm outline-none">
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-400 uppercase mb-1">Description</label>
              <textarea [(ngModel)]="editingTour.description" rows="2" class="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm outline-none"></textarea>
            </div>
          </div>
          <div class="flex justify-end gap-3 pt-4">
            <button (click)="editingTour = null" class="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-700">Cancel</button>
            <button (click)="saveEditTour()" class="px-6 py-2 bg-[#2C4A3C] text-white rounded-lg text-sm font-bold">Save Changes</button>
          </div>
        </div>
      </div>

      <!-- Add Scene Modal -->
      <div *ngIf="selectedTour" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-2xl p-8 max-w-lg w-full shadow-2xl space-y-6 border border-[#e9e6df]">
          <h2 class="text-xl font-black text-[#1a2e1a]">New 360° scene</h2>
          <p class="text-xs text-[#617152] -mt-4">Use a full equirectangular panorama (2:1). After adding, open <strong>360° View</strong> on the scene card for a Street View–style experience.</p>
          <div class="space-y-4">
            <div>
              <label class="block text-xs font-bold text-gray-400 uppercase mb-1">Scene name</label>
              <input [(ngModel)]="newScene.name" placeholder="e.g. Entrance, Summit" class="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm outline-none">
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-400 uppercase mb-1">Panorama (equirectangular 360°)</label>
              <div class="flex items-center gap-3">
                <input #sceneImageInput type="file" accept="image/*" class="hidden"
                  (change)="onScenePanoramaSelected($event)">
                <button type="button" (click)="sceneImageInput.click()"
                  class="px-4 py-2 bg-[#2C4A3C] text-white rounded-lg text-xs font-black uppercase tracking-widest hover:bg-[#1a2e1a] transition-all">
                  + Import Panorama
                </button>
                <span class="text-xs text-[#617152] font-bold" *ngIf="newScene.panoramaUrl && !isUploadingScene">
                  Image selected
                </span>
                <span class="text-xs text-amber-500 font-bold" *ngIf="isUploadingScene">
                  Uploading...
                </span>
                <span class="text-xs text-gray-400 font-bold" *ngIf="!newScene.panoramaUrl && !isUploadingScene">
                  No image selected
                </span>
              </div>
              <div *ngIf="newScene.panoramaUrl && !isUploadingScene"
                class="mt-3 flex flex-wrap items-center gap-3">
                <div class="relative rounded-xl overflow-hidden border border-gray-200 bg-white">
                  <img [src]="newScene.panoramaUrl" alt="Scene preview" class="w-40 h-24 object-cover">
                  <button type="button" (click)="clearScenePanorama()"
                    class="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white text-xs font-black">
                    x
                  </button>
                </div>
                <button type="button" (click)="openPanorama(newScene.panoramaUrl!)"
                  class="px-4 py-2 bg-[#1F4D36] text-white rounded-lg text-xs font-black uppercase tracking-widest">
                  Preview 360°
                </button>
              </div>
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-400 uppercase mb-1">Display Order</label>
              <input type="number" [(ngModel)]="newScene.sceneOrder" class="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm outline-none">
            </div>
          </div>
          <div class="flex justify-end gap-3 pt-4">
            <button type="button" (click)="selectedTour = null" class="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-700">Cancel</button>
            <button type="button" (click)="addScene()" [disabled]="isUploadingScene" class="px-6 py-2 bg-[#2C4A3C] text-white rounded-lg text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed">Add Scene</button>
          </div>
        </div>
      </div>

      <!-- Fullscreen 360° viewer (Pannellum) -->
      <div *ngIf="showPanorama" class="fixed inset-0 z-[100] bg-black/90 flex flex-col p-4 sm:p-6">
        <div class="flex justify-between items-center mb-3">
          <p class="text-white text-sm font-black uppercase tracking-widest">360° panorama</p>
          <button type="button" (click)="closePanorama()"
            class="px-4 py-2 rounded-xl bg-white/10 text-white text-xs font-black uppercase tracking-widest hover:bg-white/20">
            Close
          </button>
        </div>
        <div id="admin-pannellum-host" class="flex-1 min-h-[50vh] rounded-2xl overflow-hidden border border-white/10 bg-black"></div>
      </div>
    </div>
  `
})
export class SiteVirtualToursComponent implements OnInit, OnChanges {
  @Input() siteId!: number;
  tours: VirtualTour[] = [];
  loadError = '';
  tourActionError = '';
  isCreatingTour = false;
  selectedTour: VirtualTour | null = null;
  editingTour: VirtualTour | null = null;
  newScene: Partial<Scene360> = { sceneOrder: 0 };
  showCreateTour = false;
  createTourForm: Partial<VirtualTour> = {};
  showPanorama = false;
  isUploadingThumb = false;
  isUploadingScene = false;
  private panoViewer: { destroy?: () => void } | null = null;

  constructor(private tourService: VirtualTourService) { }

  ngOnInit() {
    this.loadTours();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['siteId'] && !changes['siteId'].firstChange) {
      this.loadTours();
    }
  }

  loadTours() {
    if (!this.siteId) {
      this.tours = [];
      this.loadError = '';
      return;
    }
    this.tourService.getToursBySite(this.siteId).subscribe({
      next: (tours) => {
        this.tours = tours;
        this.loadError = '';
      },
      error: (error) => {
        this.tours = [];
        this.loadError = error?.message || 'Unable to load virtual tours.';
      }
    });
  }

  openCreateTourForm() {
    this.createTourForm = { title: '', description: '', isFeatured: false };
    this.tourActionError = '';
    this.isCreatingTour = false;
    this.showCreateTour = true;
  }

  closeCreateTourForm() {
    this.showCreateTour = false;
    this.tourActionError = '';
    this.isCreatingTour = false;
  }

  createNewTour() {
    const title = (this.createTourForm.title || '').trim();
    if (title.length < 3) {
      this.tourActionError = 'Tour title must contain at least 3 characters.';
      return;
    }

    if (!this.siteId) {
      this.tourActionError = 'No campsite selected for this virtual tour.';
      return;
    }

    this.tourActionError = '';
    this.isCreatingTour = true;
    this.tourService.createTour(this.siteId, { ...this.createTourForm, title }).subscribe({
      next: () => {
        this.showCreateTour = false;
        this.loadTours();
      },
      error: (error) => {
        this.tourActionError = error?.message || 'Unable to create virtual tour.';
        this.isCreatingTour = false;
      },
      complete: () => {
        this.isCreatingTour = false;
      }
    });
  }

  onTourThumbnailSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      input.value = '';
      return;
    }

    this.isUploadingThumb = true;
    this.tourService.uploadFile(file).subscribe({
      next: (res) => {
        this.createTourForm.thumbnailUrl = 'http://localhost:8089/uploads/' + res.data.fileName;
        this.isUploadingThumb = false;
      },
      error: () => {
        this.tourActionError = 'Failed to upload thumbnail.';
        this.isUploadingThumb = false;
      }
    });
    input.value = '';
  }

  clearTourThumbnail() {
    this.createTourForm.thumbnailUrl = undefined;
  }

  startEditTour(tour: VirtualTour) {
    this.editingTour = { ...tour };
  }

  saveEditTour() {
    if (!this.editingTour) return;
    this.tourService.updateTour(this.editingTour.id, this.siteId, this.editingTour)
      .subscribe(() => {
        this.editingTour = null;
        this.loadTours();
      });
  }

  deleteTour(id: number) {
    if (confirm('Permanently delete this tour and all its scenes?')) {
      this.tourService.deleteTour(id).subscribe(() => this.loadTours());
    }
  }

  deleteScene(sceneId: number) {
    if (confirm('Delete this scene?')) {
      this.tourService.deleteScene(sceneId).subscribe(() => this.loadTours());
    }
  }

  addScene() {
    if (this.selectedTour && this.newScene.name && this.newScene.panoramaUrl) {
      const scene = {
        ...this.newScene,
        title: this.newScene.name,
        imageUrl: this.newScene.panoramaUrl,
        virtualTourId: this.selectedTour.id
      } as Scene360;
      this.tourService.createScene(scene).subscribe(() => {
        this.loadTours();
        this.selectedTour = null;
        this.newScene = { sceneOrder: 0 };
      });
    }
  }

  onScenePanoramaSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      input.value = '';
      return;
    }

    this.isUploadingScene = true;
    this.tourService.uploadFile(file).subscribe({
      next: (res) => {
        const url = 'http://localhost:8089/uploads/' + res.data.fileName;
        this.newScene.panoramaUrl = url;
        this.newScene.thumbnailUrl = url;
        this.isUploadingScene = false;
      },
      error: () => {
        alert('Failed to upload panorama image');
        this.isUploadingScene = false;
      }
    });
    input.value = '';
  }

  clearScenePanorama() {
    this.newScene.panoramaUrl = undefined;
    this.newScene.thumbnailUrl = undefined;
  }

  openPanorama(url?: string): void {
    const u = (url || '').trim();
    if (!u) return;
    this.closePanorama();
    this.showPanorama = true;
    setTimeout(() => this.initPannellum(u), 50);
  }

  closePanorama(): void {
    if (this.panoViewer && typeof this.panoViewer.destroy === 'function') {
      try {
        this.panoViewer.destroy();
      } catch { /* noop */ }
    }
    this.panoViewer = null;
    this.showPanorama = false;
    const host = document.getElementById('admin-pannellum-host');
    if (host) host.innerHTML = '';
  }

  private initPannellum(panoramaUrl: string): void {
    const host = document.getElementById('admin-pannellum-host');
    if (!host) return;
    host.innerHTML = '';
    const innerId = 'admin-pannellum-inner';
    const box = document.createElement('div');
    box.id = innerId;
    box.className = 'w-full h-full min-h-[420px]';
    host.appendChild(box);

    const g = window as unknown as { pannellum?: { viewer: (id: string, config: Record<string, unknown>) => { destroy?: () => void } } };
    if (!g.pannellum) {
      host.innerHTML = '<p class="text-white p-4 text-sm">360° viewer failed to load. Check your network and refresh.</p>';
      return;
    }
    try {
      this.panoViewer = g.pannellum.viewer(innerId, {
        type: 'equirectangular',
        panorama: panoramaUrl,
        autoLoad: true,
        showControls: true,
        compass: true
      });
    } catch {
      host.innerHTML = '<p class="text-white p-4 text-sm">Could not open this image as a 360° panorama.</p>';
    }
  }
}
