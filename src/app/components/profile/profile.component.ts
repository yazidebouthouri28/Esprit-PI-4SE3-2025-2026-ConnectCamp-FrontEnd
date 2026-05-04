import { CommonModule, Location } from '@angular/common';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin, map, of, Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import {
  FollowedProfile,
  PreferenceSelections,
  ProfileHighlight,
  ProfileHighlightInput,
  ProfileMediaItem,
  ProfileMediaType,
  ProfilePersonalizationService,
  ProfilePost,
  ProfileStoryInput
} from '../../services/profile-personalization.service';
import { User, UserService } from '../../services/user.service';
import { AccountProfileService } from '../../services/account-profile.service';

interface HighlightStoryDraft {
  id?: string;
  mediaFile: File | null;
  mediaType: ProfileMediaType;
  previewUrl: string;
  storedMediaUrl: string;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit, OnDestroy {
  @ViewChild('coverInput') private coverInput?: ElementRef<HTMLInputElement>;
  @ViewChild('postMediaInput') private postMediaInput?: ElementRef<HTMLInputElement>;
  @ViewChild('highlightStoriesInput') private highlightStoriesInput?: ElementRef<HTMLInputElement>;

  currentUser: User | null = null;
  viewedUser: User | null = null;
  isOwnProfile = false;
  activeTab: 'adventure' | 'follows' | 'achievements' | 'media' = 'adventure';

  coverImageUrl = '';
  coverUploadError = '';
  isUploadingCover = false;

  posts: ProfilePost[] = [];
  highlights: ProfileHighlight[] = [];
  galleryMedia: ProfileMediaItem[] = [];
  preferences: PreferenceSelections = {};
  postCommentDrafts: Record<string, string> = {};
  following: FollowedProfile[] = [];

  postDraft: {
    description: string;
    mediaFile: File | null;
    mediaType: ProfileMediaType;
    previewUrl: string;
    storedMediaUrl: string;
  } = this.createEmptyPostDraft();
  editingPostId: string | null = null;
  postSaveError = '';
  isSavingPost = false;

  highlightEditorOpen = false;
  highlightTitle = '';
  highlightStories: HighlightStoryDraft[] = [];
  editingHighlightId: string | null = null;
  highlightSaveError = '';
  isSavingHighlight = false;

  selectedHighlight: ProfileHighlight | null = null;
  selectedStoryIndex = 0;
  storyProgress = 0;
  storyMuted = true;

  readonly fallbackCover =
    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1200';
  private routeSubscription?: Subscription;
  private authSubscription?: Subscription;
  private storyTimer: ReturnType<typeof setInterval> | null = null;
  private isSyncingLiveData = false;

  selectedViewerMedia: ProfileMediaItem | null = null;
  photoViewerOpen = false;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly location: Location,
    private readonly userService: UserService,
    private readonly authService: AuthService,
    private readonly profilePersonalization: ProfilePersonalizationService,
    private readonly accountProfile: AccountProfileService
  ) { }

  ngOnInit(): void {
    this.authSubscription = this.authService.currentUser$.subscribe(() => this.loadProfile());
    this.routeSubscription = this.route.paramMap.subscribe(() => this.loadProfile());
  }

  ngOnDestroy(): void {
    this.routeSubscription?.unsubscribe();
    this.authSubscription?.unsubscribe();
    this.stopStoryPlayback();
    this.revokePreviewUrl(this.postDraft.previewUrl);
    this.highlightStories.forEach((story) => this.revokePreviewUrl(story.previewUrl));
  }

  setActiveTab(tab: 'adventure' | 'follows' | 'achievements' | 'media'): void {
    this.activeTab = tab;
  }

  goBack(): void {
    this.location.back();
  }

  roleLabel(role?: string | null): string {
    return String(role || 'MEMBER')
      .toLowerCase()
      .split(/[_\s]+/)
      .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
      .join(' ');
  }

  get introLocation(): string {
    return this.viewedUser?.location || 'The Wild';
  }

  get xpProgress(): number {
    if (!this.viewedUser || this.viewedUser.experiencePoints == null) return 0;
    return (this.viewedUser.experiencePoints % 1000) / 10;
  }

  get currentStory() {
    return this.selectedHighlight?.stories[this.selectedStoryIndex] || null;
  }

  get canSavePost(): boolean {
    return !!this.postDraft.description.trim() && (!!this.postDraft.mediaFile || !!this.postDraft.storedMediaUrl);
  }

  get canSaveHighlight(): boolean {
    return !!this.highlightTitle.trim() && this.highlightStories.length > 0;
  }

  get postActionLabel(): string {
    return this.editingPostId ? 'Update Post' : 'Publish Post';
  }

  get highlightActionLabel(): string {
    return this.editingHighlightId ? 'Update Highlight' : 'Save Highlight';
  }

  get galleryPreview(): string[] {
    const mediaImages = this.galleryMedia
      .filter((item) => item.mediaType === 'image')
      .slice(0, 6)
      .map((item) => this.resolveMediaUrl(item.mediaUrl));

    if (mediaImages.length) {
      return mediaImages;
    }

    if (this.viewedUser?.gallery?.length) {
      return this.viewedUser.gallery.slice(0, 6);
    }

    return this.viewedUser?.avatar ? [this.viewedUser.avatar] : [];
  }

  get canInteractWithPosts(): boolean {
    return !!this.authService.getCurrentUser();
  }

  get isFollowingViewedUser(): boolean {
    if (this.isOwnProfile || !this.viewedUser) {
      return false;
    }

    return this.profilePersonalization.isFollowing(this.viewedUser, this.authService.getCurrentUser());
  }

  get storyLikeCount(): number {
    return this.currentStory?.likedBy.length || 0;
  }

  triggerCoverPicker(): void {
    this.coverInput?.nativeElement.click();
  }

  triggerPostMediaPicker(): void {
    this.postMediaInput?.nativeElement.click();
  }

  triggerHighlightStoriesPicker(): void {
    this.highlightStoriesInput?.nativeElement.click();
  }

  openHighlightEditor(highlight?: ProfileHighlight): void {
    this.highlightEditorOpen = true;
    this.highlightSaveError = '';
    this.isSavingHighlight = false;
    this.storyMuted = true;

    this.highlightStories.forEach((story) => this.revokePreviewUrl(story.previewUrl));

    if (!highlight) {
      this.editingHighlightId = null;
      this.highlightTitle = '';
      this.highlightStories = [];
      return;
    }

    this.editingHighlightId = highlight.id;
    this.highlightTitle = highlight.title;
    this.highlightStories = highlight.stories.map((story) => ({
      id: story.id,
      mediaFile: null,
      mediaType: story.mediaType,
      previewUrl: this.resolveMediaUrl(story.mediaUrl),
      storedMediaUrl: story.mediaUrl
    }));
  }

  closeHighlightEditor(): void {
    this.highlightEditorOpen = false;
    this.highlightSaveError = '';
    this.editingHighlightId = null;
    this.isSavingHighlight = false;
    this.highlightTitle = '';
    this.highlightStories.forEach((story) => this.revokePreviewUrl(story.previewUrl));
    this.highlightStories = [];
  }

  onCoverSelected(event: Event): void {
    const file = this.extractFirstFile(event);
    if (!file || !this.isOwnProfile) {
      return;
    }

    this.isUploadingCover = true;
    this.coverUploadError = '';

    this.profilePersonalization.uploadMedia(file).subscribe({
      next: (storedPath) => {
        this.profilePersonalization.updateCoverImage(storedPath, this.profileOwner());
        this.coverImageUrl = this.resolveMediaUrl(storedPath);
        if (this.viewedUser) {
          this.viewedUser = { ...this.viewedUser, coverImage: storedPath };
        }
        this.isUploadingCover = false;
      },
      error: (error) => {
        this.coverUploadError = error?.message || 'Unable to update your cover picture.';
        this.isUploadingCover = false;
      }
    });

    this.clearInputValue(event);
  }

  onPostMediaSelected(event: Event): void {
    const file = this.extractFirstFile(event);
    if (!file) {
      return;
    }

    this.revokePreviewUrl(this.postDraft.previewUrl);
    this.postDraft.mediaFile = file;
    this.postDraft.mediaType = this.profilePersonalization.inferMediaType(file.type);
    this.postDraft.previewUrl = URL.createObjectURL(file);
    this.postDraft.storedMediaUrl = '';
    this.postSaveError = '';
    this.clearInputValue(event);
  }

  onHighlightStoriesSelected(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const files = Array.from(input?.files || []);
    if (!files.length) {
      return;
    }

    for (const file of files) {
      this.highlightStories.push({
        mediaFile: file,
        mediaType: this.profilePersonalization.inferMediaType(file.type),
        previewUrl: URL.createObjectURL(file),
        storedMediaUrl: ''
      });
    }

    this.highlightSaveError = '';
    this.clearInputValue(event);
  }

  removeHighlightStory(index: number): void {
    const [removed] = this.highlightStories.splice(index, 1);
    if (removed) {
      this.revokePreviewUrl(removed.previewUrl);
    }
  }

  savePost(): void {
    if (!this.isOwnProfile) {
      return;
    }

    const description = this.postDraft.description.trim();
    if (!description) {
      this.postSaveError = 'Add a short description for your post.';
      return;
    }

    if (!this.postDraft.mediaFile && !this.postDraft.storedMediaUrl) {
      this.postSaveError = 'Choose an image or video for your post.';
      return;
    }

    this.isSavingPost = true;
    this.postSaveError = '';

    if (this.postDraft.mediaFile) {
      this.profilePersonalization.uploadMedia(this.postDraft.mediaFile).subscribe({
        next: (storedPath) => this.commitPost(description, storedPath, this.postDraft.mediaType),
        error: (error) => {
          this.postSaveError = error?.message || 'Unable to save your post.';
          this.isSavingPost = false;
        }
      });
      return;
    }

    this.commitPost(description, this.postDraft.storedMediaUrl, this.postDraft.mediaType);
  }

  editPost(post: ProfilePost): void {
    this.editingPostId = post.id;
    this.postSaveError = '';
    this.revokePreviewUrl(this.postDraft.previewUrl);
    this.postDraft = {
      description: post.description,
      mediaFile: null,
      mediaType: post.mediaType,
      previewUrl: this.resolveMediaUrl(post.mediaUrl),
      storedMediaUrl: post.mediaUrl
    };
    this.activeTab = 'adventure';
  }

  cancelPostEditing(): void {
    this.editingPostId = null;
    this.postSaveError = '';
    this.resetPostDraft();
  }

  deletePost(post: ProfilePost): void {
    if (!this.isOwnProfile || !confirm('Delete this post from your profile?')) {
      return;
    }

    this.profilePersonalization.deletePost(post.id, this.profileOwner());
    this.syncProfileMemory();
  }

  togglePostLike(post: ProfilePost): void {
    if (this.isOwnProfile) return;
    const actor = this.authService.getCurrentUser();
    if (!actor) {
      return;
    }

    this.profilePersonalization.togglePostLike(post.id, actor, this.profileOwner());
    this.syncProfileMemory();
  }

  submitPostComment(post: ProfilePost): void {
    if (this.isOwnProfile) return;
    const actor = this.authService.getCurrentUser();
    const text = String(this.postCommentDrafts[post.id] || '').trim();
    if (!actor || !text) {
      return;
    }

    this.profilePersonalization.addPostComment(post.id, text, actor, this.profileOwner());
    this.postCommentDrafts[post.id] = '';
    this.syncProfileMemory();
  }

  isPostLiked(post: ProfilePost): boolean {
    return this.profilePersonalization.hasViewerLiked(post.likedBy, this.authService.getCurrentUser());
  }

  focusPostComment(postId: string): void {
    if (typeof document === 'undefined') {
      return;
    }

    const field = document.getElementById(`post-comment-${postId}`) as HTMLTextAreaElement | null;
    field?.focus();
  }

  toggleFollowViewedUser(): void {
    if (this.isOwnProfile || !this.viewedUser || !this.authService.getCurrentUser()) {
      return;
    }

    this.profilePersonalization.toggleFollow(this.viewedUser, this.authService.getCurrentUser());
    this.following = this.isOwnProfile
      ? this.profilePersonalization.getFollowing(this.authService.getCurrentUser())
      : [];
  }

  openHighlightPreview(highlight: ProfileHighlight, storyIndex = 0): void {
    this.selectedHighlight = highlight;
    this.selectedStoryIndex = Math.max(0, Math.min(storyIndex, highlight.stories.length - 1));
    this.storyProgress = 0;
    this.storyMuted = true;
    this.startStoryPlayback();
  }

  closeHighlightPreview(): void {
    this.stopStoryPlayback();
    this.selectedHighlight = null;
    this.selectedStoryIndex = 0;
    this.storyProgress = 0;
  }

  openPhotoViewer(media: ProfileMediaItem | string, kind: 'post' | 'cover' | 'avatar' = 'post'): void {
    if (typeof media === 'string') {
      this.selectedViewerMedia = {
        id: 'temporal-media',
        kind,
        title: kind === 'cover' ? 'Cover picture' : 'Profile picture',
        mediaUrl: media,
        mediaType: this.profilePersonalization.inferMediaType(media),
        createdAt: new Date().toISOString()
      };
    } else {
      this.selectedViewerMedia = media;
    }
    this.photoViewerOpen = true;
  }

  closePhotoViewer(): void {
    this.photoViewerOpen = false;
    this.selectedViewerMedia = null;
  }

  nextStory(): void {
    if (!this.selectedHighlight) {
      return;
    }

    if (this.selectedStoryIndex < this.selectedHighlight.stories.length - 1) {
      this.selectedStoryIndex += 1;
      this.storyProgress = 0;
      this.startStoryPlayback();
      return;
    }

    this.closeHighlightPreview();
  }

  previousStory(): void {
    if (!this.selectedHighlight) {
      return;
    }

    if (this.storyProgress > 18) {
      this.storyProgress = 0;
      this.startStoryPlayback();
      return;
    }

    if (this.selectedStoryIndex > 0) {
      this.selectedStoryIndex -= 1;
      this.storyProgress = 0;
      this.startStoryPlayback();
    }
  }

  toggleCurrentStoryLike(): void {
    if (this.isOwnProfile) return;
    const actor = this.authService.getCurrentUser();
    const story = this.currentStory;
    if (!actor || !story || !this.selectedHighlight) {
      return;
    }

    this.profilePersonalization.toggleStoryLike(this.selectedHighlight.id, story.id, actor, this.profileOwner());
    this.syncProfileMemory();
  }

  isCurrentStoryLiked(): boolean {
    return this.profilePersonalization.hasViewerLiked(this.currentStory?.likedBy, this.authService.getCurrentUser());
  }

  toggleStoryMuted(): void {
    this.storyMuted = !this.storyMuted;
  }

  storyProgressFor(index: number): number {
    if (!this.selectedHighlight) {
      return 0;
    }
    if (index < this.selectedStoryIndex) {
      return 100;
    }
    if (index > this.selectedStoryIndex) {
      return 0;
    }
    return this.storyProgress;
  }

  storyTimeAgo(date: string): string {
    const diffMs = Date.now() - new Date(date).getTime();
    const diffHours = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60)));
    if (diffHours < 24) {
      return `${diffHours} h`;
    }
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} d`;
  }

  resolveMediaUrl(path?: string | null): string {
    return this.profilePersonalization.resolveMediaUrl(path);
  }

  isVideoMedia(path?: string | null): boolean {
    return this.profilePersonalization.isVideoMedia(path);
  }

  isStoryLiked(story: { likedBy: string[] }): boolean {
    return this.profilePersonalization.hasViewerLiked(story.likedBy, this.authService.getCurrentUser());
  }

  private loadProfile(): void {
    const authUser = this.authService.getCurrentUser();
    this.currentUser = this.userService.getCurrentUser();
    const viewedId = this.route.snapshot.paramMap.get('id');

    if (!viewedId || viewedId === 'me' || (authUser && viewedId === String(authUser.id))) {
      this.viewedUser = this.currentUser;
      this.isOwnProfile = true;
    } else {
      this.viewedUser = this.userService.getUserById(viewedId) || this.currentUser;
      this.isOwnProfile = !!authUser && String(authUser.id) === String(this.viewedUser?.id || '');
    }

    this.syncProfileMemory();

    if (this.isSyncingLiveData) return;
    const targetUserId = this.isOwnProfile && authUser ? authUser.id : (viewedId && viewedId !== 'me' ? viewedId : null);

    if (targetUserId) {
      this.isSyncingLiveData = true;
      this.accountProfile.getProfile(Number(targetUserId)).subscribe({
        next: (profile) => {
          const freshSessionUser = this.accountProfile.toSessionUser(profile);
          this.viewedUser = { ...this.viewedUser, ...freshSessionUser } as User;

          if (this.isOwnProfile) {
            this.currentUser = { ...this.currentUser, ...freshSessionUser } as User;
            this.authService.patchStoredUser(freshSessionUser as any);
          }
          this.syncProfileMemory();
          requestAnimationFrame(() => this.isSyncingLiveData = false);
        },
        error: () => {
          this.isSyncingLiveData = false;
        }
      });
    }
  }

  private syncProfileMemory(): void {
    const selectedHighlightId = this.selectedHighlight?.id || null;
    const selectedStoryId = this.currentStory?.id || null;

    const memory = this.profilePersonalization.getProfileMemory(this.profileOwner());
    this.posts = memory.posts;
    this.highlights = memory.highlights;
    this.galleryMedia = this.profilePersonalization.getGalleryMedia(this.profileOwner());
    this.preferences = memory.preferences;
    this.following = this.profilePersonalization.getFollowing(this.authService.getCurrentUser());
    this.coverImageUrl = this.resolveMediaUrl(memory.coverImage || this.viewedUser?.coverImage || this.fallbackCover);

    if (selectedHighlightId) {
      const refreshedHighlight = this.highlights.find((highlight) => highlight.id === selectedHighlightId) || null;
      if (!refreshedHighlight) {
        this.closeHighlightPreview();
        return;
      }

      this.selectedHighlight = refreshedHighlight;
      const nextIndex = selectedStoryId
        ? refreshedHighlight.stories.findIndex((story) => story.id === selectedStoryId)
        : this.selectedStoryIndex;

      this.selectedStoryIndex = nextIndex >= 0 ? nextIndex : 0;
    }
  }

  private commitPost(description: string, mediaUrl: string, mediaType: ProfileMediaType): void {
    if (this.editingPostId) {
      this.profilePersonalization.updatePost(this.editingPostId, { description, mediaUrl, mediaType }, this.profileOwner());
    } else {
      this.profilePersonalization.addPost({ description, mediaUrl, mediaType }, this.profileOwner());
    }

    this.isSavingPost = false;
    this.editingPostId = null;
    this.resetPostDraft();
    this.syncProfileMemory();
  }

  saveHighlight(): void {
    const title = this.highlightTitle.trim();
    if (!title) {
      this.highlightSaveError = 'Give your highlight a title.';
      return;
    }

    if (!this.highlightStories.length) {
      this.highlightSaveError = 'Add at least one story to this highlight.';
      return;
    }

    this.isSavingHighlight = true;
    this.highlightSaveError = '';

    const storyUploads = this.highlightStories.map((story) =>
      story.mediaFile
        ? this.profilePersonalization.uploadMedia(story.mediaFile).pipe(
          map((storedPath) => ({
            id: story.id,
            mediaUrl: storedPath,
            mediaType: story.mediaType
          } satisfies ProfileStoryInput))
        )
        : of({
          id: story.id,
          mediaUrl: story.storedMediaUrl,
          mediaType: story.mediaType
        } satisfies ProfileStoryInput)
    );

    forkJoin(storyUploads).subscribe({
      next: (stories) => this.commitHighlight({ title, stories }),
      error: (error) => {
        this.highlightSaveError = error?.message || 'Unable to save this highlight.';
        this.isSavingHighlight = false;
      }
    });
  }

  editHighlight(highlight: ProfileHighlight, event?: Event): void {
    event?.stopPropagation();
    this.openHighlightEditor(highlight);
  }

  deleteHighlight(highlight: ProfileHighlight, event?: Event): void {
    event?.stopPropagation();
    if (!this.isOwnProfile || !confirm('Delete this highlight and all its stories?')) {
      return;
    }

    this.profilePersonalization.deleteHighlight(highlight.id, this.profileOwner());
    if (this.selectedHighlight?.id === highlight.id) {
      this.closeHighlightPreview();
    }
    this.syncProfileMemory();
  }

  private commitHighlight(highlight: ProfileHighlightInput): void {
    if (this.editingHighlightId) {
      this.profilePersonalization.updateHighlight(this.editingHighlightId, highlight, this.profileOwner());
    } else {
      this.profilePersonalization.addHighlight(highlight, this.profileOwner());
    }

    this.isSavingHighlight = false;
    this.closeHighlightEditor();
    this.syncProfileMemory();
  }

  private profileOwner(): User | null {
    return this.isOwnProfile ? this.authService.getCurrentUser() as unknown as User : this.viewedUser;
  }

  private startStoryPlayback(): void {
    this.stopStoryPlayback();
    const story = this.currentStory;
    if (!story) {
      return;
    }

    const durationMs = story.mediaType === 'video' ? 8000 : 5000;
    const startedAt = Date.now();

    this.storyTimer = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      this.storyProgress = Math.min(100, (elapsed / durationMs) * 100);

      if (elapsed >= durationMs) {
        this.nextStory();
      }
    }, 80);
  }

  private stopStoryPlayback(): void {
    if (this.storyTimer) {
      clearInterval(this.storyTimer);
      this.storyTimer = null;
    }
  }

  private createEmptyPostDraft() {
    return {
      description: '',
      mediaFile: null,
      mediaType: 'image' as ProfileMediaType,
      previewUrl: '',
      storedMediaUrl: ''
    };
  }

  private resetPostDraft(): void {
    this.revokePreviewUrl(this.postDraft.previewUrl);
    this.postDraft = this.createEmptyPostDraft();
  }

  private revokePreviewUrl(url: string): void {
    if (url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  }

  private extractFirstFile(event: Event): File | null {
    const input = event.target as HTMLInputElement | null;
    return input?.files?.[0] || null;
  }

  private clearInputValue(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    if (input) {
      input.value = '';
    }
  }
}
