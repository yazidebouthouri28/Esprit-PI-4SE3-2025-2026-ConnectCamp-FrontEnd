import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse, User } from '../models/api.models';

export interface UserProfileDto {
  id: number;
  name: string;
  username: string;
  email: string;
  phone?: string;
  address?: string;
  country?: string;
  age?: number | null;
  avatar?: string;
  bio?: string;
  location?: string;
  website?: string;
  role?: string;
}

export type ProfileFormModel = UserProfileDto & {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

@Injectable({ providedIn: 'root' })
export class AccountProfileService {
  readonly maxAvatarSizeBytes = 5 * 1024 * 1024;
  readonly allowedAvatarTypes = ['image/jpeg', 'image/png', 'image/webp'];

  private readonly avatarUploadUrl = `${environment.apiUrl}/api/files/upload`;
  private readonly imageUrlBase = `${environment.apiUrl}/uploads/`;

  constructor(private http: HttpClient) {}

  getProfile(id: number): Observable<UserProfileDto> {
    return this.http
      .get<ApiResponse<UserProfileDto>>(`${environment.apiUrl}/api/users/${id}`)
      .pipe(map((res) => this.normalizeProfile(res.data)));
  }

  updateProfile(id: number, body: Partial<UserProfileDto>): Observable<UserProfileDto> {
    return this.http
      .put<ApiResponse<UserProfileDto>>(`${environment.apiUrl}/api/users/${id}`, body)
      .pipe(map((res) => this.normalizeProfile(res.data)));
  }

  changePassword(id: number, currentPassword: string, newPassword: string): Observable<void> {
    return this.http
      .post<ApiResponse<void>>(`${environment.apiUrl}/api/users/${id}/change-password`, {
        currentPassword,
        newPassword,
      })
      .pipe(map(() => void 0));
  }

  uploadAvatar(file: File): Observable<string> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<any>(this.avatarUploadUrl, formData).pipe(
      map((res) => {
        const uploadedAvatar = this.normalizeStoredImagePath(res?.data?.fileName || res?.fileName || '');
        if (!uploadedAvatar) {
          throw new Error("Echec du chargement de l'image.");
        }
        return uploadedAvatar;
      })
    );
  }

  toSessionUser(profile: UserProfileDto): Partial<User> {
    return {
      name: profile.name,
      username: profile.username,
      email: profile.email,
      phone: profile.phone,
      address: profile.address,
      country: profile.country,
      age: profile.age ?? undefined,
      avatar: this.resolveStoredImageUrl(profile.avatar),
      bio: profile.bio,
      location: profile.location,
      website: profile.website,
    };
  }

  createEmptyProfileForm(): ProfileFormModel {
    return {
      id: 0,
      name: '',
      username: '',
      email: '',
      phone: '',
      address: '',
      country: '',
      age: null,
      avatar: '',
      bio: '',
      location: '',
      website: '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    };
  }

  resolveStoredImageUrl(path?: string | null): string {
    const trimmed = String(path || '').trim();
    if (!trimmed) {
      return '';
    }

    if (
      trimmed.startsWith('http://') ||
      trimmed.startsWith('https://') ||
      trimmed.startsWith('blob:') ||
      trimmed.startsWith('data:')
    ) {
      return trimmed;
    }

    if (trimmed.startsWith('/uploads/')) {
      return `${environment.apiUrl}${trimmed}`;
    }

    return `${this.imageUrlBase}${trimmed.replace(/^\/+/, '')}`;
  }

  normalizeStoredImagePath(path?: string | null): string {
    const trimmed = String(path || '').trim();
    if (!trimmed) {
      return '';
    }

    if (trimmed.startsWith(this.imageUrlBase)) {
      return trimmed.substring(this.imageUrlBase.length);
    }

    if (trimmed.startsWith('/uploads/')) {
      return trimmed.substring('/uploads/'.length);
    }

    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      try {
        const url = new URL(trimmed);
        const uploadsPrefix = '/uploads/';
        const uploadsIndex = url.pathname.indexOf(uploadsPrefix);
        if (uploadsIndex >= 0) {
          return url.pathname.substring(uploadsIndex + uploadsPrefix.length);
        }
      } catch {
        return trimmed;
      }
    }

    return trimmed.replace(/^\/+/, '');
  }

  initialsFromName(value?: string | null, fallback = 'AC'): string {
    const parts = (value || '')
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2);

    if (!parts.length) {
      return fallback;
    }

    return parts.map((part) => part[0]?.toUpperCase() ?? '').join('') || fallback;
  }

  buildGeneratedAvatar(name?: string | null): string {
    const label = String(name || 'ConnectCamp User').trim() || 'ConnectCamp User';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(label)}&background=2f5642&color=ffffff`;
  }

  private normalizeProfile(profile?: UserProfileDto): UserProfileDto {
    return {
      id: profile?.id ?? 0,
      name: profile?.name ?? '',
      username: profile?.username ?? '',
      email: profile?.email ?? '',
      phone: profile?.phone ?? '',
      address: profile?.address ?? '',
      country: profile?.country ?? '',
      age: profile?.age ?? null,
      avatar: this.normalizeStoredImagePath(profile?.avatar),
      bio: profile?.bio ?? '',
      location: profile?.location ?? '',
      website: profile?.website ?? '',
      role: profile?.role ?? '',
    };
  }
}
