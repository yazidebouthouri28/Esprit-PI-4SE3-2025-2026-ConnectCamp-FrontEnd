import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'connectcamp_admin_camper_view';

@Injectable({ providedIn: 'root' })
export class ViewModeService {
  readonly adminInCamperSpace = signal(this.readStorage());

  private readStorage(): boolean {
    if (typeof sessionStorage === 'undefined') {
      return false;
    }
    return sessionStorage.getItem(STORAGE_KEY) === '1';
  }

  enterCamperView(): void {
    sessionStorage.setItem(STORAGE_KEY, '1');
    this.adminInCamperSpace.set(true);
  }

  exitCamperView(): void {
    sessionStorage.removeItem(STORAGE_KEY);
    this.adminInCamperSpace.set(false);
  }
}
