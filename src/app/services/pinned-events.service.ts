import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class PinnedEventsService {
  private readonly isBrowser: boolean;

  constructor(
    @Inject(PLATFORM_ID) platformId: Object,
    private readonly authService: AuthService
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  private storageGet(key: string): string | null {
    if (!this.isBrowser) return null;
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  private storageSet(key: string, value: string): void {
    if (!this.isBrowser) return;
    try {
      localStorage.setItem(key, value);
    } catch {
      // Ignore storage failures (private mode / quota / SSR).
    }
  }

  private keyForCurrentUser(): string {
    const user = this.authService.getCurrentUser();
    const suffix = user?.id ?? user?.email ?? 'guest';
    return `pinned_events:${suffix}`;
  }

  getPinnedIds(): number[] {
    const raw = this.storageGet(this.keyForCurrentUser());
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .map((v) => Number(v))
        .filter((v) => Number.isFinite(v) && v > 0);
    } catch {
      return [];
    }
  }

  setPinnedIds(ids: number[]): void {
    const normalized = (ids ?? [])
      .map((v) => Number(v))
      .filter((v) => Number.isFinite(v) && v > 0);

    // Keep order, remove duplicates.
    const seen = new Set<number>();
    const unique = normalized.filter((id) => (seen.has(id) ? false : (seen.add(id), true)));

    this.storageSet(this.keyForCurrentUser(), JSON.stringify(unique));
  }

  togglePinned(eventId: number): number[] {
    const id = Number(eventId);
    if (!Number.isFinite(id) || id <= 0) return this.getPinnedIds();

    const current = this.getPinnedIds();
    const idx = current.indexOf(id);
    if (idx >= 0) {
      current.splice(idx, 1);
      this.setPinnedIds(current);
      return current;
    }

    const next = [id, ...current];
    this.setPinnedIds(next);
    return next;
  }
}

