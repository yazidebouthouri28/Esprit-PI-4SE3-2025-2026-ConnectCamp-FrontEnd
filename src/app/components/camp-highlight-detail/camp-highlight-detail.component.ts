import { ChangeDetectorRef, Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CampHighlight } from '../../models/camping.models';
import { CampHighlightService } from '../../services/camp-highlight.service';
import { AuthService } from '../../services/auth.service';

interface HighlightFeedback {
  id: number;
  siteId: number;
  highlightId: number;
  userName: string;
  comment: string;
  rating?: number;
  likes: number;
  dislikes: number;
  userReactions?: Record<string, 'LIKE' | 'DISLIKE'>;
  createdAt: string;
}

@Component({
  selector: 'app-camp-highlight-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './camp-highlight-detail.component.html',
  styleUrls: ['./camp-highlight-detail.component.css']
})
export class CampHighlightDetailComponent implements OnInit {
  siteId = 0;
  highlightId = 0;
  highlight: CampHighlight | null = null;
  isLoading = true;
  errorMessage = '';
  feedbackDraft = '';
  feedbackError = '';
  feedbackRating = 0;
  ratingStars = [1, 2, 3, 4, 5];
  feedbacks: HighlightFeedback[] = [];

  likes = 1;
  dislikes = 0;

  private readonly feedbackStoragePrefix = 'camp_highlight_feedback_';


  userReaction: 'LIKE' | 'DISLIKE' | null = null;
  isGalleryOpen = false;
  activeGalleryIndex = 0;
  galleryImages: string[] = [];

  toggleLike(): void {
    if (this.userReaction === 'LIKE') {
      this.userReaction = null;
      this.likes--;
    } else {
      if (this.userReaction === 'DISLIKE') {
        this.dislikes--;
      }
      this.userReaction = 'LIKE';
      this.likes++;
    }
  }

  toggleDislike(): void {
    if (this.userReaction === 'DISLIKE') {
      this.userReaction = null;
      this.dislikes--;
    } else {
      if (this.userReaction === 'LIKE') {
        this.likes--;
      }
      this.userReaction = 'DISLIKE';
      this.dislikes++;
    }
  }

  openGallery(index: number = 0): void {
    if (this.highlight?.imageUrl && !this.isVideoMedia(this.highlight.imageUrl)) {
      this.galleryImages = [this.highlight.imageUrl];
    } else if (this.highlight?.imageUrl) {
      /* Video: still open “gallery” with poster frame not ideal — skip or use logo */
      this.galleryImages = ['assets/images/logo.png'];
    } else {
      this.galleryImages = ['assets/images/logo.png'];
    }

    this.activeGalleryIndex = Math.min(Math.max(0, index), this.galleryImages.length - 1);
    this.isGalleryOpen = true;
    document.body.style.overflow = 'hidden';
    this.cdr.detectChanges();
  }

  closeGallery(): void {
    this.isGalleryOpen = false;
    document.body.style.overflow = '';
    this.cdr.detectChanges();
  }

  @HostListener('document:keydown.escape')
  onEscapeGallery(): void {
    if (this.isGalleryOpen) {
      this.closeGallery();
    }
  }

  onGalleryBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('gallery-backdrop')) {
      this.closeGallery();
    }
  }

  nextImage(): void {
    if (this.galleryImages.length > 0) {
      this.activeGalleryIndex = (this.activeGalleryIndex + 1) % this.galleryImages.length;
    }
  }

  prevImage(): void {
    if (this.galleryImages.length > 0) {
      this.activeGalleryIndex = (this.activeGalleryIndex - 1 + this.galleryImages.length) % this.galleryImages.length;
    }
  }


  constructor(
    private route: ActivatedRoute,
    private highlightService: CampHighlightService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.siteId = Number(params.get('siteId') || 0);
      this.highlightId = Number(params.get('highlightId') || 0);

      if (!this.highlightId) {
        this.errorMessage = 'Invalid highlight identifier.';
        this.isLoading = false;
        this.cdr.detectChanges();
        return;
      }

      this.loadHighlight(this.highlightId);
    });
  }

  private loadHighlight(highlightId: number): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.highlight = null;

    this.highlightService.getHighlightById(highlightId).subscribe({
      next: (highlight) => {
        this.highlight = highlight;
        if (!this.siteId && highlight.siteId) {
          this.siteId = highlight.siteId;
        }
        this.loadFeedbacks();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.errorMessage = error?.message || 'Unable to load camp highlight details.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  get canReview(): boolean {
    return this.authService.isAuthenticated() && !this.authService.isAdmin();
  }

  get showReviewLoginHint(): boolean {
    return !this.authService.isAuthenticated();
  }

  isVideoMedia(mediaUrl?: string): boolean {
    if (!mediaUrl) return false;
    if (mediaUrl.startsWith('data:')) {
      return mediaUrl.startsWith('data:video/');
    }
    const normalized = mediaUrl.split('?')[0].toLowerCase();
    return /\.(mp4|webm|ogg|mov|m4v)$/.test(normalized);
  }

  setDraftRating(star: number): void {
    if (star >= 1 && star <= 5) {
      this.feedbackRating = star;
    }
  }

  submitFeedback(): void {
    if (!this.canReview || !this.highlightId) return;

    const comment = this.feedbackDraft.trim();
    if (!comment) {
      this.feedbackError = 'Please write a comment.';
      return;
    }

    const currentUser = this.authService.getCurrentUser();
    const userName = currentUser?.name || currentUser?.username || 'Guest';

    const feedback: HighlightFeedback = {
      id: Date.now(),
      siteId: this.siteId,
      highlightId: this.highlightId,
      userName,
      comment,
      rating: this.feedbackRating,
      likes: 0,
      dislikes: 0,
      createdAt: new Date().toISOString()
    };

    this.feedbacks = [feedback, ...this.feedbacks];
    this.feedbackDraft = '';
    this.feedbackRating = 0;
    this.feedbackError = '';
    this.persistFeedbacks();
  }

  getFeedbackReaction(feedbackId: number): 'LIKE' | 'DISLIKE' | null {
    const target = this.feedbacks.find(f => f.id === feedbackId);
    if (!target || !target.userReactions) return null;
    const currentUser = this.authService.getCurrentUser();
    const userId = currentUser ? String(currentUser.id) : 'guest';
    return target.userReactions[userId] || null;
  }

  likeFeedback(feedbackId: number): void {
    const target = this.feedbacks.find((feedback) => feedback.id === feedbackId);
    if (!target) return;
    
    const currentUser = this.authService.getCurrentUser();
    const userId = currentUser ? String(currentUser.id) : 'guest';
    target.userReactions = target.userReactions || {};
    const currentReaction = target.userReactions[userId];

    if (currentReaction === 'LIKE') {
      target.likes = Math.max(0, target.likes - 1);
      delete target.userReactions[userId];
    } else {
      target.likes += 1;
      if (currentReaction === 'DISLIKE') {
        target.dislikes = Math.max(0, target.dislikes - 1);
      }
      target.userReactions[userId] = 'LIKE';
    }
    
    this.persistFeedbacks();
  }

  dislikeFeedback(feedbackId: number): void {
    const target = this.feedbacks.find((feedback) => feedback.id === feedbackId);
    if (!target) return;
    
    const currentUser = this.authService.getCurrentUser();
    const userId = currentUser ? String(currentUser.id) : 'guest';
    target.userReactions = target.userReactions || {};
    const currentReaction = target.userReactions[userId];

    if (currentReaction === 'DISLIKE') {
      target.dislikes = Math.max(0, target.dislikes - 1);
      delete target.userReactions[userId];
    } else {
      target.dislikes += 1;
      if (currentReaction === 'LIKE') {
        target.likes = Math.max(0, target.likes - 1);
      }
      target.userReactions[userId] = 'DISLIKE';
    }

    this.persistFeedbacks();
  }

  private getFeedbackStorageKey(): string {
    return `${this.feedbackStoragePrefix}${this.highlightId}`;
  }

  private loadFeedbacks(): void {
    if (typeof window === 'undefined' || !this.highlightId) {
      this.feedbacks = [];
      return;
    }

    try {
      const raw = localStorage.getItem(this.getFeedbackStorageKey());
      const parsed = raw ? JSON.parse(raw) : [];
      const storedFeedbacks: Partial<HighlightFeedback>[] = Array.isArray(parsed) ? parsed : [];
      this.feedbacks = storedFeedbacks.filter((feedback): feedback is HighlightFeedback =>
        feedback.siteId === this.siteId
        && feedback.highlightId === this.highlightId
        && typeof feedback.id === 'number'
        && typeof feedback.userName === 'string'
        && typeof feedback.comment === 'string'
        && typeof feedback.createdAt === 'string'
        && typeof feedback.likes === 'number'
        && typeof feedback.dislikes === 'number'
      );
      this.persistFeedbacks();
    } catch {
      this.feedbacks = [];
    }
  }

  private persistFeedbacks(): void {
    if (typeof window === 'undefined' || !this.highlightId) return;
    try {
      localStorage.setItem(this.getFeedbackStorageKey(), JSON.stringify(this.feedbacks));
    } catch {
      // Best effort persistence only.
    }
  }
}
