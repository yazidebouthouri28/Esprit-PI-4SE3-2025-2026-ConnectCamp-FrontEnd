import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-sponsors-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sponsors-management.component.html',
  styleUrls: ['./sponsors-management.component.css'],
})
export class SponsorsManagementComponent implements OnInit {

  searchTerm = '';
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

  tierOptions = ['GOLD', 'SILVER', 'BRONZE', 'PLATINUM', 'DIAMOND', 'TITLE_SPONSOR'];

  constructor(private http: HttpClient) {}
ngOnInit() {
  this.loadSponsors();
  this.http.get<any>(`${this.apiUrl}/all`).subscribe({
    next: (res) => this.totalSponsorsCount = (res.data || []).length,
    error: () => {}
  });
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

  get filteredSponsors() {
    return this.sponsors.filter(s =>
      !this.searchTerm ||
      (s.name || '').toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      (s.email || '').toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  get activeSponsorsCount(): number {
    return this.sponsors.filter(s => s.isActive).length;
  }

  openRequestsModal() {
    this.showRequestsModal = true;
    this.isLoadingRequests = true;
    this.http.get<any>(`${this.apiUrl}/requests`).subscribe({
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
    this.http.put(`${this.apiUrl}/requests/${userId}/approve`, {}).subscribe({
      next: () => {
        this.pendingRequests = this.pendingRequests.filter(r => r.id !== userId);
        this.loadSponsors();
      },
      error: (err) => console.error(err)
    });
  }

  rejectRequest(userId: number) {
    this.http.put(`${this.apiUrl}/requests/${userId}/reject`, {}).subscribe({
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
}