import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-sponsor-event-request',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sponsor-event-request.component.html',
  styleUrls: ['./sponsor-event-request.component.css']
})
export class SponsorEventRequestComponent implements OnInit {

  // Data lists
  availableEvents: any[] = [];
  mySponsorships: any[] = [];
  pendingInvitations: any[] = [];

  // Loading states
  isLoadingEvents = true;
  isLoadingSponsorships = true;
  isSubmittingRequest = false;
  isResponding = false;

  // User info
  currentUser: any = null;
  sponsorId: number | null = null;
  manualSponsorId: number | null = null;
  showManualInput = false;

  // Dashboard stats
  stats = {
    totalSponsorships: 0,
    pendingInvitations: 0,
    acceptedSponsorships: 0,
    totalAmountCommitted: 0
  };

  // Selected event for request
  selectedEvent: any = null;
  showRequestForm = false;

  // Request form data
  requestForm = {
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
  requestFormErrors: string[] = [];

  private apiUrl = 'http://localhost:8089/api/sponsor';

  tierOptions = ['PLATINUM', 'DIAMOND', 'GOLD', 'SILVER', 'BRONZE'];
  sponsorshipTypes = ['FINANCIAL', 'IN_KIND', 'MEDIA', 'TECHNICAL', 'VENUE', 'CATERING', 'OTHER'];
  currencies = ['TND', 'EUR', 'USD'];

  constructor(
    private http: HttpClient,
    private router: Router,
    private authService: AuthService
  ) { }

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    console.log('Current user:', this.currentUser);

    if (this.currentUser) {
      // First, try to find sponsor by email
      this.findSponsorByEmail();
    } else {
      this.router.navigate(['/auth/login']);
    }
  }

  findSponsorByEmail() {
    console.log('Fetching current sponsor for authenticated user');

    // Call API to get current sponsor based on authenticated user
    this.http.get<any>(`http://localhost:8089/api/sponsor/current`).subscribe({
      next: (res) => {
        const sponsor = res.data;
        if (sponsor && sponsor.id) {
          this.sponsorId = sponsor.id;
          console.log('Found sponsor with ID:', this.sponsorId);
          this.loadData();
        } else {
          console.error('No sponsor found for current user');
          this.sponsorId = this.currentUser.id;
          console.log('Fallback to userId:', this.sponsorId);
          this.loadData();
        }
      },
      error: (err) => {
        console.error('Failed to find current sponsor:', err);
        // Fallback to userId
        this.sponsorId = this.currentUser.id;
        console.log('Fallback to userId:', this.sponsorId);
        this.loadData();
      }
    });
  }

  loadData() {
    this.loadAvailableEvents();
    this.loadMySponsorships();
    this.loadDashboardStats();
  }

  updateSponsorId() {
    if (this.manualSponsorId) {
      this.sponsorId = this.manualSponsorId;
      console.log('Updated sponsorId to:', this.sponsorId);
      this.loadData();
    }
  }

  loadAvailableEvents() {
    this.isLoadingEvents = true;
    this.http.get<any>(`${this.apiUrl}/available-events`).subscribe({
      next: (res) => {
        this.availableEvents = res.data || [];
        this.isLoadingEvents = false;
      },
      error: (err) => {
        console.error('Failed to load available events', err);
        this.isLoadingEvents = false;
      }
    });
  }

  loadMySponsorships() {
    this.isLoadingSponsorships = true;
    let url = `${this.apiUrl}/my-sponsorships`;
    if (this.sponsorId) {
      url += `?sponsorId=${this.sponsorId}`;
    }
    console.log('Loading sponsorships from URL:', url);
    console.log('Using sponsorId:', this.sponsorId);
    this.http.get<any>(url).subscribe({
      next: (res) => {
        this.mySponsorships = res.data || [];
        // Separate pending invitations (status = PENDING)
        this.pendingInvitations = this.mySponsorships.filter(s => s.status === 'PENDING');
        console.log('Loaded sponsorships:', this.mySponsorships);
        console.log('Pending invitations:', this.pendingInvitations);
        this.isLoadingSponsorships = false;
      },
      error: (err) => {
        console.error('Failed to load my sponsorships', err);
        this.isLoadingSponsorships = false;
      }
    });
  }

  loadDashboardStats() {
    let url = `${this.apiUrl}/dashboard-stats`;
    if (this.sponsorId) {
      url += `?sponsorId=${this.sponsorId}`;
    }
    this.http.get<any>(url).subscribe({
      next: (res) => {
        this.stats = res.data || this.stats;
      },
      error: (err) => console.error('Failed to load dashboard stats', err)
    });
  }

  selectEventForRequest(event: any) {
    this.selectedEvent = event;
    this.showRequestForm = true;
    // Pre-populate dates
    if (event.startDateTime) {
      this.requestForm.startDate = this.formatDateForInput(event.startDateTime);
    }
    if (event.endDateTime) {
      this.requestForm.endDate = this.formatDateForInput(event.endDateTime);
    }
  }

  formatDateForInput(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toISOString().split('T')[0];
  }

  validateRequestForm(): boolean {
    this.requestFormErrors = [];
    
    if (!this.requestForm.sponsorshipType) {
      this.requestFormErrors.push('Sponsorship type is required');
    }
    
    if (!this.requestForm.amount || this.requestForm.amount <= 0) {
      this.requestFormErrors.push('Amount must be greater than 0');
    }
    
    if (!this.requestForm.currency) {
      this.requestFormErrors.push('Currency is required');
    }
    
    if (!this.requestForm.startDate) {
      this.requestFormErrors.push('Start date is required');
    }
    
    if (!this.requestForm.endDate) {
      this.requestFormErrors.push('End date is required');
    }
    
    if (this.requestForm.startDate && this.requestForm.endDate && 
        this.requestForm.endDate < this.requestForm.startDate) {
      this.requestFormErrors.push('End date must be after start date');
    }
    
    return this.requestFormErrors.length === 0;
  }

  submitSponsorshipRequest() {
    if (!this.selectedEvent || !this.sponsorId) {
      this.requestFormErrors = ['Please select an event and ensure you are logged in'];
      return;
    }

    // Validate form
    if (!this.validateRequestForm()) {
      return;
    }

    this.isSubmittingRequest = true;
    this.requestFormErrors = [];

    const requestBody = {
      ...this.requestForm,
      isActive: true
    };

    console.log('Submitting sponsorship request:', requestBody);

    this.http.post<any>(
      `${this.apiUrl}/request-sponsorship?sponsorId=${this.sponsorId}&eventId=${this.selectedEvent.id}`,
      requestBody
    ).subscribe({
      next: (res) => {
        alert('Sponsorship request submitted successfully! Waiting for admin approval.');
        this.isSubmittingRequest = false;
        this.cancelRequestForm();
        this.loadData();
      },
      error: (err) => {
        console.error('Failed to submit request', err);
        this.isSubmittingRequest = false;
        
        // Display specific error messages
        if (err.error && err.error.message) {
          this.requestFormErrors = [err.error.message];
        } else if (err.error && err.error.errors) {
          // Handle validation errors array
          this.requestFormErrors = err.error.errors;
        } else {
          this.requestFormErrors = ['Failed to submit request. Please check all required fields.'];
        }
      }
    });
  }

  cancelRequestForm() {
    this.showRequestForm = false;
    this.selectedEvent = null;
    this.requestFormErrors = [];
    this.requestForm = {
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
  }

  downloadSponsorshipPDF(sponsorship: any) {
    const url = `${this.apiUrl}/sponsorships/${sponsorship.id}/agreement-pdf`;
    
    // Use HttpClient to download with JWT token in headers
    this.http.get(url, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        // Create blob URL and trigger download
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `sponsorship-agreement-${sponsorship.id}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      },
      error: (err) => {
        console.error('Failed to download PDF', err);
        alert('Failed to download PDF: ' + (err.error?.message || err.message));
      }
    });
  }

  acceptInvitation(sponsorship: any) {
    if (!confirm('Are you sure you want to accept this sponsorship invitation?')) {
      return;
    }

    this.isResponding = true;
    this.http.post<any>(`${this.apiUrl}/sponsorships/${sponsorship.id}/accept`, {}).subscribe({
      next: (res) => {
        alert('Sponsorship accepted! A confirmation email with receipt has been sent to you.');
        this.isResponding = false;
        this.loadData();
      },
      error: (err) => {
        console.error('Failed to accept invitation', err);
        alert('Failed to accept invitation. Please try again.');
        this.isResponding = false;
      }
    });
  }

  declineInvitation(sponsorship: any) {
    const reason = prompt('Please enter a reason for declining (optional):');
    
    if (!confirm('Are you sure you want to decline this sponsorship invitation?')) {
      return;
    }

    this.isResponding = true;
    const params = reason ? `?reason=${encodeURIComponent(reason)}` : '';
    
    this.http.post<any>(`${this.apiUrl}/sponsorships/${sponsorship.id}/decline${params}`, {}).subscribe({
      next: (res) => {
        alert('Sponsorship declined. A notification has been sent.');
        this.isResponding = false;
        this.loadData();
      },
      error: (err) => {
        console.error('Failed to decline invitation', err);
        alert('Failed to decline invitation. Please try again.');
        this.isResponding = false;
      }
    });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-700';
      case 'ACCEPTED': return 'bg-green-100 text-green-700';
      case 'DECLINED': return 'bg-red-100 text-red-700';
      case 'APPROVED': return 'bg-blue-100 text-blue-700';
      case 'PAID': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  }

  formatCurrency(amount: number, currency: string): string {
    return `${amount.toLocaleString()} ${currency}`;
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }
}
