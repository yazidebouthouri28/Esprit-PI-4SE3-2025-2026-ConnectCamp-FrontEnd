import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { CertificationService } from '../../../services/certification.service';
import { Certification, CertificationItem } from '../../../models/camping.models';

type Criteria = CertificationItem['criteriaName'];

@Component({
  selector: 'app-site-certifications',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-8 animate-fade-in">
      <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h3 class="text-lg font-black text-[#1a2e1a]">Certification requests</h3>
          <p class="text-xs text-[#617152] font-medium max-w-xl">
            Each request lists rules this campsite must satisfy. Use <strong>Approved</strong> to grant the blue verification badge on public campsite cards, or <strong>Denied</strong> to remove it.
            A certification is <strong>auto-approved</strong> when its total score exceeds <strong>25</strong>.
          </p>
        </div>
        <button type="button" (click)="createNewCertification()"
          class="px-4 py-2 bg-[#2C4A3C] text-white rounded-lg text-xs font-black uppercase tracking-widest hover:bg-[#1a2e1a] transition-all shrink-0">
          New verification request
        </button>
      </div>

      <p *ngIf="actionError" class="text-xs font-bold text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{{ actionError }}</p>

      <div *ngFor="let cert of certifications" class="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <!-- Cert Header -->
        <div class="p-6 bg-[#f7f5f0] flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 border-b border-[#e9e6df]">
          <div class="flex items-start gap-4">
            <div class="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0" [ngClass]="getStatusBg(cert.status)">
              {{ cert.status === 'APPROVED' || cert.status === 'CERTIFIED' ? '✓' : cert.status === 'REJECTED' ? '✕' : '⏳' }}
            </div>
            <div>
              <p class="text-sm font-black text-[#1a2e1a]">{{ cert.title || 'Verification' }}</p>
              <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">{{ cert.certificationCode }}</p>
              <p class="text-xs text-[#617152] mt-2 whitespace-pre-line">{{ cert.description }}</p>
              <div class="flex items-center gap-3 mt-2 flex-wrap">
                <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                  Expires: {{ (cert.expirationDate || cert.expiryDate) | date:'mediumDate' }}
                </p>
                <!-- Live total score badge -->
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black"
                  [ngClass]="getTotalScore(cert) > 25
                    ? 'bg-emerald-100 text-emerald-800'
                    : getTotalScore(cert) > 15
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-red-100 text-red-700'">
                  Score: {{ getTotalScore(cert) }} / {{ getMaxScore(cert) }}
                  <span *ngIf="getTotalScore(cert) > 25" class="text-emerald-600">✓ Auto-approved</span>
                </span>
              </div>
            </div>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <span class="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-current"
              [ngClass]="getStatusPill(cert.status)">
              {{ displayStatus(cert.status) }}
            </span>
            <ng-container *ngIf="isPendingLike(cert.status)">
              <button type="button" (click)="approve(cert.id)"
                class="px-4 py-2 rounded-xl bg-[#1F4D36] text-white text-[10px] font-black uppercase tracking-widest hover:bg-[#163a28]">
                Approved
              </button>
              <button type="button" (click)="deny(cert.id)"
                class="px-4 py-2 rounded-xl bg-white border-2 border-red-200 text-red-600 text-[10px] font-black uppercase tracking-widest hover:bg-red-50">
                Denied
              </button>
            </ng-container>
            <!-- Revoke for already-approved certs -->
            <button *ngIf="!isPendingLike(cert.status)" type="button" (click)="deny(cert.id)"
              class="px-4 py-2 rounded-xl bg-white border-2 border-red-200 text-red-600 text-[10px] font-black uppercase tracking-widest hover:bg-red-50">
              Revoke
            </button>
            <button type="button" (click)="deleteCertification(cert.id)" title="Delete"
              class="w-9 h-9 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 flex items-center justify-center transition-colors text-sm">
              🗑️
            </button>
          </div>
        </div>

        <!-- Criteria Items with inline score editing -->
        <div class="p-6 space-y-3">
          <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Rules &amp; audit criteria</p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div *ngFor="let item of cert.items" class="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{{ item.criteriaName }}</p>
              <p class="text-xs font-bold text-[#1a2e1a]">{{ item.name }}</p>
              <p class="text-xs text-[#617152] mt-1 mb-3">{{ item.comment }}</p>

              <!-- Inline score editor -->
              <div class="flex items-center gap-2 mt-2">
                <span class="text-[10px] font-black text-gray-500 uppercase tracking-widest">Score:</span>
                <div class="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    [max]="item.requiredScore || 10"
                    [(ngModel)]="item.score"
                    (change)="saveItemScore(cert, item)"
                    class="w-14 px-2 py-0.5 border border-gray-200 rounded-lg text-xs font-black text-center text-[#1a2e1a] focus:outline-none focus:ring-2 focus:ring-[#1F4D36]/30 bg-white"
                  >
                  <span class="text-xs font-bold text-gray-400">/ {{ item.requiredScore || 10 }}</span>
                </div>
                <!-- Progress bar -->
                <div class="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div class="h-full rounded-full transition-all duration-300"
                    [style.width.%]="((item.score || 0) / (item.requiredScore || 10)) * 100"
                    [ngClass]="(item.score || 0) >= (item.requiredScore || 10)
                      ? 'bg-emerald-500'
                      : (item.score || 0) > (item.requiredScore || 10) * 0.5
                        ? 'bg-amber-400'
                        : 'bg-red-400'">
                  </div>
                </div>
              </div>
            </div>
          </div>
          <button type="button" (click)="selectedCertId = cert.id"
            class="w-full sm:w-auto px-4 py-2 border-2 border-dashed border-gray-200 rounded-xl text-[10px] font-black text-gray-400 hover:border-[#2C4A3C] hover:text-[#2C4A3C] transition-all">
            + Add custom criterion
          </button>
        </div>
      </div>

      <div *ngIf="certifications.length === 0" class="py-12 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
        <p class="text-gray-500 font-bold">No certification requests yet.</p>
        <p class="text-xs text-gray-400 mt-2">Click <strong>New verification request</strong> to generate the standard rules checklist.</p>
      </div>

      <!-- Add custom criterion modal -->
      <div *ngIf="selectedCertId" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl space-y-6">
          <h2 class="text-xl font-bold text-[#1a2e1a]">Add criterion</h2>
          <div class="space-y-4">
            <div>
              <label class="block text-xs font-bold text-gray-400 uppercase mb-1">Criteria</label>
              <select [(ngModel)]="newItem.criteriaName" class="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm outline-none">
                <option value="SAFETY">Safety</option>
                <option value="CLEANLINESS">Cleanliness</option>
                <option value="EQUIPMENT">Equipment</option>
                <option value="SERVICES">Services</option>
                <option value="LOCATION">Location</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-400 uppercase mb-1">Score (0–10)</label>
              <input type="number" [(ngModel)]="newItem.score" max="10" min="0" class="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm outline-none">
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-400 uppercase mb-1">Comment</label>
              <textarea [(ngModel)]="newItem.comment" rows="2" class="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm outline-none"></textarea>
            </div>
          </div>
          <div class="flex justify-end gap-3 pt-4">
            <button type="button" (click)="selectedCertId = null" class="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-700">Cancel</button>
            <button type="button" (click)="addItem()" class="px-6 py-2 bg-[#2C4A3C] text-white rounded-lg text-sm font-bold">Add</button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class SiteCertificationsComponent implements OnInit, OnChanges {
  @Input() siteId!: number;
  certifications: Certification[] = [];
  selectedCertId: number | null = null;
  newItem: Partial<CertificationItem> = { criteriaName: 'SAFETY', score: 0 };
  actionError = '';

  private readonly defaultRuleTemplates: Array<{
    criteriaName: Criteria;
    name: string;
    comment: string;
    requiredScore: number;
  }> = [
    {
      criteriaName: 'SAFETY',
      name: 'Safety & emergencies',
      comment: 'Fire safety measures, marked exits, first-aid kit, and emergency contact information must be visible to guests.',
      requiredScore: 7
    },
    {
      criteriaName: 'CLEANLINESS',
      name: 'Sanitation',
      comment: 'Restrooms, waste disposal, and potable water (where advertised) must meet basic hygiene standards.',
      requiredScore: 7
    },
    {
      criteriaName: 'EQUIPMENT',
      name: 'Site facilities',
      comment: 'Listed amenities (parking, lighting, structures) must be operational and safe for the declared capacity.',
      requiredScore: 7
    },
    {
      criteriaName: 'SERVICES',
      name: 'Guest communication',
      comment: 'Check-in/check-out rules and house rules must be accurate and accessible before booking.',
      requiredScore: 7
    },
    {
      criteriaName: 'LOCATION',
      name: 'Location accuracy',
      comment: 'Map location and address must match the real campsite; no misleading photos of the pitch area.',
      requiredScore: 7
    }
  ];

  constructor(private certService: CertificationService) { }

  ngOnInit() {
    this.loadCertifications();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['siteId'] && !changes['siteId'].firstChange) {
      this.loadCertifications();
    }
  }

  loadCertifications() {
    if (!this.siteId) {
      this.certifications = [];
      return;
    }
    this.certService.getCertificationsBySite(this.siteId).subscribe((c) => (this.certifications = c));
  }

  getTotalScore(cert: Certification): number {
    return (cert.items ?? []).reduce((sum, item) => sum + (item.score || 0), 0);
  }

  getMaxScore(cert: Certification): number {
    return (cert.items ?? []).reduce((sum, item) => sum + (item.requiredScore || 10), 0);
  }

  /** Save score edit and auto-approve if total > 25 */
  saveItemScore(cert: Certification, item: CertificationItem): void {
    this.actionError = '';
    const clampedScore = Math.max(0, Math.min(item.requiredScore || 10, item.score || 0));
    item.score = clampedScore;

    this.certService.updateItemScore(item.id, clampedScore).subscribe({
      next: () => {
        const total = this.getTotalScore(cert);
        // Auto-approve if total > 25 and cert is still pending
        if (total > 25 && this.isPendingLike(cert.status)) {
          this.certService.updateCertificationStatus(cert.id, 'APPROVED').subscribe({
            next: () => this.loadCertifications(),
            error: () => (this.actionError = 'Score saved but auto-approve failed.')
          });
        }
      },
      error: () => (this.actionError = 'Unable to save score.')
    });
  }

  createNewCertification() {
    this.actionError = '';
    const rulesBody = this.defaultRuleTemplates.map((r) => `• ${r.name}: ${r.comment}`).join('\n');
    const cert: Partial<Certification> = {
      title: 'CampConnect site verification',
      description:
        'This campsite is evaluated against CampConnect operating rules. Inspectors must confirm each criterion before approval.\n\n' +
        rulesBody,
      issuingOrganization: 'CampConnect Compliance',
      status: 'PENDING',
      score: 0,
      issueDate: new Date(),
      expirationDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
    };

    this.certService
      .createCertification(this.siteId, cert)
      .pipe(
        switchMap((created) => {
          const items$ = this.defaultRuleTemplates.map((tpl) =>
            this.certService.addCertificationItem({
              certificationId: created.id,
              criteriaName: tpl.criteriaName,
              name: tpl.name,
              comment: tpl.comment,
              score: 0,
              requiredScore: tpl.requiredScore,
              passed: false
            })
          );
          return forkJoin(items$);
        })
      )
      .subscribe({
        next: () => this.loadCertifications(),
        error: () => (this.actionError = 'Unable to create certification request.')
      });
  }

  approve(id: number) {
    this.actionError = '';
    this.certService.updateCertificationStatus(id, 'APPROVED').subscribe({
      next: () => this.loadCertifications(),
      error: () => (this.actionError = 'Unable to approve certification.')
    });
  }

  deny(id: number) {
    this.actionError = '';
    this.certService.updateCertificationStatus(id, 'REJECTED').subscribe({
      next: () => this.loadCertifications(),
      error: () => (this.actionError = 'Unable to deny certification.')
    });
  }

  deleteCertification(id: number) {
    if (confirm('Permanently delete this certification?')) {
      this.certService.deleteCertification(id).subscribe(() => this.loadCertifications());
    }
  }

  addItem() {
    if (this.selectedCertId && this.newItem.criteriaName) {
      const item = {
        ...this.newItem,
        name: `${this.newItem.criteriaName} check`,
        requiredScore: 7,
        certificationId: this.selectedCertId
      } as CertificationItem;
      this.certService.addCertificationItem(item).subscribe(() => {
        this.loadCertifications();
        this.selectedCertId = null;
        this.newItem = { criteriaName: 'SAFETY', score: 0 };
      });
    }
  }

  isPendingLike(status: string): boolean {
    const u = String(status || '').toUpperCase();
    return u === 'PENDING' || u === 'UNDER_REVIEW';
  }

  displayStatus(status: string): string {
    const u = String(status || '').toUpperCase();
    if (u === 'CERTIFIED' || u === 'APPROVED') return 'Approved';
    if (u === 'REJECTED') return 'Denied';
    if (u === 'PENDING') return 'Pending review';
    return status;
  }

  getStatusBg(status: string) {
    const u = String(status || '').toUpperCase();
    if (u === 'APPROVED' || u === 'CERTIFIED') return 'bg-emerald-100';
    if (u === 'REJECTED') return 'bg-red-100';
    return 'bg-amber-100';
  }

  getStatusPill(status: string) {
    const u = String(status || '').toUpperCase();
    if (u === 'APPROVED' || u === 'CERTIFIED') return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    if (u === 'REJECTED') return 'bg-red-50 text-red-700 border-red-200';
    return 'bg-amber-50 text-amber-800 border-amber-200';
  }
}
