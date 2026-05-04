import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Observable, catchError, from, map, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { AccountProfileService } from './account-profile.service';

export type PreferenceSelections = Record<string, string[]>;
export type ProfileMediaType = 'image' | 'video';

export type ProfileActor = {
  id?: string | number | null;
  email?: string | null;
  name?: string | null;
  username?: string | null;
  avatar?: string | null;
  coverImage?: string | null;
} | null;

export interface ProfileComment {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  text: string;
  createdAt: string;
}

export interface ProfilePost {
  id: string;
  description: string;
  mediaUrl: string;
  mediaType: ProfileMediaType;
  createdAt: string;
  updatedAt: string;
  likedBy: string[];
  comments: ProfileComment[];
}

export interface ProfileStory {
  id: string;
  mediaUrl: string;
  mediaType: ProfileMediaType;
  createdAt: string;
  likedBy: string[];
}

export interface ProfileStoryInput {
  id?: string;
  mediaUrl: string;
  mediaType: ProfileMediaType;
}

export interface ProfileHighlight {
  id: string;
  title: string;
  stories: ProfileStory[];
  createdAt: string;
  updatedAt: string;
}

export interface ProfileHighlightInput {
  title: string;
  stories: ProfileStoryInput[];
}

export interface ProfileMediaItem {
  id: string;
  kind: 'post' | 'cover' | 'avatar';
  title: string;
  mediaUrl: string;
  mediaType: ProfileMediaType;
  createdAt: string;
}

export interface FollowedProfile {
  id: string;
  name: string;
  avatar: string;
  role: string;
  bio: string;
}

export interface AccountProfileMemory {
  coverImage: string;
  coverGallery: ProfileMediaItem[];
  avatarGallery: ProfileMediaItem[];
  posts: ProfilePost[];
  highlights: ProfileHighlight[];
  preferences: PreferenceSelections;
  following: FollowedProfile[];
  updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class ProfilePersonalizationService {
  readonly maxMediaSizeBytes = 20 * 1024 * 1024;
  readonly allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  readonly allowedVideoTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-m4v'];

  private readonly uploadUrl = `${environment.apiUrl}/api/files/upload`;
  private readonly storagePrefix = 'campconnect_profile_memory_';
  private readonly fallbackCoverImage =
    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1200';
  private readonly isBrowser: boolean;

  constructor(
    private readonly http: HttpClient,
    private readonly authService: AuthService,
    private readonly accountProfile: AccountProfileService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  getProfileMemory(owner: ProfileActor = this.authService.getCurrentUser()): AccountProfileMemory {
    const base = this.buildDefaultMemory(owner);
    const key = this.storageKeyFor(owner);

    if (!key || !this.isBrowser) {
      return base;
    }

    try {
      const raw = localStorage.getItem(key);
      if (!raw) {
        return base;
      }

      return this.normalizeMemory(JSON.parse(raw) as Partial<AccountProfileMemory>, base);
    } catch {
      return base;
    }
  }

  savePreferences(selections: PreferenceSelections, owner: ProfileActor = this.authService.getCurrentUser()): void {
    const memory = this.getProfileMemory(owner);
    memory.preferences = this.normalizeSelections(selections);
    this.persist(owner, memory);
  }

  getPreferences(owner: ProfileActor = this.authService.getCurrentUser()): PreferenceSelections {
    return this.getProfileMemory(owner).preferences;
  }

  updateCoverImage(mediaUrl: string, owner: ProfileActor = this.authService.getCurrentUser()): void {
    const memory = this.getProfileMemory(owner);
    const normalizedMediaUrl = this.normalizeStoredPath(mediaUrl) || this.fallbackCoverImage;
    memory.coverImage = normalizedMediaUrl;
    memory.coverGallery = this.prependGalleryItem(
      memory.coverGallery,
      this.createGalleryEntry('cover', normalizedMediaUrl, 'Cover picture')
    );
    this.persist(owner, memory);

    if (this.isCurrentUser(owner)) {
      this.authService.patchStoredUser({ coverImage: memory.coverImage });
    }
  }

  syncAvatarImage(
    mediaUrl: string,
    owner: ProfileActor = this.authService.getCurrentUser(),
    createProfilePost = true
  ): void {
    const normalizedMediaUrl = this.normalizeStoredPath(mediaUrl);
    if (!normalizedMediaUrl) {
      return;
    }

    const memory = this.getProfileMemory(owner);
    const latestAvatar = memory.avatarGallery[0]?.mediaUrl || '';
    if (latestAvatar === normalizedMediaUrl) {
      return;
    }

    memory.avatarGallery = this.prependGalleryItem(
      memory.avatarGallery,
      this.createGalleryEntry('avatar', normalizedMediaUrl, 'Profile picture')
    );

    if (createProfilePost) {
      const avatarPost = this.createPostRecord({
        description: 'Updated profile picture',
        mediaUrl: normalizedMediaUrl,
        mediaType: 'image'
      });
      memory.posts = [avatarPost, ...memory.posts].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }

    this.persist(owner, memory);

    if (this.isCurrentUser(owner)) {
      this.authService.patchStoredUser({ avatar: normalizedMediaUrl });
    }
  }

  addPost(
    post: Pick<ProfilePost, 'description' | 'mediaUrl' | 'mediaType'>,
    owner: ProfileActor = this.authService.getCurrentUser()
  ): ProfilePost {
    const created = this.createPostRecord(post);
    const memory = this.getProfileMemory(owner);
    memory.posts = [created, ...memory.posts].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    this.persist(owner, memory);
    return created;
  }

  updatePost(
    postId: string,
    post: Pick<ProfilePost, 'description' | 'mediaUrl' | 'mediaType'>,
    owner: ProfileActor = this.authService.getCurrentUser()
  ): void {
    const memory = this.getProfileMemory(owner);
    memory.posts = memory.posts.map((item) =>
      item.id === postId
        ? {
            ...item,
            description: post.description.trim(),
            mediaUrl: this.normalizeStoredPath(post.mediaUrl),
            mediaType: post.mediaType,
            updatedAt: new Date().toISOString()
          }
        : item
    );
    this.persist(owner, memory);
  }

  deletePost(postId: string, owner: ProfileActor = this.authService.getCurrentUser()): void {
    const memory = this.getProfileMemory(owner);
    memory.posts = memory.posts.filter((item) => item.id !== postId);
    this.persist(owner, memory);
  }

  togglePostLike(postId: string, actor: ProfileActor, owner: ProfileActor): void {
    const viewerKey = this.viewerKey(actor);
    if (!viewerKey) {
      return;
    }

    const memory = this.getProfileMemory(owner);
    memory.posts = memory.posts.map((item) => {
      if (item.id !== postId) {
        return item;
      }

      const likedBy = item.likedBy.includes(viewerKey)
        ? item.likedBy.filter((entry) => entry !== viewerKey)
        : [...item.likedBy, viewerKey];

      return { ...item, likedBy };
    });
    this.persist(owner, memory);
  }

  addPostComment(postId: string, text: string, actor: ProfileActor, owner: ProfileActor): void {
    const trimmedText = text.trim();
    const actorProfile = this.normalizeActor(actor);
    if (!trimmedText || !actorProfile) {
      return;
    }

    const memory = this.getProfileMemory(owner);
    memory.posts = memory.posts.map((item) =>
      item.id === postId
        ? {
            ...item,
            comments: [
              ...item.comments,
              {
                id: this.createId('comment'),
                authorId: actorProfile.id,
                authorName: actorProfile.name,
                authorAvatar: actorProfile.avatar,
                text: trimmedText,
                createdAt: new Date().toISOString()
              }
            ]
          }
        : item
    );
    this.persist(owner, memory);
  }

  addHighlight(highlight: ProfileHighlightInput, owner: ProfileActor = this.authService.getCurrentUser()): ProfileHighlight {
    const now = new Date().toISOString();
    const created: ProfileHighlight = {
      id: this.createId('highlight'),
      title: highlight.title.trim(),
      stories: highlight.stories.map((story) => ({
        id: this.createId('story'),
        mediaUrl: this.normalizeStoredPath(story.mediaUrl),
        mediaType: story.mediaType,
        createdAt: now,
        likedBy: []
      })),
      createdAt: now,
      updatedAt: now
    };

    const memory = this.getProfileMemory(owner);
    memory.highlights = [created, ...memory.highlights].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    this.persist(owner, memory);
    return created;
  }

  updateHighlight(highlightId: string, highlight: ProfileHighlightInput, owner: ProfileActor = this.authService.getCurrentUser()): void {
    const now = new Date().toISOString();
    const memory = this.getProfileMemory(owner);
    memory.highlights = memory.highlights.map((item) => {
      if (item.id !== highlightId) {
        return item;
      }

      const stories = highlight.stories
        .map((story) => {
          const existingStory = item.stories.find((entry) => entry.id === story.id);
          const mediaUrl = this.normalizeStoredPath(story.mediaUrl);
          if (!mediaUrl) {
            return null;
          }

          return {
            id: existingStory?.id || story.id || this.createId('story'),
            mediaUrl,
            mediaType: story.mediaType,
            createdAt: existingStory?.createdAt || now,
            likedBy: existingStory?.likedBy || []
          };
        })
        .filter((story): story is ProfileStory => story !== null);

      return {
        ...item,
        title: highlight.title.trim(),
        stories,
        updatedAt: now
      };
    });
    this.persist(owner, memory);
  }

  deleteHighlight(highlightId: string, owner: ProfileActor = this.authService.getCurrentUser()): void {
    const memory = this.getProfileMemory(owner);
    memory.highlights = memory.highlights.filter((item) => item.id !== highlightId);
    this.persist(owner, memory);
  }

  toggleStoryLike(highlightId: string, storyId: string, actor: ProfileActor, owner: ProfileActor): void {
    const viewerKey = this.viewerKey(actor);
    if (!viewerKey) {
      return;
    }

    const memory = this.getProfileMemory(owner);
    memory.highlights = memory.highlights.map((highlight) => {
      if (highlight.id !== highlightId) {
        return highlight;
      }

      return {
        ...highlight,
        stories: highlight.stories.map((story) => {
          if (story.id !== storyId) {
            return story;
          }

          const likedBy = story.likedBy.includes(viewerKey)
            ? story.likedBy.filter((entry) => entry !== viewerKey)
            : [...story.likedBy, viewerKey];

          return { ...story, likedBy };
        })
      };
    });
    this.persist(owner, memory);
  }

  getFollowing(owner: ProfileActor = this.authService.getCurrentUser()): FollowedProfile[] {
    return this.getProfileMemory(owner).following;
  }

  isFollowing(target: ProfileActor, owner: ProfileActor = this.authService.getCurrentUser()): boolean {
    const targetId = this.actorProfileId(target);
    if (!targetId) {
      return false;
    }

    return this.getProfileMemory(owner).following.some((profile) => profile.id === targetId);
  }

  toggleFollow(target: ProfileActor & { role?: string | null; bio?: string | null }, owner: ProfileActor = this.authService.getCurrentUser()): void {
    const targetProfile = this.normalizeFollowedProfile(target);
    const ownerProfileId = this.actorProfileId(owner);
    if (!targetProfile || !ownerProfileId || targetProfile.id === ownerProfileId) {
      return;
    }

    const memory = this.getProfileMemory(owner);
    const alreadyFollowing = memory.following.some((profile) => profile.id === targetProfile.id);
    memory.following = alreadyFollowing
      ? memory.following.filter((profile) => profile.id !== targetProfile.id)
      : [targetProfile, ...memory.following.filter((profile) => profile.id !== targetProfile.id)];
    this.persist(owner, memory);
  }

  getGalleryMedia(owner: ProfileActor = this.authService.getCurrentUser()): ProfileMediaItem[] {
    const memory = this.getProfileMemory(owner);

    return [
      ...memory.coverGallery,
      ...memory.avatarGallery,
      ...memory.posts.map((post) => ({
        id: post.id,
        kind: 'post' as const,
        title: post.description,
        mediaUrl: post.mediaUrl,
        mediaType: post.mediaType,
        createdAt: post.createdAt
      }))
    ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  viewerKey(actor: ProfileActor = this.authService.getCurrentUser()): string {
    const email = String(actor?.email ?? '').trim().toLowerCase();
    if (email) {
      return email;
    }

    const id = String(actor?.id ?? '').trim();
    if (id) {
      return `id:${id}`;
    }

    const username = String(actor?.username ?? '').trim().toLowerCase();
    return username ? `username:${username}` : '';
  }

  hasViewerLiked(likedBy: string[] | null | undefined, actor: ProfileActor = this.authService.getCurrentUser()): boolean {
    const viewerKey = this.viewerKey(actor);
    return !!viewerKey && Array.isArray(likedBy) && likedBy.includes(viewerKey);
  }

  resolveMediaUrl(path?: string | null): string {
    return this.accountProfile.resolveStoredImageUrl(path);
  }

  normalizeStoredPath(path?: string | null): string {
    return this.accountProfile.normalizeStoredImagePath(path);
  }

  isVideoMedia(path?: string | null): boolean {
    const normalized = String(path ?? '').trim().toLowerCase();
    if (!normalized) {
      return false;
    }

    if (normalized.startsWith('video/') || normalized.startsWith('data:video/')) {
      return true;
    }

    return /\.(mp4|webm|ogg|mov|m4v)$/.test(normalized);
  }

  inferMediaType(path?: string | null): ProfileMediaType {
    return this.isVideoMedia(path) ? 'video' : 'image';
  }

  uploadMedia(file: File): Observable<string> {
    if (!this.isAllowedMediaType(file.type)) {
      return throwError(() => new Error('Please choose a JPG, PNG, WebP, GIF, MP4, WebM, OGG, or MOV file.'));
    }

    if (file.size > this.maxMediaSizeBytes) {
      return throwError(() => new Error('Please choose a file smaller than 20 MB.'));
    }

    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<any>(this.uploadUrl, formData).pipe(
      map((response) => {
        const storedPath = this.normalizeStoredPath(response?.data?.fileName || response?.fileName || '');
        if (!storedPath) {
          throw new Error('Unable to save your media.');
        }

        return storedPath;
      }),
      catchError(() => from(this.readFileAsDataUrl(file)))
    );
  }

  private normalizeMemory(parsed: Partial<AccountProfileMemory>, base: AccountProfileMemory): AccountProfileMemory {
    const posts = Array.isArray(parsed.posts)
      ? parsed.posts
          .map((item) => this.normalizePost(item))
          .filter((item): item is ProfilePost => item !== null)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      : [];

    const highlights = Array.isArray(parsed.highlights)
      ? parsed.highlights
          .map((item) => this.normalizeHighlight(item))
          .filter((item): item is ProfileHighlight => item !== null)
          .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      : [];

    const coverGallery = Array.isArray(parsed.coverGallery)
      ? parsed.coverGallery
          .map((item) => this.normalizeGalleryItem(item, 'cover'))
          .filter((item): item is ProfileMediaItem => item !== null)
      : base.coverGallery;

    const avatarGallery = Array.isArray(parsed.avatarGallery)
      ? parsed.avatarGallery
          .map((item) => this.normalizeGalleryItem(item, 'avatar'))
          .filter((item): item is ProfileMediaItem => item !== null)
      : base.avatarGallery;

    const following = Array.isArray(parsed.following)
      ? parsed.following
          .map((item) => this.normalizeFollowedProfile(item))
          .filter((item): item is FollowedProfile => item !== null)
      : [];

    const coverImage = this.normalizeStoredPath(parsed.coverImage) || base.coverImage;
    const finalCoverGallery = coverGallery.length
      ? coverGallery
      : [this.createGalleryEntry('cover', coverImage, 'Cover picture', String(parsed.updatedAt || base.updatedAt))];

    const finalAvatarGallery = avatarGallery.length
      ? avatarGallery
      : base.avatarGallery;

    return {
      coverImage,
      coverGallery: finalCoverGallery,
      avatarGallery: finalAvatarGallery,
      posts,
      highlights,
      preferences: this.normalizeSelections(parsed.preferences || {}),
      following,
      updatedAt: String(parsed.updatedAt || base.updatedAt)
    };
  }

  private normalizePost(value: Partial<ProfilePost> | null | undefined): ProfilePost | null {
    const description = String(value?.description || '').trim();
    const mediaUrl = this.normalizeStoredPath(value?.mediaUrl);
    if (!description || !mediaUrl) {
      return null;
    }

    const createdAt = String(value?.createdAt || new Date().toISOString());
    const comments = Array.isArray(value?.comments)
      ? value?.comments
          .map((comment) => this.normalizeComment(comment))
          .filter((comment): comment is ProfileComment => comment !== null)
      : [];

    return {
      id: String(value?.id || this.createId('post')),
      description,
      mediaUrl,
      mediaType: value?.mediaType === 'video' || this.isVideoMedia(mediaUrl) ? 'video' : 'image',
      createdAt,
      updatedAt: String(value?.updatedAt || createdAt),
      likedBy: this.normalizeStringArray(value?.likedBy),
      comments
    };
  }

  private normalizeComment(value: Partial<ProfileComment> | null | undefined): ProfileComment | null {
    const text = String(value?.text || '').trim();
    if (!text) {
      return null;
    }

    const authorName = String(value?.authorName || 'Explorer').trim() || 'Explorer';
    return {
      id: String(value?.id || this.createId('comment')),
      authorId: String(value?.authorId || 'unknown'),
      authorName,
      authorAvatar: this.resolveMediaUrl(value?.authorAvatar) || this.accountProfile.buildGeneratedAvatar(authorName),
      text,
      createdAt: String(value?.createdAt || new Date().toISOString())
    };
  }

  private normalizeHighlight(value: any): ProfileHighlight | null {
    const title = String(value?.title || '').trim();

    const stories = Array.isArray(value?.stories)
      ? value.stories
          .map((story: Partial<ProfileStory>) => this.normalizeStory(story))
          .filter((story: ProfileStory | null): story is ProfileStory => story !== null)
      : this.normalizeLegacyHighlight(value);

    if (!title || !stories.length) {
      return null;
    }

    const createdAt = String(value?.createdAt || stories[0]?.createdAt || new Date().toISOString());
    return {
      id: String(value?.id || this.createId('highlight')),
      title,
      stories,
      createdAt,
      updatedAt: String(value?.updatedAt || createdAt)
    };
  }

  private normalizeLegacyHighlight(value: any): ProfileStory[] {
    const mediaUrl = this.normalizeStoredPath(value?.mediaUrl);
    if (!mediaUrl) {
      return [];
    }

    const createdAt = String(value?.createdAt || new Date().toISOString());
    return [
      {
        id: this.createId('story'),
        mediaUrl,
        mediaType: value?.mediaType === 'video' || this.isVideoMedia(mediaUrl) ? 'video' : 'image',
        createdAt,
        likedBy: this.normalizeStringArray(value?.likedBy)
      }
    ];
  }

  private normalizeStory(value: Partial<ProfileStory> | null | undefined): ProfileStory | null {
    const mediaUrl = this.normalizeStoredPath(value?.mediaUrl);
    if (!mediaUrl) {
      return null;
    }

    const createdAt = String(value?.createdAt || new Date().toISOString());
    return {
      id: String(value?.id || this.createId('story')),
      mediaUrl,
      mediaType: value?.mediaType === 'video' || this.isVideoMedia(mediaUrl) ? 'video' : 'image',
      createdAt,
      likedBy: this.normalizeStringArray(value?.likedBy)
    };
  }

  private normalizeGalleryItem(value: Partial<ProfileMediaItem> | null | undefined, fallbackKind: 'cover' | 'avatar'): ProfileMediaItem | null {
    const mediaUrl = this.normalizeStoredPath(value?.mediaUrl);
    if (!mediaUrl) {
      return null;
    }

    const kind = value?.kind === 'post' || value?.kind === 'cover' || value?.kind === 'avatar'
      ? value.kind
      : fallbackKind;

    return {
      id: String(value?.id || this.createId(kind)),
      kind,
      title: String(value?.title || (kind === 'cover' ? 'Cover picture' : 'Profile picture')).trim(),
      mediaUrl,
      mediaType: value?.mediaType === 'video' || this.isVideoMedia(mediaUrl) ? 'video' : 'image',
      createdAt: String(value?.createdAt || new Date().toISOString())
    };
  }

  private normalizeStringArray(values: unknown): string[] {
    if (!Array.isArray(values)) {
      return [];
    }

    return Array.from(new Set(values.map((value) => String(value || '').trim()).filter(Boolean)));
  }

  private normalizeSelections(selections: PreferenceSelections): PreferenceSelections {
    const normalized: PreferenceSelections = {};

    for (const [key, values] of Object.entries(selections || {})) {
      const cleanKey = String(key || '').trim();
      if (!cleanKey || !Array.isArray(values)) {
        continue;
      }

      const uniqueValues = Array.from(new Set(values.map((value) => String(value || '').trim()).filter(Boolean)));
      if (uniqueValues.length) {
        normalized[cleanKey] = uniqueValues;
      }
    }

    return normalized;
  }

  private buildDefaultMemory(owner: ProfileActor): AccountProfileMemory {
    const createdAt = new Date().toISOString();
    const coverImage = this.normalizeStoredPath(owner?.coverImage) || this.fallbackCoverImage;
    const avatarImage = this.normalizeStoredPath(owner?.avatar);

    return {
      coverImage,
      coverGallery: [this.createGalleryEntry('cover', coverImage, 'Cover picture', createdAt)],
      avatarGallery: avatarImage ? [this.createGalleryEntry('avatar', avatarImage, 'Profile picture', createdAt)] : [],
      posts: [],
      highlights: [],
      preferences: {},
      following: [],
      updatedAt: new Date().toISOString()
    };
  }

  private persist(owner: ProfileActor, memory: AccountProfileMemory): void {
    const key = this.storageKeyFor(owner);
    if (!key || !this.isBrowser) {
      return;
    }

    try {
      localStorage.setItem(
        key,
        JSON.stringify({
          ...memory,
          updatedAt: new Date().toISOString()
        } satisfies AccountProfileMemory)
      );
    } catch {
      // Ignore localStorage quota issues.
    }
  }

  private storageKeyFor(owner: ProfileActor): string | null {
    const email = String(owner?.email ?? '').trim().toLowerCase();
    if (email) {
      return `${this.storagePrefix}${email}`;
    }

    const id = String(owner?.id ?? '').trim();
    if (id) {
      return `${this.storagePrefix}id_${id}`;
    }

    return null;
  }

  private isCurrentUser(owner: ProfileActor): boolean {
    return this.storageKeyFor(owner) === this.storageKeyFor(this.authService.getCurrentUser());
  }

  private actorProfileId(actor: ProfileActor): string {
    const id = String(actor?.id ?? '').trim();
    if (id) {
      return id;
    }

    return this.viewerKey(actor);
  }

  private normalizeActor(actor: ProfileActor): { id: string; name: string; avatar: string } | null {
    const id = this.viewerKey(actor);
    if (!id) {
      return null;
    }

    const name = String(actor?.name || actor?.username || 'Explorer').trim() || 'Explorer';
    const avatar = this.resolveMediaUrl(actor?.avatar) || this.accountProfile.buildGeneratedAvatar(name);
    return { id, name, avatar };
  }

  private normalizeFollowedProfile(actor: any): FollowedProfile | null {
    const id = this.actorProfileId(actor);
    if (!id) {
      return null;
    }

    const name = String(actor?.name || actor?.username || 'Explorer').trim() || 'Explorer';
    return {
      id,
      name,
      avatar: this.resolveMediaUrl(actor?.avatar) || this.accountProfile.buildGeneratedAvatar(name),
      role: String(actor?.role || 'Member').trim() || 'Member',
      bio: String(actor?.bio || '').trim()
    };
  }

  private createPostRecord(post: Pick<ProfilePost, 'description' | 'mediaUrl' | 'mediaType'>, createdAt = new Date().toISOString()): ProfilePost {
    return {
      id: this.createId('post'),
      description: post.description.trim(),
      mediaUrl: this.normalizeStoredPath(post.mediaUrl),
      mediaType: post.mediaType,
      createdAt,
      updatedAt: createdAt,
      likedBy: [],
      comments: []
    };
  }

  private createGalleryEntry(
    kind: 'cover' | 'avatar',
    mediaUrl: string,
    title: string,
    createdAt = new Date().toISOString()
  ): ProfileMediaItem {
    return {
      id: this.createId(kind),
      kind,
      title,
      mediaUrl: this.normalizeStoredPath(mediaUrl),
      mediaType: 'image',
      createdAt
    };
  }

  private prependGalleryItem(items: ProfileMediaItem[], entry: ProfileMediaItem): ProfileMediaItem[] {
    if (items[0]?.mediaUrl === entry.mediaUrl && items[0]?.kind === entry.kind) {
      return items;
    }

    return [entry, ...items];
  }

  private isAllowedMediaType(mimeType: string): boolean {
    return [...this.allowedImageTypes, ...this.allowedVideoTypes].includes(mimeType);
  }

  private createId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  }

  private readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('Unable to read your selected file.'));
      reader.readAsDataURL(file);
    });
  }
}
