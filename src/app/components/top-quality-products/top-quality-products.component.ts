import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QualityScoreService, ProductQualityScore } from '../../services/quality-score.service';
import { QualityBadgeComponent } from '../quality-badge/quality-badge.component';

@Component({
  selector: 'app-top-quality-products',
  standalone: true,
  imports: [CommonModule, QualityBadgeComponent],
  template: `
    <section class="w-full py-8">

      <!-- Section header -->
      <div class="flex items-center justify-between mb-5 px-1">
        <div class="flex items-center gap-3">
          <span class="text-2xl">🏆</span>
          <div>
            <h2 class="text-lg font-black text-forest-green leading-tight">
              Produits en vedette
            </h2>
            <p class="text-xs text-olive-green">Sélectionnés par score qualité</p>
          </div>
        </div>
        <span class="text-xs text-gray-400 font-medium hidden sm:block">
          Score calculé sur complétude · médias · avis · performance · vendeur
        </span>
      </div>

      <!-- Skeleton strip -->
      <div *ngIf="isLoading" class="flex gap-4 overflow-x-auto pb-2">
        <div *ngFor="let _ of skeletons"
             class="flex-shrink-0 w-48 rounded-2xl overflow-hidden bg-gray-100 animate-pulse">
          <div class="h-36 bg-gray-200"></div>
          <div class="p-3 space-y-2">
            <div class="h-3 bg-gray-200 rounded w-3/4"></div>
            <div class="h-2 bg-gray-200 rounded w-full"></div>
            <div class="flex gap-1">
              <div class="h-4 w-10 bg-gray-200 rounded-full"></div>
              <div class="h-4 w-10 bg-gray-200 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div *ngIf="!isLoading && topProducts.length === 0"
           class="text-center py-10 text-gray-400 text-sm">
        Aucun produit classé pour le moment.
      </div>

      <!-- Product cards strip -->
      <div *ngIf="!isLoading && topProducts.length > 0"
           class="flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory
                  scrollbar-thin scrollbar-thumb-sage-green/30 scrollbar-track-transparent">

        <article *ngFor="let item of topProducts; let i = index"
                 (click)="viewProduct.emit(item.productId)"
                 class="flex-shrink-0 w-52 snap-start cursor-pointer group
                        relative rounded-2xl overflow-hidden
                        bg-white border border-gray-100 shadow-md
                        hover:shadow-xl hover:-translate-y-1
                        transition-all duration-300">

          <!-- Product photo -->
          <div class="relative h-36 overflow-hidden">
            <img
              [src]="getPhoto(item.productId, i)"
              [alt]="item.productName"
              class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              (error)="onImgError($event, i)"
            />
            <!-- Dark gradient overlay -->
            <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

            <!-- Rank ribbon (top-left) -->
            <div class="absolute top-0 left-0">
              <div class="w-9 h-9 flex items-center justify-center
                          font-black text-white text-sm leading-none rounded-br-xl"
                   [ngClass]="rankBg(i)">
                #{{ i + 1 }}
              </div>
            </div>

            <!-- Quality badge chip (top-right) -->
            <div class="absolute top-2 right-2">
              <app-quality-badge [productId]="item.productId" size="sm"></app-quality-badge>
            </div>

            <!-- Score overlaid on bottom of image -->
            <div class="absolute bottom-2 left-3 flex items-center gap-1.5">
              <svg width="28" height="28" class="rotate-[-90deg] flex-shrink-0">
                <circle cx="14" cy="14" r="11"
                        fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="3"/>
                <circle cx="14" cy="14" r="11"
                        fill="none"
                        [attr.stroke]="arcColorHex(item.badge)"
                        stroke-width="3"
                        stroke-linecap="round"
                        [attr.stroke-dasharray]="69.1"
                        [attr.stroke-dashoffset]="69.1 * (1 - item.overallScore / 100)"
                        style="transition: stroke-dashoffset 0.7s ease-out"/>
              </svg>
              <span class="text-white font-black text-sm drop-shadow">
                {{ item.overallScore }}<span class="text-xs font-normal opacity-75">/100</span>
              </span>
            </div>
          </div>

          <!-- Info -->
          <div class="p-3">
            <p class="text-xs font-bold text-forest-green line-clamp-2 mb-2 leading-snug
                       group-hover:text-olive-green transition-colors">
              {{ item.productName }}
            </p>

            <!-- Score bar -->
            <div class="flex items-center gap-2 mb-2">
              <div class="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div class="h-full rounded-full"
                     [style.width.%]="item.overallScore"
                     [style.transition]="'width 0.7s ease-out'"
                     [ngClass]="barColor(item.badge)">
                </div>
              </div>
              <span class="text-xs font-black" [ngClass]="textColor(item.badge)">
                {{ item.overallScore }}
              </span>
            </div>

            <!-- Breakdown micro pills -->
            <div class="flex flex-wrap gap-1">
              <span *ngFor="let row of miniBreakdown(item)"
                    class="text-[10px] px-1.5 py-0.5 rounded-full font-semibold leading-none"
                    [ngClass]="row.pct >= 70 ? 'bg-emerald-100 text-emerald-700'
                              : row.pct >= 40 ? 'bg-amber-100 text-amber-700'
                              :                  'bg-red-100 text-red-600'">
                {{ row.icon }} {{ row.pct | number:'1.0-0' }}%
              </span>
            </div>
          </div>

        </article>

      </div>
    </section>
  `
})
export class TopQualityProductsComponent implements OnInit {

  @Output() viewProduct = new EventEmitter<number>();

  topProducts: ProductQualityScore[] = [];
  isLoading = true;
  readonly skeletons = Array(5);

  /**
   * Pool de photos camping Unsplash — libres de droits, variées.
   * On pioche dedans de façon déterministe selon l'index de la card
   * pour éviter que les images changent à chaque re-render.
   */
  private readonly campingPhotos: string[] = [
    'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=400&q=80', // tente forêt
    'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=400&q=80', // feu de camp
    'https://images.unsplash.com/photo-1487730116645-74489c95b41b?w=400&q=80', // sac de couchage
    'https://images.unsplash.com/photo-1510312305653-8ed496efae75?w=400&q=80', // randonnée montagne
    'https://images.unsplash.com/photo-1445308394109-4ec2920981b1?w=400&q=80', // lanterne camping
    'https://images.unsplash.com/photo-1537225228614-56cc3556d7ed?w=400&q=80', // matelas sol
    'https://images.unsplash.com/photo-1533240332313-0db49b459ad6?w=400&q=80', // tente nuit étoilée
    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&q=80', // paysage montagne
    'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?w=400&q=80', // tente lac
    'https://images.unsplash.com/photo-1496545672447-f699b503d270?w=400&q=80', // bivouac coucher soleil
    'https://images.unsplash.com/photo-1571863533956-01c88e79957e?w=400&q=80', // cuisine camp
    'https://images.unsplash.com/photo-1544198365-f5d60b6d8190?w=400&q=80', // randonnée sac dos
    'https://images.unsplash.com/photo-1452421822248-d4c2b47f0c81?w=400&q=80', // tente désert
    'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?w=400&q=80', // lac montagne
    'https://images.unsplash.com/photo-1532339142463-fd0a8979791a?w=400&q=80', // forêt brumeuse
  ];

  // Cache photo par productId pour stabilité
  private photoCache = new Map<number, string>();

  constructor(private qService: QualityScoreService) {}

  ngOnInit(): void {
    this.qService.getTopQualityProducts(0, 10).subscribe({
      next:  list => { this.topProducts = list; this.isLoading = false; },
      error: ()   => { this.isLoading = false; }
    });
  }

  /** Retourne une photo déterministe par productId (pas aléatoire à chaque CD) */
  getPhoto(productId: number, index: number): string {
    if (this.photoCache.has(productId)) return this.photoCache.get(productId)!;
    // Utilise le productId comme graine pour toujours avoir la même photo
    const idx = productId % this.campingPhotos.length;
    const photo = this.campingPhotos[idx];
    this.photoCache.set(productId, photo);
    return photo;
  }

  /** Fallback si l'image ne charge pas */
  onImgError(event: Event, index: number): void {
    const img = event.target as HTMLImageElement;
    const fallbackIdx = (index + 3) % this.campingPhotos.length;
    img.src = this.campingPhotos[fallbackIdx];
  }

  arcColorHex(badge: string): string {
    const map: Record<string, string> = {
      EXCELLENT: '#f59e0b', GOOD: '#60a5fa',
      AVERAGE: '#fb923c',  NEEDS_IMPROVEMENT: '#9ca3af'
    };
    return map[badge] ?? '#9ca3af';
  }

  rankBg(index: number): string {
    const classes = ['bg-amber-500', 'bg-gray-400', 'bg-orange-400'];
    return classes[index] ?? 'bg-forest-green';
  }

  barColor(badge: string): string {
    const map: Record<string, string> = {
      EXCELLENT: 'bg-amber-400', GOOD: 'bg-blue-400',
      AVERAGE: 'bg-orange-400',  NEEDS_IMPROVEMENT: 'bg-gray-400'
    };
    return map[badge] ?? 'bg-gray-400';
  }

  textColor(badge: string): string {
    const map: Record<string, string> = {
      EXCELLENT: 'text-amber-600', GOOD: 'text-blue-600',
      AVERAGE: 'text-orange-500',  NEEDS_IMPROVEMENT: 'text-gray-400'
    };
    return map[badge] ?? 'text-gray-400';
  }

  miniBreakdown(item: ProductQualityScore) {
    const b = item.breakdown;
    return [
      { icon: '📝', pct: (b.completenessScore / 25) * 100 },
      { icon: '🖼️', pct: (b.mediaScore        / 15) * 100 },
      { icon: '⭐', pct: (b.reviewScore        / 25) * 100 },
      { icon: '📈', pct: (b.performanceScore   / 20) * 100 },
      { icon: '🏪', pct: (b.sellerScore        / 15) * 100 },
    ];
  }
}
