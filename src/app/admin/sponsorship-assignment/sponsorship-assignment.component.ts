import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-sponsorship-assignment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sponsorship-assignment.component.html',
  styleUrls: ['./sponsorship-assignment.component.css']
})
export class SponsorshipAssignmentComponent implements OnInit {

  // Data lists
  sponsors: any[] = [];
  events: any[] = [];
  sponsorships: any[] = [];

  // Loading states
  isLoadingSponsors = true;
  isLoadingEvents = true;
  isLoadingSponsorships = true;
  isAssigning = false;

  // Selection
  selectedSponsor: any = null;
  selectedEvent: any = null;

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
    declined: 0
  };

  // Filter
  statusFilter = '';

  private apiUrl = 'http://localhost:8089/api/admin/sponsorships';
  private sponsorsUrl = 'http://localhost:8089/api/sponsors';
  private eventsUrl = 'http://localhost:8089/api/events';

  tierOptions = ['PLATINUM', 'DIAMOND', 'GOLD', 'SILVER', 'BRONZE', 'TITLE_SPONSOR'];
  sponsorshipTypes = ['FINANCIAL', 'IN_KIND', 'MEDIA', 'TECHNICAL', 'VENUE', 'CATERING', 'OTHER'];
  currencies = ['TND', 'EUR', 'USD'];

  constructor(private http: HttpClient, private router: Router) { }

  ngOnInit() {
    this.loadSponsors();
    this.loadEvents();
    this.loadSponsorships();
    this.loadStats();
  }

  loadSponsors() {
    this.isLoadingSponsors = true;
    this.http.get<any>(`${this.sponsorsUrl}/active`).subscribe({
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

  loadEvents() {
    this.isLoadingEvents = true;
    this.http.get<any>(`${this.apiUrl}/available-events`).subscribe({
      next: (res) => {
        this.events = res.data || [];
        this.isLoadingEvents = false;
      },
      error: (err) => {
        console.error('Failed to load events', err);
        // Fallback to regular events endpoint
        this.http.get<any>(this.eventsUrl).subscribe({
          next: (eventsRes) => {
            this.events = eventsRes.data || [];
            this.isLoadingEvents = false;
          },
          error: () => this.isLoadingEvents = false
        });
      }
    });
  }

  loadSponsorships() {
    this.isLoadingSponsorships = true;
    const url = this.statusFilter 
      ? `${this.apiUrl}/by-status/${this.statusFilter}`
      : `${this.apiUrl}?page=0&size=50`;
    
    this.http.get<any>(url).subscribe({
      next: (res) => {
        this.sponsorships = res.data?.content || res.data || [];
        this.isLoadingSponsorships = false;
      },
      error: (err) => {
        console.error('Failed to load sponsorships', err);
        this.isLoadingSponsorships = false;
      }
    });
  }

  loadStats() {
    this.http.get<any>(`${this.apiUrl}/stats`).subscribe({
      next: (res) => {
        this.stats = res.data || this.stats;
      },
      error: (err) => console.error('Failed to load stats', err)
    });
  }

  selectSponsor(sponsor: any) {
    this.selectedSponsor = sponsor;
  }

  selectEvent(event: any) {
    this.selectedEvent = event;
    // Pre-populate dates based on event dates
    if (event.startDateTime) {
      this.sponsorshipForm.startDate = this.formatDateForInput(event.startDateTime);
    }
    if (event.endDateTime) {
      this.sponsorshipForm.endDate = this.formatDateForInput(event.endDateTime);
    }
  }

  formatDateForInput(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toISOString().split('T')[0];
  }

  assignSponsorship() {
    // Reset errors
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

    // Validate sponsor
    if (!this.selectedSponsor) {
      this.formErrors.sponsor = 'Please select a sponsor';
    }

    // Validate event
    if (!this.selectedEvent) {
      this.formErrors.event = 'Please select an event';
    }

    // Validate amount
    if (!this.sponsorshipForm.amount || this.sponsorshipForm.amount <= 0) {
      this.formErrors.amount = 'Amount must be greater than 0';
    }

    // Validate dates
    if (!this.sponsorshipForm.startDate) {
      this.formErrors.startDate = 'Start date is required';
    }
    if (!this.sponsorshipForm.endDate) {
      this.formErrors.endDate = 'End date is required';
    }
    if (this.sponsorshipForm.startDate && this.sponsorshipForm.endDate &&
        new Date(this.sponsorshipForm.startDate) > new Date(this.sponsorshipForm.endDate)) {
      this.formErrors.endDate = 'End date must be after start date';
    }

    // Check if there are any errors
    const hasErrors = Object.values(this.formErrors).some(error => error !== '');
    if (hasErrors) {
      return;
    }

    this.isAssigning = true;
    
    const requestBody = {
      ...this.sponsorshipForm,
      isActive: true,
      status: 'PENDING'
    };

    this.http.post<any>(
      `${this.apiUrl}/assign?sponsorId=${this.selectedSponsor.id}&eventId=${this.selectedEvent.id}`,
      requestBody
    ).subscribe({
      next: (res) => {
        alert('Sponsorship assigned successfully! Email with PDF receipt sent to sponsor.');
        this.isAssigning = false;
        this.resetForm();
        this.loadSponsorships();
        this.loadStats();
      },
      error: (err) => {
        console.error('Failed to assign sponsorship', err);
        const errorMessage = err.error?.message || err.error?.error || 'Failed to assign sponsorship. Please check all fields and try again.';
        alert(errorMessage);
        this.isAssigning = false;
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

  goBack() {
    this.router.navigate(['/admin/sponsors']);
  }
}
