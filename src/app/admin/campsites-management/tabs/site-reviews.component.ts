import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ReviewService } from '../../../services/review.service';
import { CampHighlightService } from '../../../services/camp-highlight.service';
import { Review, CampHighlight } from '../../../models/camping.models';

const HIGHLIGHT_FEEDBACK_PREFIX = 'camp_highlight_feedback_';

interface HighlightFeedbackStored {
  id: number;
  userName: string;
  comment: string;
  rating?: number;
  createdAt: string;
}

interface HighlightReviewRow extends HighlightFeedbackStored {
  highlightId: number;
  highlightTitle: string;
  highlightCategory?: string;
}

@Component({
  selector: 'app-site-reviews',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-10 animate-fade-in">
      <!-- Campsite reviews (API) -->
      <section class="space-y-4">
        <div class="flex justify-between items-center">
          <div>
            <h3 class="text-lg font-black text-[#1a2e1a]">Campsite reviews</h3>
            <p class="text-xs text-[#617152] font-medium">Ratings and comments left on this campsite listing.</p>
          </div>
          <span class="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest">
            {{ reviews.length }} total
          </span>
        </div>

        <div class="space-y-4">
          <div *ngFor="let review of reviews" class="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <div class="flex justify-between items-start mb-3">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-lg">
                  {{ review.userAvatar || '👤' }}
                </div>
                <div>
                  <p class="font-bold text-[#1a2e1a]">{{ review.userName || 'Anonymous Visitor' }}</p>
                  <p class="text-[10px] text-gray-400 font-bold tracking-widest uppercase">{{ review.createdAt | date:'mediumDate' }}</p>
                </div>
              </div>
              <div class="flex items-center gap-3">
                <div class="flex gap-1 text-orange-400">
                  <span *ngFor="let i of [1,2,3,4,5]" [class.opacity-30]="i > review.rating">⭐</span>
                </div>
                <div class="flex gap-1">
                  <button type="button" (click)="startEditReview(review)" title="Edit Review"
                    class="w-8 h-8 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-600 flex items-center justify-center transition-colors">
                    ✏️
                  </button>
                  <button type="button" (click)="deleteReview(review.id)" title="Delete Review"
                    class="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 flex items-center justify-center transition-colors">
                    🗑️
                  </button>
                </div>
              </div>
            </div>
            <p class="text-[10px] font-black text-[#2C4A3C] uppercase tracking-widest mb-2">Source: Campsite listing</p>
            <p class="text-sm text-[#617152] leading-relaxed italic">"{{ review.comment }}"</p>
          </div>

          <div *ngIf="reviews.length === 0" class="py-10 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
            <p class="text-gray-400 font-bold">No campsite reviews yet.</p>
          </div>
        </div>
      </section>

      <!-- Camp highlight feedback (browser storage, same keys as public highlight pages) -->
      <section class="space-y-4 border-t border-gray-200 pt-8">
        <div class="flex justify-between items-center">
          <div>
            <h3 class="text-lg font-black text-[#1a2e1a]">Camp highlight feedback</h3>
            <p class="text-xs text-[#617152] font-medium">Comments submitted on highlight pages for this site (stored per browser).</p>
          </div>
          <span class="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-[10px] font-black uppercase tracking-widest">
            {{ highlightRows.length }} total
          </span>
        </div>

        <div class="space-y-4">
          <div *ngFor="let row of highlightRows" class="p-6 bg-white border border-amber-100/80 rounded-2xl shadow-sm">
            <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div>
                <p class="text-[10px] font-black text-amber-700 uppercase tracking-widest">Highlight</p>
                <p class="font-black text-[#1a2e1a]">{{ row.highlightTitle }}</p>
                <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest">ID #{{ row.highlightId }} · {{ row.highlightCategory || '—' }}</p>
              </div>
              <p class="text-[10px] text-gray-400 font-bold tracking-widest uppercase">{{ row.createdAt | date:'mediumDate' }}</p>
            </div>
            <p class="text-xs font-bold text-[#1a2e1a] mb-1">{{ row.userName }}</p>
            <div *ngIf="row.rating" class="flex gap-0.5 text-orange-400 text-sm mb-2">
              <span *ngFor="let i of [1,2,3,4,5]" [class.opacity-30]="i > (row.rating || 0)">⭐</span>
            </div>
            <p class="text-sm text-[#617152] leading-relaxed italic">"{{ row.comment }}"</p>
          </div>

          <div *ngIf="highlightRows.length === 0" class="py-10 text-center bg-amber-50/40 rounded-2xl border-2 border-dashed border-amber-200/60">
            <p class="text-gray-500 font-bold text-sm">No highlight feedback stored for this campsite yet.</p>
            <p class="text-xs text-gray-400 mt-2 max-w-md mx-auto">Visitors submit these from each camp highlight detail page. They appear here on the same device/browser where they were saved.</p>
          </div>
        </div>
      </section>

      <div *ngIf="editingReview" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl space-y-6">
          <h2 class="text-xl font-bold text-[#1a2e1a]">Edit Review</h2>
          <div class="space-y-4">
            <div>
              <label class="block text-xs font-bold text-gray-400 uppercase mb-1">Rating (1-5)</label>
              <input type="number" [(ngModel)]="editingReview.rating" min="1" max="5"
                class="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm outline-none">
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-400 uppercase mb-1">Comment</label>
              <textarea [(ngModel)]="editingReview.comment" rows="3"
                class="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm outline-none"></textarea>
            </div>
          </div>
          <div class="flex justify-end gap-3 pt-4">
            <button type="button" (click)="editingReview = null" class="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-700">Cancel</button>
            <button type="button" (click)="saveEditReview()" class="px-6 py-2 bg-[#2C4A3C] text-white rounded-lg text-sm font-bold">Save Changes</button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class SiteReviewsComponent implements OnInit, OnChanges {
  @Input() siteId!: number;
  reviews: Review[] = [];
  highlightRows: HighlightReviewRow[] = [];
  editingReview: Review | null = null;

  constructor(
    private reviewService: ReviewService,
    private highlightService: CampHighlightService
  ) { }

  ngOnInit() {
    this.loadAll();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['siteId'] && !changes['siteId'].firstChange) {
      this.loadAll();
    }
  }

  loadAll(): void {
    if (!this.siteId) {
      this.reviews = [];
      this.highlightRows = [];
      return;
    }

    forkJoin({
      reviews: this.reviewService.getReviewsBySite(this.siteId).pipe(catchError(() => of([] as Review[]))),
      highlights: this.highlightService.getHighlightsBySite(this.siteId).pipe(catchError(() => of([] as CampHighlight[])))
    }).subscribe(({ reviews, highlights }) => {
      this.reviews = reviews;
      this.highlightRows = this.collectHighlightFeedback(highlights);
    });
  }

  private collectHighlightFeedback(highlights: CampHighlight[]): HighlightReviewRow[] {
    if (typeof window === 'undefined' || !highlights?.length) {
      return [];
    }

    const rows: HighlightReviewRow[] = [];
    for (const h of highlights) {
      try {
        const raw = localStorage.getItem(`${HIGHLIGHT_FEEDBACK_PREFIX}${h.id}`);
        const parsed = raw ? JSON.parse(raw) : [];
        const list: HighlightFeedbackStored[] = Array.isArray(parsed) ? parsed : [];
        for (const f of list) {
          rows.push({
            ...f,
            highlightId: h.id,
            highlightTitle: h.title || `Highlight #${h.id}`,
            highlightCategory: h.category
          });
        }
      } catch {
        /* ignore */
      }
    }
    rows.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    return rows;
  }

  startEditReview(review: Review) {
    this.editingReview = { ...review };
  }

  saveEditReview() {
    if (!this.editingReview) return;
    this.reviewService.updateReview(this.editingReview.id, this.siteId, this.editingReview)
      .subscribe(() => {
        this.editingReview = null;
        this.loadAll();
      });
  }

  deleteReview(id: number) {
    if (confirm('Permanently delete this review?')) {
      this.reviewService.deleteReview(id).subscribe(() => this.loadAll());
    }
  }
}
