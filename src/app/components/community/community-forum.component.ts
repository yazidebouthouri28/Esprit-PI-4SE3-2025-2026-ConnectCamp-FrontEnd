import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ChatService } from '../../services/chat.service';

@Component({
  selector: 'app-community-forum',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './community-forum.component.html',
  styleUrls: ['./community-forum.component.css']
})
export class CommunityForumComponent implements OnInit {

  currentUser: any = null;
  isOrganizer = false;

  rooms: any[] = [];
  activeRoom: any = null;
  messages: any[] = [];
  newMessage = '';
  isLoadingMessages = false;
  isLoadingRooms = true;

  // Create/Edit modal
  showRoomModal = false;
  isEditMode = false;
  roomForm: any = { name: '', description: '', image: '', type: 'GROUP', isPublic: true, maxMembers: 100 };
  isSavingRoom = false;

  // Delete confirm
  showDeleteConfirm = false;

  roomTypes = ['GROUP', 'EVENT', 'CAMPSITE', 'PRIVATE'];

  constructor(
    private authService: AuthService,
    private chatService: ChatService,
    private router: Router
  ) {}

  ngOnInit() {
    const user = this.authService.getCurrentUser();
    if (!user) { this.router.navigate(['/auth/login']); return; }
    this.currentUser = user;
    this.isOrganizer = user.role === 'ORGANIZER' || user.role === 'ADMIN';
    this.loadRooms();
  }

  loadRooms() {
    this.isLoadingRooms = true;
    this.chatService.getMyRooms(Number(this.currentUser.id)).subscribe({
      next: (rooms) => {
        this.rooms = rooms;
        this.isLoadingRooms = false;
        if (rooms.length > 0 && !this.activeRoom) {
          this.selectRoom(rooms[0]);
        }
      },
      error: (err) => {
        console.error('Failed to load rooms', err);
        this.isLoadingRooms = false;
      }
    });
  }

  selectRoom(room: any) {
    this.activeRoom = room;
    this.isLoadingMessages = true;
    this.messages = [];
    this.chatService.getMessages(room.id).subscribe({
      next: (msgs) => {
        this.messages = msgs;
        this.isLoadingMessages = false;
      },
      error: (err) => {
        console.error('Failed to load messages', err);
        this.isLoadingMessages = false;
      }
    });
  }

  sendMessage() {
    if (!this.newMessage.trim() || !this.activeRoom) return;
    const content = this.newMessage;
    this.newMessage = '';
    this.chatService.sendMessage(this.activeRoom.id, Number(this.currentUser.id), content).subscribe({
      next: (msg) => this.messages.push(msg),
      error: (err) => {
        console.error('Failed to send message', err);
        this.newMessage = content; // restore on failure
      }
    });
  }

  isCurrentUser(senderId: any): boolean {
    return String(senderId) === String(this.currentUser?.id);
  }

  isCreator(): boolean {
    return this.activeRoom && String(this.activeRoom.creatorId) === String(this.currentUser?.id);
  }

  // ── Room CRUD (Organizer only) ────────────────────────────────────────────

  openCreateModal() {
    this.isEditMode = false;
    this.roomForm = { name: '', description: '', image: '', type: 'GROUP', isPublic: true, maxMembers: 100 };
    this.showRoomModal = true;
  }

  openEditModal() {
    if (!this.activeRoom) return;
    this.isEditMode = true;
    this.roomForm = {
      name: this.activeRoom.name,
      description: this.activeRoom.description,
      image: this.activeRoom.image,
      type: this.activeRoom.type,
      isPublic: this.activeRoom.isPublic,
      maxMembers: this.activeRoom.maxMembers
    };
    this.showRoomModal = true;
  }

  closeRoomModal() {
    this.showRoomModal = false;
  }

  saveRoom() {
    this.isSavingRoom = true;
    if (this.isEditMode) {
      this.chatService.updateRoom(this.activeRoom.id, Number(this.currentUser.id), this.roomForm).subscribe({
        next: (updated) => {
          const idx = this.rooms.findIndex(r => r.id === updated.id);
          if (idx !== -1) this.rooms[idx] = updated;
          this.activeRoom = updated;
          this.isSavingRoom = false;
          this.closeRoomModal();
        },
        error: (err) => { console.error(err); this.isSavingRoom = false; }
      });
    } else {
      this.chatService.createRoom(Number(this.currentUser.id), this.roomForm).subscribe({
        next: (room) => {
          this.rooms.unshift(room);
          this.selectRoom(room);
          this.isSavingRoom = false;
          this.closeRoomModal();
        },
        error: (err) => { console.error(err); this.isSavingRoom = false; }
      });
    }
  }

  openDeleteConfirm() {
    this.showDeleteConfirm = true;
  }

  cancelDelete() {
    this.showDeleteConfirm = false;
  }

  deleteRoom() {
    if (!this.activeRoom) return;
    this.chatService.deleteRoom(this.activeRoom.id, Number(this.currentUser.id)).subscribe({
      next: () => {
        this.rooms = this.rooms.filter(r => r.id !== this.activeRoom.id);
        this.activeRoom = this.rooms.length > 0 ? this.rooms[0] : null;
        if (this.activeRoom) this.selectRoom(this.activeRoom);
        else this.messages = [];
        this.showDeleteConfirm = false;
      },
      error: (err) => console.error(err)
    });
  }

  formatTime(sentAt: string): string {
    if (!sentAt) return '';
    return new Date(sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  getAvatar(name: string): string {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&size=100`;
  }

  viewProfile(userId: any) {
    this.router.navigate(['/profile', userId]);
  }
}