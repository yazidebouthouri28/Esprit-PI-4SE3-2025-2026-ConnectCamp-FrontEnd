import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import {
  AccountProfileService,
  ProfileFormModel,
} from '../../services/account-profile.service';
import { ProfilePersonalizationService } from '../../services/profile-personalization.service';

@Component({
  selector: 'app-account-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './account-settings.component.html',
  styleUrls: ['./account-settings.component.css'],
})
export class AccountSettingsComponent implements OnInit, OnDestroy {
  settingsLoading = false;
  settingsError = '';
  settingsSuccess = '';
  avatarFileName = '';
  profileForm: ProfileFormModel;

  private selectedAvatarFile: File | null = null;
  private avatarPreviewUrl = '';

  constructor(
    private authService: AuthService,
    private accountProfile: AccountProfileService,
    private profilePersonalization: ProfilePersonalizationService,
    private router: Router,
    private location: Location
  ) {
    this.profileForm = this.accountProfile.createEmptyProfileForm();
  }

  ngOnInit(): void {
    this.loadProfile();
  }

  ngOnDestroy(): void {
    this.setAvatarPreview('');
  }

  get currentUserId(): number {
    return Number(this.authService.getCurrentUser()?.id ?? NaN);
  }

  get currentUserName(): string {
    const user = this.authService.getCurrentUser();
    return user?.name || user?.username || 'Your account';
  }

  get currentRoleLabel(): string {
    return String(this.authService.getCurrentUser()?.role || 'ACCOUNT')
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  get showAdminShortcut(): boolean {
    return this.authService.isAdmin();
  }

  get backTarget(): string {
    return this.router.url.startsWith('/admin/') ? '/admin' : '/profile';
  }

  get profileAvatarPreview(): string | undefined {
    const avatar = this.avatarPreviewUrl || this.accountProfile.resolveStoredImageUrl(this.profileForm.avatar);
    return avatar || undefined;
  }

  get profileAvatarInitials(): string {
    return this.accountProfile.initialsFromName(
      this.profileForm.name || this.profileForm.username || this.currentUserName
    );
  }

  goBack(): void {
    if (typeof history !== 'undefined' && history.length > 1) {
      this.location.back();
      return;
    }
    this.router.navigate([this.backTarget]);
  }

  saveSettings(): void {
    this.settingsError = '';
    this.settingsSuccess = '';

    const id = this.profileForm.id;
    if (!id) {
      this.settingsError = 'Session invalide.';
      return;
    }

    if (this.profileForm.newPassword || this.profileForm.confirmPassword || this.profileForm.currentPassword) {
      if (this.profileForm.newPassword !== this.profileForm.confirmPassword) {
        this.settingsError = 'Les mots de passe ne correspondent pas.';
        return;
      }

      if (!this.profileForm.currentPassword || !this.profileForm.newPassword) {
        this.settingsError = 'Renseignez le mot de passe actuel et le nouveau.';
        return;
      }
    }

    this.settingsLoading = true;

    if (this.selectedAvatarFile) {
      this.accountProfile.uploadAvatar(this.selectedAvatarFile).subscribe({
        next: (uploadedAvatar) => {
          this.profileForm.avatar = uploadedAvatar;
          this.resetAvatarSelection();
          this.setAvatarPreview(this.accountProfile.resolveStoredImageUrl(uploadedAvatar));
          this.submitProfileUpdate(id);
        },
        error: (err) => {
          this.settingsError = err?.error?.message || err?.error?.error || err?.message || "Echec du chargement de l'image.";
          this.settingsLoading = false;
        },
      });
      return;
    }

    this.submitProfileUpdate(id);
  }

  onAvatarSelected(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0];
    if (!file) {
      return;
    }

    if (!this.accountProfile.allowedAvatarTypes.includes(file.type)) {
      this.settingsError = 'Choisissez une image JPG, PNG ou WebP.';
      input.value = '';
      return;
    }

    if (file.size > this.accountProfile.maxAvatarSizeBytes) {
      this.settingsError = "L'image doit faire moins de 5 MB.";
      input.value = '';
      return;
    }

    this.selectedAvatarFile = file;
    this.avatarFileName = file.name;
    this.setAvatarPreview(URL.createObjectURL(file));
    this.settingsError = '';
    input.value = '';
  }

  removeAvatar(): void {
    this.resetAvatarSelection();
    this.profileForm.avatar = '';
    this.setAvatarPreview('');
    this.settingsError = '';
  }

  private loadProfile(): void {
    if (!Number.isFinite(this.currentUserId)) {
      this.settingsError = 'Session invalide.';
      return;
    }

    this.settingsLoading = true;
    this.accountProfile.getProfile(this.currentUserId).subscribe({
      next: (profile) => {
        this.profileForm = {
          ...this.accountProfile.createEmptyProfileForm(),
          ...profile,
        };
        this.resetAvatarSelection();
        this.setAvatarPreview(this.accountProfile.resolveStoredImageUrl(profile.avatar));
        this.settingsLoading = false;
      },
      error: () => {
        this.settingsError = 'Impossible de charger le profil.';
        this.settingsLoading = false;
      },
    });
  }

  private submitProfileUpdate(id: number): void {
    const previousAvatar = this.authService.getCurrentUser()?.avatar || this.profileForm.avatar || '';
    const body = {
      name: this.profileForm.name,
      email: this.profileForm.email,
      phone: this.profileForm.phone || undefined,
      address: this.profileForm.address || undefined,
      country: this.profileForm.country || undefined,
      age: this.profileForm.age ?? undefined,
      avatar: this.profileForm.avatar?.trim() ?? '',
      bio: this.profileForm.bio || undefined,
      location: this.profileForm.location || undefined,
      website: this.profileForm.website || undefined,
    };

    this.accountProfile.updateProfile(id, body).subscribe({
      next: (profile) => {
        this.profileForm = {
          ...this.profileForm,
          ...profile,
        };
        this.resetAvatarSelection();
        this.setAvatarPreview(this.accountProfile.resolveStoredImageUrl(profile.avatar));
        this.authService.patchStoredUser(this.accountProfile.toSessionUser(profile));

        const nextAvatar = this.accountProfile.normalizeStoredImagePath(profile.avatar);
        const previousAvatarPath = this.accountProfile.normalizeStoredImagePath(previousAvatar);
        if (nextAvatar && nextAvatar !== previousAvatarPath) {
          this.profilePersonalization.syncAvatarImage(nextAvatar, this.authService.getCurrentUser(), true);
        }

        const currentPassword = this.profileForm.currentPassword;
        const newPassword = this.profileForm.newPassword;
        if (currentPassword && newPassword) {
          this.accountProfile.changePassword(id, currentPassword, newPassword).subscribe({
            next: () => {
              this.clearPasswordFields();
              this.settingsSuccess = 'Profil et mot de passe enregistres.';
              this.settingsLoading = false;
            },
            error: (err) => {
              this.settingsError =
                err?.error?.message || err?.error?.error || err?.message || 'Echec du changement de mot de passe.';
              this.settingsLoading = false;
            },
          });
          return;
        }

        this.clearPasswordFields();
        this.settingsSuccess = 'Profil enregistre.';
        this.settingsLoading = false;
      },
      error: (err) => {
        this.settingsError = err?.error?.message || err?.error?.error || err?.message || 'Echec de la mise a jour du profil.';
        this.settingsLoading = false;
      },
    });
  }

  private clearPasswordFields(): void {
    this.profileForm.currentPassword = '';
    this.profileForm.newPassword = '';
    this.profileForm.confirmPassword = '';
  }

  private resetAvatarSelection(): void {
    this.selectedAvatarFile = null;
    this.avatarFileName = '';
  }

  private setAvatarPreview(previewUrl: string): void {
    if (this.avatarPreviewUrl.startsWith('blob:') && this.avatarPreviewUrl !== previewUrl) {
      URL.revokeObjectURL(this.avatarPreviewUrl);
    }
    this.avatarPreviewUrl = previewUrl;
  }
}
