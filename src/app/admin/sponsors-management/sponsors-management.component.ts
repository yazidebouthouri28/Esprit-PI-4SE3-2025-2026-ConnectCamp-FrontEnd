import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-sponsors-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sponsors-management.component.html',
  styleUrls: ['./sponsors-management.component.css'],
})
export class SponsorsManagementComponent implements OnInit {

  searchTerm = '';
  selectedTier = '';
  selectedLocation = '';
  sponsors: any[] = [];
  isLoading = true;
  errorMessage: string | null = null;

  showRequestsModal = false;
  pendingRequests: any[] = [];
  isLoadingRequests = false;

  showEditModal = false;
  selectedSponsor: any = null;
  editForm: any = {};
  isSaving = false;
  isUploadingFile = false;

  showDeleteModal = false;
  isDeleting = false;

  private apiUrl = 'http://localhost:8089/api/sponsors';
  totalSponsorsCount = 0;

  tierOptions = ['GOLD', 'SILVER', 'BRONZE'];

  sponsorStats: any[] = [];
  eventKeywordFilter: string = '';
  showLogsModal = false;
  schedulerLogs: any[] = [];

  // Sponsor Performance Dashboard
  sponsorDashboard: any[] = [];
  isLoadingDashboard = false;
  showDashboardModal = false;

  constructor(private http: HttpClient, private router: Router) { }
  ngOnInit() {
    this.loadSponsors();
    this.loadStats();
    this.http.get<any>(`${this.apiUrl}/all`).subscribe({
      next: (res) => this.totalSponsorsCount = (res.data || []).length,
      error: () => { }
    });
  }

  fetchSchedulerLogs() {
    this.http.get<any>(`http://localhost:8089/api/scheduler-logs`).subscribe({
      next: (res) => {
        // The SchedulerLogController now returns an ApiResponse<Page>
        this.schedulerLogs = res.data?.content || [];
      },
      error: (err) => console.error('Failed to load scheduler logs', err)
    });
  }

  loadStats() {
    this.http.get<any>(`${this.apiUrl}/local-events`).subscribe({
      next: (res) => {
        this.sponsorStats = res.data || [];
      },
      error: (err) => console.error('Failed to load local event matches', err)
    });
  }

  filterByEventKeyword() {
    this.isLoading = true;
    this.errorMessage = null;
    if (!this.eventKeywordFilter) {
      this.loadSponsors();
      return;
    }
    this.http.get<any>(`${this.apiUrl}/filter-by-event-keyword?keyword=${this.eventKeywordFilter}`).subscribe({
      next: (response) => {
        this.sponsors = response.data || [];
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = 'Failed to load filtered sponsors.';
        this.isLoading = false;
      }
    });
  }

  openLogsModal() {
    this.showLogsModal = true;
    this.http.get<any>('http://localhost:8089/api/scheduler-logs').subscribe({
      next: (res) => this.schedulerLogs = res.data?.content || [],
      error: (err) => console.error(err)
    });
  }

  closeLogsModal() {
    this.showLogsModal = false;
  }

  loadSponsors() {
    this.isLoading = true;
    this.errorMessage = null;
    this.http.get<any>(this.apiUrl).subscribe({
      next: (response) => {
        this.sponsors = response.data || [];
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = 'Failed to load sponsors. Please try again.';
        console.error(err);
        this.isLoading = false;
      }
    });
  }

  resolveLogo(logoUrl: string | undefined): string {
    if (!logoUrl) return '';
    if (logoUrl.startsWith('http://') || logoUrl.startsWith('https://') || logoUrl.startsWith('data:')) {
      return logoUrl;
    }
    return `http://localhost:8089/uploads/${logoUrl.replace(/^\/+/, '')}`;
  }

  get filteredSponsors() {
    return this.sponsors.filter(s => {
      const matchSearch = (!this.searchTerm ||
        (s.name || '').toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (s.email || '').toLowerCase().includes(this.searchTerm.toLowerCase()));
      const matchTier = (!this.selectedTier || s.tier === this.selectedTier);
      const matchLocation = (!this.selectedLocation || 
                     (s.country || '').toLowerCase().includes(this.selectedLocation.toLowerCase()) || 
                     (s.city || '').toLowerCase().includes(this.selectedLocation.toLowerCase()));
      return matchSearch && matchTier && matchLocation;
    });
  }

  get activeSponsorsCount(): number {
    return this.sponsors.filter(s => s.isActive).length;
  }

  openRequestsModal() {
    this.showRequestsModal = true;
    this.isLoadingRequests = true;
    this.http.get<any>(`${this.apiUrl}/pending-requests`).subscribe({
      next: (res) => {
        this.pendingRequests = res.data || [];
        this.isLoadingRequests = false;
      },
      error: (err) => {
        console.error(err);
        this.isLoadingRequests = false;
      }
    });
  }

  closeRequestsModal() {
    this.showRequestsModal = false;
    this.pendingRequests = [];
  }

  approveRequest(userId: number) {
    this.http.put(`${this.apiUrl}/pending-requests/${userId}/approve`, {}).subscribe({
      next: () => {
        this.pendingRequests = this.pendingRequests.filter(r => r.id !== userId);
        this.loadSponsors();
      },
      error: (err) => console.error(err)
    });
  }

  rejectRequest(userId: number) {
    this.http.put(`${this.apiUrl}/pending-requests/${userId}/reject`, {}).subscribe({
      next: () => this.pendingRequests = this.pendingRequests.filter(r => r.id !== userId),
      error: (err) => console.error(err)
    });
  }

  openEditModal(sponsor: any) {
    this.selectedSponsor = sponsor;
    this.editForm = { ...sponsor };
    this.showEditModal = true;
  }

  closeEditModal() {
    this.showEditModal = false;
    this.selectedSponsor = null;
    this.editForm = {};
  }

  saveSponsor() {
    if (!this.selectedSponsor) return;
    this.isSaving = true;
    this.http.put<any>(`${this.apiUrl}/${this.selectedSponsor.id}`, this.editForm).subscribe({
      next: (response) => {
        const updated = response.data;
        const index = this.sponsors.findIndex(s => s.id === this.selectedSponsor.id);
        if (index !== -1) this.sponsors[index] = updated;
        this.isSaving = false;
        this.closeEditModal();
      },
      error: (err) => {
        console.error('Update failed:', err);
        this.isSaving = false;
      }
    });
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      this.isUploadingFile = true;
      const formData = new FormData();
      formData.append('file', file);
      this.http.post<any>('http://localhost:8089/api/files/upload', formData).subscribe({
        next: (res) => {
          this.editForm.logo = 'http://localhost:8089/uploads/' + res.data.fileName;
          this.isUploadingFile = false;
        },
        error: (err) => {
          console.error('File upload failed', err);
          this.isUploadingFile = false;
        }
      });
    }
  }

  openDeleteModal(sponsor: any) {
    this.selectedSponsor = sponsor;
    this.showDeleteModal = true;
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.selectedSponsor = null;
  }

  confirmDelete() {
    if (!this.selectedSponsor) return;
    this.isDeleting = true;
    this.http.delete<any>(`${this.apiUrl}/${this.selectedSponsor.id}`).subscribe({
      next: () => {
        this.sponsors = this.sponsors.filter(s => s.id !== this.selectedSponsor.id);
        this.isDeleting = false;
        this.closeDeleteModal();
      },
      error: (err) => {
        console.error('Delete failed:', err);
        this.isDeleting = false;
      }
    });
  }

  goToSponsorshipsView() {
    this.router.navigate(['/admin/sponsorship-assignment']);
  }

  // Sponsor Performance Dashboard Methods
  openDashboardModal() {
    this.showDashboardModal = true;
    this.loadDashboard();
  }

  closeDashboardModal() {
    this.showDashboardModal = false;
  }

  loadDashboard() {
    this.isLoadingDashboard = true;
    this.http.get<any>(`${this.apiUrl}/dashboard`).subscribe({
      next: (res) => {
        this.sponsorDashboard = res.data || [];
        this.isLoadingDashboard = false;
      },
      error: (err) => {
        console.error('Failed to load sponsor dashboard', err);
        this.isLoadingDashboard = false;
      }
    });
  }

  getScoreClass(score: number): string {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 70) return 'bg-blue-100 text-blue-800';
    if (score >= 50) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  }

  getStatusClass(status: string): string {
    if (status === 'High Performer') return 'bg-green-100 text-green-800';
    return 'bg-orange-100 text-orange-800';
  }
}