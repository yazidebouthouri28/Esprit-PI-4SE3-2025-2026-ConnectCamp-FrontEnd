import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-organizer-sponsorships',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './organizer-sponsorships.component.html',
  styleUrls: ['./organizer-sponsorships.component.css']
})
export class OrganizerSponsorshipsComponent implements OnInit {

  // Data lists
  myEvents: any[] = [];
  sponsors: any[] = [];
  sponsorships: any[] = [];
  sponsorshipRequests: any[] = []; // REQUESTED status from sponsors
  possibleMatches: any[] = []; // Possible sponsorship matches

  // Loading states
  isLoadingEvents = true;
  isLoadingSponsors = true;
  isLoadingSponsorships = true;
  isLoadingRequests = true;
  isLoadingMatches = true;
  isAssigning = false;

  // Selection
  selectedEvent: any = null;
  selectedSponsor: any = null;

  // Form data
  sponsorshipForm = {
    sponsorshipType: 'FINANCIAL',
    sponsorshipLevel: 'BRONZE',
    description: '',
    amount: 0,
    currency: 'TND',
    startDate: '',
    endDate: '',
    benefits: '',
    deliverables: '',
    notes: ''
  };

  // Form validation
  formErrors = {
    sponsor: '',
    event: '',
    sponsorshipType: '',
    sponsorshipLevel: '',
    amount: '',
    currency: '',
    startDate: '',
    endDate: ''
  };

  // Stats
  stats = {
    total: 0,
    pending: 0,
    accepted: 0,
    declined: 0,
    requested: 0
  };

  // Filter
  statusFilter = '';
  organizerId: number | null = null;

  private apiUrl = environment.apiUrl + '/api/organizer/sponsorships';
  private adminApiUrl = environment.apiUrl + '/api/admin/sponsorships';
  private sponsorsUrl = environment.apiUrl + '/api/sponsors';
  private eventsUrl = environment.apiUrl + '/api/organizers';

  tierOptions = ['PLATINUM', 'DIAMOND', 'GOLD', 'SILVER', 'BRONZE'];
  sponsorshipTypes = ['FINANCIAL', 'IN_KIND', 'MEDIA', 'TECHNICAL', 'VENUE', 'CATERING', 'OTHER'];
  currencies = ['TND', 'EUR', 'USD'];

  constructor(
    private http: HttpClient,
    private router: Router,
    private authService: AuthService
  ) { }

  ngOnInit() {
    this.loadOrganizerId();
  }

  loadOrganizerId() {
    const currentUser = this.authService.getCurrentUser() as any;
    if (!currentUser || !currentUser.id) {
      console.error('No current user found');
      return;
    }

    // Get organizer ID from user ID
    this.http.get<any>(`${this.eventsUrl}/by-user/${currentUser.id}`).subscribe({
      next: (res) => {
        if (res.data) {
          this.organizerId = res.data;
          this.loadMyEvents();
          this.loadSponsors();
          this.loadSponsorships();
          this.loadSponsorshipRequests();
          this.loadPossibleMatches();
        } else {
          console.error('User is not an organizer');
        }
      },
      error: (err) => {
        console.error('Failed to get organizer ID', err);
      }
    });
  }

  loadMyEvents() {
    if (!this.organizerId) return;
    
    this.isLoadingEvents = true;
    this.http.get<any>(`${this.eventsUrl}/${this.organizerId}/events`).subscribe({
      next: (res) => {
        this.myEvents = res.data || [];
        this.isLoadingEvents = false;
      },
      error: (err) => {
        console.error('Failed to load my events', err);
        this.isLoadingEvents = false;
      }
    });
  }

  loadSponsors() {
    this.isLoadingSponsors = true;
    this.http.get<any>(this.sponsorsUrl).subscribe({
      next: (res) => {
        this.sponsors = res.data || [];
        this.isLoadingSponsors = false;
      },
      error: (err) => {
        console.error('Failed to load sponsors', err);
        this.isLoadingSponsors = false;
      }
    });
  }

  loadSponsorships() {
    if (!this.organizerId) return;
    
    this.isLoadingSponsorships = true;
    const url = this.statusFilter
      ? `${this.apiUrl}/organizer/${this.organizerId}?status=${this.statusFilter}`
      : `${this.apiUrl}/organizer/${this.organizerId}`;

    this.http.get<any>(url).subscribe({
      next: (res) => {
        this.sponsorships = res.data || [];
        this.calculateStats();
        this.isLoadingSponsorships = false;
      },
      error: (err) => {
        console.error('Failed to load sponsorships', err);
        this.isLoadingSponsorships = false;
      }
    });
  }

  loadSponsorshipRequests() {
    if (!this.organizerId) return;
    
    this.isLoadingRequests = true;
    this.http.get<any>(`${this.eventsUrl}/${this.organizerId}/sponsorship-requests`).subscribe({
      next: (res) => {
        this.sponsorshipRequests = res.data || [];
        this.stats.requested = this.sponsorshipRequests.length;
        this.isLoadingRequests = false;
      },
      error: (err) => {
        console.error('Failed to load sponsorship requests', err);
        this.isLoadingRequests = false;
      }
    });
  }

  loadPossibleMatches() {
    if (!this.organizerId) return;
    
    this.isLoadingMatches = true;
    this.http.get<any>(`${this.adminApiUrl}/possible-matches?organizerId=${this.organizerId}`).subscribe({
      next: (res) => {
        this.possibleMatches = res.data || [];
        this.isLoadingMatches = false;
      },
      error: (err) => {
        console.error('Failed to load possible matches', err);
        this.isLoadingMatches = false;
      }
    });
  }

  calculateStats() {
    this.stats.total = this.sponsorships.length;
    this.stats.pending = this.sponsorships.filter((s: any) => s.status === 'PENDING').length;
    this.stats.accepted = this.sponsorships.filter((s: any) => s.status === 'ACCEPTED' || s.status === 'APPROVED').length;
    this.stats.declined = this.sponsorships.filter((s: any) => s.status === 'DECLINED').length;
  }

  validateForm(): boolean {
    let isValid = true;
    this.formErrors = {
      sponsor: '',
      event: '',
      sponsorshipType: '',
      sponsorshipLevel: '',
      amount: '',
      currency: '',
      startDate: '',
      endDate: ''
    };

    if (!this.selectedSponsor) {
      this.formErrors.sponsor = 'Please select a sponsor';
      isValid = false;
    }

    if (!this.selectedEvent) {
      this.formErrors.event = 'Please select an event';
      isValid = false;
    }

    if (!this.sponsorshipForm.sponsorshipType) {
      this.formErrors.sponsorshipType = 'Sponsorship type is required';
      isValid = false;
    }

    if (!this.sponsorshipForm.sponsorshipLevel) {
      this.formErrors.sponsorshipLevel = 'Sponsorship level is required';
      isValid = false;
    }

    if (!this.sponsorshipForm.amount || this.sponsorshipForm.amount <= 0) {
      this.formErrors.amount = 'Amount must be greater than 0';
      isValid = false;
    }

    if (!this.sponsorshipForm.currency) {
      this.formErrors.currency = 'Currency is required';
      isValid = false;
    }

    if (!this.sponsorshipForm.startDate) {
      this.formErrors.startDate = 'Start date is required';
      isValid = false;
    }

    if (!this.sponsorshipForm.endDate) {
      this.formErrors.endDate = 'End date is required';
      isValid = false;
    }

    return isValid;
  }

  assignSponsorship() {
    if (!this.validateForm()) {
      return;
    }

    this.isAssigning = true;

    const request = {
      sponsorId: this.selectedSponsor.id,
      eventId: this.selectedEvent.id,
      ...this.sponsorshipForm
    };

    this.http.post<any>(`${this.apiUrl}/assign?sponsorId=${request.sponsorId}&eventId=${request.eventId}`, this.sponsorshipForm).subscribe({
      next: (res) => {
        alert('Sponsorship invitation sent successfully!');
        this.resetForm();
        this.loadSponsorships();
        this.isAssigning = false;
      },
      error: (err) => {
        console.error('Failed to assign sponsorship', err);
        alert('Failed to assign sponsorship: ' + (err.error?.message || err.message));
        this.isAssigning = false;
      }
    });
  }

  approveRequest(requestId: number) {
    this.http.post<any>(`${this.apiUrl}/${requestId}/approve`, {}).subscribe({
      next: (res) => {
        alert('Sponsorship request approved!');
        this.loadSponsorshipRequests();
        this.loadSponsorships();
      },
      error: (err) => {
        console.error('Failed to approve request', err);
        alert('Failed to approve: ' + (err.error?.message || err.message));
      }
    });
  }

  rejectRequest(requestId: number) {
    this.http.post<any>(`${this.apiUrl}/${requestId}/reject`, {}).subscribe({
      next: (res) => {
        alert('Sponsorship request rejected.');
        this.loadSponsorshipRequests();
        this.loadSponsorships();
      },
      error: (err) => {
        console.error('Failed to reject request', err);
        alert('Failed to reject: ' + (err.error?.message || err.message));
      }
    });
  }

  resetForm() {
    this.selectedSponsor = null;
    this.selectedEvent = null;
    this.sponsorshipForm = {
      sponsorshipType: 'FINANCIAL',
      sponsorshipLevel: 'BRONZE',
      description: '',
      amount: 0,
      currency: 'TND',
      startDate: '',
      endDate: '',
      benefits: '',
      deliverables: '',
      notes: ''
    };
    this.formErrors = {
      sponsor: '',
      event: '',
      sponsorshipType: '',
      sponsorshipLevel: '',
      amount: '',
      currency: '',
      startDate: '',
      endDate: ''
    };
  }

  selectEvent(event: any) {
    this.selectedEvent = event;
    this.formErrors.event = '';
  }

  selectSponsor(sponsor: any) {
    this.selectedSponsor = sponsor;
    this.formErrors.sponsor = '';
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'REQUESTED':
        return 'bg-purple-100 text-purple-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'ACCEPTED':
        return 'bg-green-100 text-green-800';
      case 'DECLINED':
        return 'bg-red-100 text-red-800';
      case 'APPROVED':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  clearFormError(field: string) {
    (this.formErrors as any)[field] = '';
  }
}
