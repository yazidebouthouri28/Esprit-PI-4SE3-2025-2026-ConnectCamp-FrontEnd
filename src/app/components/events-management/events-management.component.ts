import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { EventServiceEntityService } from '../../services/event-service-entity.service';
import { environment } from '../../../environments/environment';
import { EventDetailComponent, Event } from '../event-detail/event-detail.component';

@Component({
  selector: 'app-events-management',
  standalone: true,
  imports: [CommonModule, EventDetailComponent, FormsModule],
  templateUrl: './events-management.component.html',
  styleUrls: ['./events-management.component.css'],
})
export class EventsManagementComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  public authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  private assignmentService = inject(EventServiceEntityService);
  private apiUrl = environment.apiUrl;

  selectedEvent: Event | null = null;
  events: Event[] = [];
  recommendedEvents: Event[] = [];
  myEvents: Event[] = [];
  recommendedServices: any[] = [];
  recommendedPacks: any[] = [];
  recsLoading: boolean = false;
  selectedCategory: string = 'all';

  isCreateModalOpen: boolean = false;
  isUploading: boolean = false;
  isEditing: boolean = false;
  editingEventId: number | null = null;

  eventForm = {
    name: '',
    description: '',
    eventType: 'WORKSHOP',
    category: 'Nature',
    location: '',
    endDate: '',
    maxParticipants: 50,
    price: 0,
    picture: '',
    images: [] as string[]
  };

  categories = ['Nature', 'Survival', 'Music', 'Culture', 'Sports', 'Education', 'Adventure'];
  eventTypes = ['WORKSHOP', 'TRIP', 'FESTIVAL', 'CAMPING', 'HIKING', 'OTHER'];

  private mockEvents: Event[] = [
    {
      id: 101,
      title: 'Zaghouan Mountain Trekking',
      type: 'trip',
      date: '15 Mars 2026',
      time: '08:00',
      location: 'Djebel Zaghouan, Tunisia',
      image: 'https://images.unsplash.com/photo-1501555088652-021faa106b9b?q=80&w=1080',
      participants: 12,
      maxParticipants: 20,
      price: 45,
      organizer: 'Mountain Pro',
      description: 'Une randonnée guidée spectaculaire vers le sommet de Zaghouan.'
    },
    {
      id: 102,
      title: 'Kroumirie Forest Workshop',
      type: 'workshop',
      date: '22 Mars 2026',
      time: '10:00',
      location: 'Ain Draham Forest, Tunisia',
      image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=1080',
      participants: 8,
      maxParticipants: 15,
      price: 30,
      organizer: 'Nature Academy',
      description: 'Apprenez les techniques de survie et la flore locale.'
    },
    {
      id: 103,
      title: 'Sahara Star Gazing Festival',
      type: 'festival',
      date: '05 Avril 2026',
      time: '19:00',
      location: 'Douz Desert, Tunisia',
      image: 'https://images.unsplash.com/photo-1541410965313-d53b3c16ef17?q=80&w=1080',
      participants: 85,
      maxParticipants: 200,
      price: 120,
      organizer: 'Desert Vibes',
      description: 'Une nuit magique sous les étoiles avec musique et culture nomade.'
    }
  ];

  ngOnInit() {
    this.fetchEvents();
  }

  fetchEvents() {
    this.http.get<any>(`${this.apiUrl}/api/events`).subscribe({
      next: (res) => {
        const data = res.data || res;
        if (Array.isArray(data) && data.length > 0) {
          // Filter only PUBLISHED events for the public page
          const publishedEvents = data.filter((e: any) => e.status === 'PUBLISHED');

          if (publishedEvents.length > 0) {
            this.events = this.mapEvents(publishedEvents);
            this.recommendedEvents = this.events.slice(0, 2);

            const user = this.authService.getCurrentUser();
            if (user && user.role === 'ORGANIZER') {
              this.myEvents = this.events.filter(e => e.organizerUserId === Number(user.id));
            } else {
              this.myEvents = [];
            }
          } else {
            this.useMockData();
          }
        } else {
          // Fallback to mock if API returns empty
          this.useMockData();
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to fetch events, using mock data', err);
        this.useMockData();
        this.cdr.detectChanges();
      }
    });
  }

  filterEvents(category: string) {
    this.selectedCategory = category;
  }

  getFilteredEvents(): Event[] {
    if (this.selectedCategory === 'all') return this.events;
    if (this.selectedCategory === 'my') return this.myEvents;
    return this.events.filter(e => e.type === this.selectedCategory);
  }

  private useMockData() {
    this.events = [...this.mockEvents];
    this.recommendedEvents = this.events.slice(0, 2);
    this.myEvents = [];
    this.cdr.detectChanges();
  }

  resolveImageUrl(path: string | null): string {
    if (!path) return 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?q=80&w=1080';
    if (path.startsWith('http')) return path;
    return `${this.apiUrl}/uploads/${path}`;
  }

  private mapEvents(data: any[]): Event[] {
    return data.map(e => ({
      id: e.id,
      title: e.name,
      type: (e.eventType?.toLowerCase() || 'workshop') as any,
      rawEndDate: e.endDate,
      date: e.endDate ? new Date(e.endDate).toLocaleDateString() : 'TBD',
      time: e.endDate ? new Date(e.endDate).toLocaleTimeString() : 'TBD',
      location: e.location,
      image: this.resolveImageUrl(e.picture),
      images: e.images ? e.images.map((img: string) => this.resolveImageUrl(img)) : [],
      participants: e.currentParticipants || 0,
      maxParticipants: e.maxParticipants || 100,
      price: e.price,
      organizer: e.organizerName || 'Organizer',
      organizerUserId: e.organizerUserId,
      likesCount: e.likesCount,
      dislikesCount: e.dislikesCount,
      description: e.description
    }));
  }

  eventTypeClass(type: string): string {
    const map: Record<string, string> = {
      workshop: 'bg-blue-100 text-blue-700',
      trip: 'bg-green-100 text-green-700',
      festival: 'bg-purple-100 text-purple-700',
    };
    return map[type] ?? '';
  }

  progressPercent(e: Event): number {
    return (e.participants / e.maxParticipants) * 100;
  }

  selectEvent(event: Event) {
    this.selectedEvent = event;
    this.fetchRecommendations(event.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  fetchRecommendations(eventId: number) {
    this.recsLoading = true;
    this.recommendedServices = [];
    this.recommendedPacks = [];
    
    // Fetch smart recommendations from the orchestrator
    this.assignmentService.getRecommendedServices(eventId).subscribe({
      next: (res) => {
        this.recommendedServices = res.data || [];
        this.recsLoading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.recsLoading = false; }
    });

    this.assignmentService.getRecommendedPacks(eventId).subscribe({
      next: (res) => {
        this.recommendedPacks = res.data || [];
        this.cdr.detectChanges();
      }
    });
  }

  clearSelection() {
    this.selectedEvent = null;
  }

  get isOrganizer(): boolean {
    return this.authService.isOrganizer();
  }

  get currentUserId(): number | null {
    const user = this.authService.getCurrentUser();
    return user ? Number(user.id) : null;
  }

  createEvent() {
    this.isEditing = false;
    this.editingEventId = null;
    this.resetForm();
    this.isCreateModalOpen = true;
    this.cdr.detectChanges();
  }

  // -1 => main picture, 0..n => gallery images
  currentUploadSlot: number | null = null;
  private uploadFromDetailContext = false;

  prepareMainUpload() {
    this.currentUploadSlot = -1;
  }

  handleGalleryUpload(slotIndex: number) {
    this.currentUploadSlot = slotIndex;
    this.uploadFromDetailContext = !!this.selectedEvent && !this.isCreateModalOpen;

    // In detail view there is no visible "Save Changes" button.
    // Preload edit context so uploaded images can be persisted immediately.
    if (this.uploadFromDetailContext && this.selectedEvent) {
      this.isEditing = true;
      this.editingEventId = this.selectedEvent.id;
      this.fillFormFromEvent(this.selectedEvent);
    }

    const fileInput = document.getElementById('galleryFileInput') as HTMLInputElement;
    if (fileInput) fileInput.click();
  }

  closeCreateModal() {
    this.isCreateModalOpen = false;
  }

  resetForm() {
    this.eventForm = {
      name: '',
      description: '',
      eventType: 'WORKSHOP',
      category: 'Nature',
      location: '',
      endDate: '',
      maxParticipants: 50,
      price: 0,
      picture: '',
      images: []
    };
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      this.isUploading = true;
      const formData = new FormData();
      formData.append('file', file);

      this.http.post<any>(`${this.apiUrl}/api/files/upload`, formData).subscribe({
        next: (res) => {
          const fileName = res.data.fileName;
          if (this.currentUploadSlot === null || this.currentUploadSlot === -1) {
            this.eventForm.picture = fileName;
            if (this.selectedEvent) {
              this.selectedEvent.image = this.resolveImageUrl(fileName);
            }
          } else {
            if (!this.eventForm.images) this.eventForm.images = [];
            // Ensure array is large enough
            while (this.eventForm.images.length <= this.currentUploadSlot) {
              this.eventForm.images.push('');
            }
            this.eventForm.images[this.currentUploadSlot] = fileName;

            if (this.selectedEvent) {
              if (!this.selectedEvent.images) {
                this.selectedEvent.images = [];
              }
              while (this.selectedEvent.images.length <= this.currentUploadSlot) {
                this.selectedEvent.images.push('');
              }
              this.selectedEvent.images[this.currentUploadSlot] = this.resolveImageUrl(fileName);
            }
          }
          this.isUploading = false;
          this.currentUploadSlot = null;
          this.cdr.detectChanges();

          // If upload was triggered from detail view, persist immediately.
          if (this.uploadFromDetailContext && this.isEditing && this.editingEventId) {
            this.saveEvent(true);
          }
          this.uploadFromDetailContext = false;
        },
        error: (err) => {
          console.error('Upload failed', err);
          this.isUploading = false;
          this.currentUploadSlot = null;
          alert('Failed to upload image');
          this.uploadFromDetailContext = false;
        }
      });
    }
  }

  saveEvent(silent = false) {
    const user = this.authService.getCurrentUser();
    if (!user) return;

    if (!user.organizerId) {
      alert('Your organizer profile is being initialized. Please log out and log back in to continue.');
      return;
    }

    const request = {
      ...this.eventForm,
      images: (this.eventForm.images || []).filter((img) => !!img && img.trim().length > 0),
      organizerId: Number(user.organizerId),
      status: 'PUBLISHED' // Defaulting to published for immediate visibility
    };

    if (this.isEditing && this.editingEventId) {
      this.http.put(`${this.apiUrl}/api/events/${this.editingEventId}`, request).subscribe({
        next: () => {
          if (!silent) this.closeCreateModal();
          this.fetchEvents();
          if (!silent) {
            alert('Event updated successfully!');
          }
        },
        error: (err) => {
          console.error('Failed to update event', err);
          const details = err?.error?.errors
            ? JSON.stringify(err.error.errors)
            : (err.error?.message || err.message || 'Unknown error');
          alert('Failed to update event: ' + details);
        }
      });
    } else {
      this.http.post(`${this.apiUrl}/api/events`, request).subscribe({
        next: () => {
          this.closeCreateModal();
          this.fetchEvents();
          alert('Event created successfully!');
        },
        error: (err) => {
          console.error('Failed to create event', err);
          alert('Failed to create event: ' + (err.error?.message || 'Unknown error'));
        }
      });
    }
  }


  canManage(event: Event): boolean {
    const user = this.authService.getCurrentUser();
    if (!user || user.role !== 'ORGANIZER' || !event) return false;
    return Number(user.id) === event.organizerUserId;
  }

  editEvent(event: Event) {
    this.isEditing = true;
    this.editingEventId = event.id;
    this.fillFormFromEvent(event);

    this.isCreateModalOpen = true;
    this.cdr.detectChanges();
  }

  private fillFormFromEvent(event: Event) {
    this.eventForm = {
      name: event.title,
      description: event.description || '',
      eventType: event.type.toUpperCase(),
      category: 'Nature',
      location: event.location || '',
      endDate: event.rawEndDate ? this.formatDateForInput(event.rawEndDate) : this.formatDateForInput(event.date),
      maxParticipants: event.maxParticipants || 50,
      price: event.price || 0,
      picture: event.image ? (event.image.split('/').pop() || '') : '',
      images: event.images ? event.images.map((img) => img.split('/').pop() || '') : []
    };
  }

  private formatDateForInput(dateStr: string): string {
    if (!dateStr || dateStr === 'TBD') return '';

    // If it's already in the correct format YYYY-MM-DDTHH:mm
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(dateStr)) return dateStr;

    try {
      // Handle the case where the date is in a locale string format or other
      // Attempt to parse it
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '';

      const pad = (n: number) => n.toString().padStart(2, '0');
      const year = d.getFullYear();
      const month = pad(d.getMonth() + 1);
      const day = pad(d.getDate());
      const hours = pad(d.getHours());
      const minutes = pad(d.getMinutes());

      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch (e) {
      return '';
    }
  }

  deleteEvent(eventId: number) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) {
      this.http.delete(`${this.apiUrl}/api/events/${eventId}`).subscribe({
        next: () => {
          this.fetchEvents(); // Refresh list
        },
        error: (err) => {
          console.error('Delete failed:', err);
          alert('Erreur lors de la suppression.');
        }
      });
    }
  }
}