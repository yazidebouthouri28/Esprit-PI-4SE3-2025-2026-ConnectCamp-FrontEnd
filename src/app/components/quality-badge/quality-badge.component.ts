import {
  Component, Input, OnInit, OnChanges,
  SimpleChanges, ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { QualityScoreService, ProductQualityScore, QualityBadge, BadgeConfig } from '../../services/quality-score.service';

/**
 * <app-quality-badge [productId]="product.id" size="sm|md|lg">
 *
 * productId accepte string OU number (l'API renvoie des Long, le marketplace
 * stocke des string — les deux sont supportés).
 *
 * Sizes:
 *   sm  — chip seul (emoji + label), pas d'anneau
 *   md  — chip + anneau SVG animé (default)
 *   lg  — chip + anneau + tooltip breakdown au hover
 */
@Component({
  selector: 'app-quality-badge',
  standalone: true,
  imports: [CommonModule],
  // Default (pas OnPush) pour garantir le rendu après la réponse HTTP async
  template: `
    <!-- Skeleton pendant le chargement -->
    <span *ngIf="!score && !loadFailed"
          class="inline-block w-16 h-5 bg-gray-200 rounded-full animate-pulse">
    </span>

    <!-- Pas de score disponible (erreur ou id invalide) -->
    <span *ngIf="loadFailed" class="inline-flex items-center gap-1 px-2 py-0.5
          rounded-full border border-gray-200 bg-gray-50 text-gray-400 text-xs font-medium">
      — N/A
    </span>

    <ng-container *ngIf="score && !loadFailed">

      <!-- SM : chip seul -->
      <span *ngIf="size === 'sm'"
            [ngClass]="[cfg.tailwindBg, cfg.tailwindText, cfg.tailwindBorder]"
            class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full
                   border text-xs font-bold leading-none select-none whitespace-nowrap">
        {{ cfg.emoji }} {{ cfg.label }}
      </span>

      <!-- MD / LG : anneau SVG + chip -->
      <div *ngIf="size !== 'sm'"
           class="relative inline-flex items-center gap-2 group">

        <!-- Anneau de score -->
        <div class="relative flex-shrink-0"
             [style.width.px]="ringSize" [style.height.px]="ringSize">
          <svg [attr.width]="ringSize" [attr.height]="ringSize"
               class="rotate-[-90deg]">
            <!-- Piste -->
            <circle [attr.cx]="ringSize/2" [attr.cy]="ringSize/2" [attr.r]="radius"
                    fill="none" stroke="#e5e7eb" [attr.stroke-width]="strokeW"/>
            <!-- Progression -->
            <circle [attr.cx]="ringSize/2" [attr.cy]="ringSize/2" [attr.r]="radius"
                    fill="none"
                    [attr.stroke]="arcColor"
                    [attr.stroke-width]="strokeW"
                    stroke-linecap="round"
                    [attr.stroke-dasharray]="circumference"
                    [attr.stroke-dashoffset]="dashOffset"
                    style="transition: stroke-dashoffset 0.7s ease-out"/>
          </svg>
          <!-- Chiffre -->
          <div class="absolute inset-0 flex items-center justify-center">
            <span class="font-black leading-none"
                  [ngClass]="cfg.tailwindText"
                  [style.font-size.px]="ringSize * 0.28">
              {{ score.overallScore }}
            </span>
          </div>
        </div>

        <!-- Chip badge -->
        <span [ngClass]="[cfg.tailwindBg, cfg.tailwindText, cfg.tailwindBorder]"
              class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full
                     border font-bold leading-none select-none whitespace-nowrap"
              [style.font-size.px]="size === 'lg' ? 13 : 11">
          {{ cfg.emoji }} {{ cfg.label }}
        </span>

        <!-- LG : tooltip breakdown -->
        <div *ngIf="size === 'lg'"
             class="absolute bottom-full left-0 mb-2 w-52 bg-white rounded-xl
                    shadow-xl border border-gray-100 p-3 z-50
                    opacity-0 pointer-events-none scale-95
                    group-hover:opacity-100 group-hover:pointer-events-auto group-hover:scale-100
                    transition-all duration-200 origin-bottom-left">
          <p class="text-xs font-bold text-gray-700 mb-2">Détail du score</p>
          <div class="space-y-1.5">
            <div *ngFor="let row of breakdownRows"
                 class="flex items-center justify-between gap-2">
              <span class="text-xs text-gray-500 w-28 truncate">{{ row.label }}</span>
              <div class="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div class="h-full rounded-full"
                     [style.width.%]="row.pct"
                     [style.transition]="'width 0.5s ease-out'"
                     [ngClass]="row.pct >= 70 ? 'bg-emerald-400'
                              : row.pct >= 40 ? 'bg-amber-400'
                              :                 'bg-red-400'">
                </div>
              </div>
              <span class="text-xs font-bold text-gray-700 w-10 text-right">
                {{ row.value }}/{{ row.max }}
              </span>
            </div>
          </div>
          <!-- Flèche -->
          <div class="absolute -bottom-1.5 left-4 w-3 h-3 bg-white border-r border-b
                      border-gray-100 rotate-45"></div>
        </div>

      </div>
    </ng-container>
  `
})
export class QualityBadgeComponent implements OnInit, OnChanges {

  /** Accepte string OU number — le composant normalise en interne */
  @Input() productId!: string | number;
  @Input() size: 'sm' | 'md' | 'lg' = 'md';

  score: ProductQualityScore | null = null;
  cfg!: BadgeConfig;
  loadFailed = false;

  readonly strokeW = 4;

  get ringSize(): number  { return this.size === 'lg' ? 52 : 40; }
  get radius(): number    { return this.ringSize / 2 - this.strokeW; }
  get circumference(): number { return 2 * Math.PI * this.radius; }

  get dashOffset(): number {
    if (!this.score) return this.circumference;
    return this.circumference * (1 - this.score.overallScore / 100);
  }

  readonly arcColors: Record<QualityBadge, string> = {
    EXCELLENT:         '#f59e0b',
    GOOD:              '#60a5fa',
    AVERAGE:           '#fb923c',
    NEEDS_IMPROVEMENT: '#9ca3af'
  };

  get arcColor(): string {
    return this.score ? this.arcColors[this.score.badge] : '#e5e7eb';
  }

  get breakdownRows() {
    if (!this.score?.breakdown) return [];
    const b = this.score.breakdown;
    return [
      { label: 'Complétude',  value: b.completenessScore, max: 25, pct: (b.completenessScore / 25) * 100 },
      { label: 'Médias',       value: b.mediaScore,        max: 15, pct: (b.mediaScore        / 15) * 100 },
      { label: 'Avis clients', value: b.reviewScore,       max: 25, pct: (b.reviewScore       / 25) * 100 },
      { label: 'Performance',  value: b.performanceScore,  max: 20, pct: (b.performanceScore  / 20) * 100 },
      { label: 'Vendeur',      value: b.sellerScore,       max: 15, pct: (b.sellerScore       / 15) * 100 },
    ];
  }

  constructor(
    private qService: QualityScoreService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void  { this.load(); }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['productId'] && !changes['productId'].firstChange) {
      this.load();
    }
  }

  private load(): void {
    const numId = this.resolveNumericId();
    if (!numId) {
      this.loadFailed = true;
      return;
    }

    this.score      = null;
    this.loadFailed = false;

    this.qService.getScore(numId).subscribe({
      next: s => {
        // Vérifie que le score est valide (pas un fallback vide)
        if (s && s.overallScore >= 0 && s.badge) {
          this.score      = s;
          this.cfg        = this.qService.getBadgeConfig(s.badge);
          this.loadFailed = false;
        } else {
          this.loadFailed = true;
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadFailed = true;
        this.cdr.markForCheck();
      }
    });
  }

  /**
   * Normalise productId (string | number) → number.
   * Retourne null si l'id est invalide (vide, NaN, 0).
   */
  private resolveNumericId(): number | null {
    if (this.productId === null || this.productId === undefined) return null;
    const n = typeof this.productId === 'number'
      ? this.productId
      : parseInt(String(this.productId), 10);
    return isNaN(n) || n <= 0 ? null : n;
  }
}
