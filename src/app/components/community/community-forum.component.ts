import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { ChatService } from '../../services/chat.service';
import { WebsocketService } from '../../services/websocket.service';
import { Subscription } from 'rxjs';
import { environment } from '../../../environments/environment';

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

  // New features
  chatStats: any[] = [];
  keywordFilter: string = '';
  showLogsModal = false;
  schedulerLogs: any[] = [];
  
  // Add Member feature
  showAddMemberModal = false;
  userSearchKeyword = '';
  foundUsers: any[] = [];
  isSearchingUsers = false;
  isAddingMember = false;
  
  private currentRoomSub?: Subscription;

  // Reaction Emojis
  availableEmojis = ['👍', '❤️', '😂', '🔥', '🎉'];

  // Room Sentiment
  roomSentiment: any = null;

  // ML-Driven Smart Suggestions
  showSuggestionsModal = false;
  isLoadingSuggestions = false;
  smartSuggestions: any = null;
  activeSuggestionTab: 'high' | 'medium' | 'low' = 'high';

  // Computed property for rooms created by current user
  get myRooms(): any[] {
    return this.rooms.filter(room => this.isRoomCreator(room));
  }

  // Computed property for chat stats filtered by rooms created by current user
  get myChatStats(): any[] {
    return this.chatStats.filter(stat => this.isRoomCreator({ creatorId: stat.creatorId }));
  }

  constructor(
    private authService: AuthService,
    private chatService: ChatService,
    private router: Router,
    private http: HttpClient,
    private websocketService: WebsocketService
  ) {}

  ngOnInit() {
    const user = this.authService.getCurrentUser();
    if (!user) { this.router.navigate(['/auth/login']); return; }
    this.currentUser = user;
    this.isOrganizer = user.role === 'ORGANIZER' || user.role === 'ADMIN';
    console.log('[CommunityForum] User:', user.name, 'Role:', user.role, 'isOrganizer:', this.isOrganizer);
    this.loadRooms();
    this.loadChatStats();
    this.websocketService.connect();
  }

  ngOnDestroy() {
    this.currentRoomSub?.unsubscribe();
    this.websocketService.disconnect();
  }

  loadChatStats(): void {
    const userId = this.currentUser?.id;
    const url = userId 
      ? `${environment.apiUrl}/api/chat-rooms/room-info?userId=${userId}`
      : `${environment.apiUrl}/api/chat-rooms/room-info`;
    
    this.http.get<any>(url).subscribe({
      next: (res) => {
        this.chatStats = res.data || [];
        // Load sentiment for each stat
        this.chatStats.forEach(stat => this.loadSentimentForStat(stat));
      },
      error: (err) => console.error(err)
    });
  }

  loadSentimentForStat(stat: any): void {
    const roomId = stat.roomId || stat.id;
    if (!roomId) {
      console.warn('Stat object missing roomId/id:', stat);
      return;
    }
    this.chatService.getRoomSentiment(roomId).subscribe({
      next: (stats) => {
        stat.sentimentLabel = stats.overallLabel;
        stat.sentimentScore = stats.averageScore;
      },
      error: (err) => {
        console.error(`Failed to load sentiment for stat room ${roomId}`, err);
      }
    });
  }

  isRoomInChatStats(roomId: number): boolean {
    return this.chatStats.some(stat => (stat.roomId || stat.id) === roomId);
  }

  fetchSchedulerLogs(): void {
    this.http.get<any>(`${environment.apiUrl}/api/scheduler-logs`).subscribe({
      next: (res) => this.schedulerLogs = res.content || res,
      error: (err) => console.error(err)
    });
  }

  filterChatsByKeyword(): void {
    if (!this.keywordFilter) {
      this.loadRooms();
      return;
    }
    this.isLoadingRooms = true;
    const url = `${environment.apiUrl}/api/chat-rooms/search/messages-keyword?keyword=${encodeURIComponent(this.keywordFilter)}`;
    this.http.get<any>(url).subscribe({
      next: (res) => {
        this.isLoadingRooms = false;
        this.rooms = res.data || [];
      },
      error: (err) => {
        this.isLoadingRooms = false;
        console.error(err);
      }
    });
  }

  openLogsModal(): void {
    this.showLogsModal = true;
    this.http.get<any>('http://localhost:8089/api/scheduler-logs').subscribe({
      next: (res) => this.schedulerLogs = res.content || res,
      error: (err) => console.error(err)
    });
  }

  closeLogsModal(): void {
    this.showLogsModal = false;
  }

  // ── ML-Driven Smart Suggestions ─────────────────────────────────────────────
  openSuggestionsModal(): void {
    this.showSuggestionsModal = true;
    this.activeSuggestionTab = 'high';
    if (this.activeRoom) {
      this.loadSmartSuggestions(this.activeRoom.id);
    }
  }

  closeSuggestionsModal(): void {
    this.showSuggestionsModal = false;
    this.smartSuggestions = null;
  }

  loadSmartSuggestions(roomId: number): void {
    this.isLoadingSuggestions = true;
    this.chatService.getSmartSuggestions(roomId).subscribe({
      next: (suggestions) => {
        this.smartSuggestions = suggestions;
        this.isLoadingSuggestions = false;
      },
      error: (err) => {
        console.error('Failed to load smart suggestions', err);
        this.isLoadingSuggestions = false;
      }
    });
  }

  getPriorityColor(priority: string): string {
    switch (priority?.toLowerCase()) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  }

  getRiskColor(riskLevel: string): string {
    switch (riskLevel?.toLowerCase()) {
      case 'critical': return 'text-red-700 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-blue-600 bg-blue-100';
      default: return 'text-green-600 bg-green-100';
    }
  }

  getHealthStatusColor(status: string): string {
    switch (status?.toLowerCase()) {
      case 'critical': return 'text-red-600';
      case 'warning': return 'text-yellow-600';
      case 'healthy': return 'text-green-600';
      default: return 'text-gray-600';
    }
  }

  executeSuggestionAction(action: string, suggestion: any): void {
    // Handle suggestion actions
    console.log('Executing action:', action, 'for suggestion:', suggestion);
    
    // You can implement specific actions here
    switch (suggestion.type) {
      case 'BAN_MEMBER':
        // Implement ban member flow
        alert(`Ban member: ${suggestion.targetUserName}`);
        break;
      case 'MUTE_MEMBER':
        // Implement mute member flow
        alert(`Mute member: ${suggestion.targetUserName}`);
        break;
      case 'WARN_MEMBER':
        // Implement warn member flow
        alert(`Warn member: ${suggestion.targetUserName}`);
        break;
      case 'ADD_MODERATOR':
        // Open add moderator modal
        alert('Add moderator flow');
        break;
      case 'ADD_SPONSOR':
        // Navigate to sponsors page
        this.router.navigate(['/admin/sponsors']);
        break;
      default:
        // Generic action
        alert(`Action: ${action}\nSuggestion: ${suggestion.title}`);
    }
  }

  getSuggestionIcon(type: string): string {
    const iconMap: { [key: string]: string } = {
      'BAN_MEMBER': '🚫',
      'MUTE_MEMBER': '🔇',
      'WARN_MEMBER': '⚠️',
      'PROMOTE_MEMBER': '⭐',
      'ADD_MODERATOR': '👥',
      'REMOVE_MODERATOR': '👤',
      'ADD_SPONSOR': '💰',
      'CREATE_PREMIUM_TIER': '👑',
      'HOST_EVENT': '🎉',
      'SENTIMENT_CRISIS': '🚨',
      'SENTIMENT_DECLINING': '📉',
      'HIGH_TOXICITY_DETECTED': '☠️',
      'DELETE_NEGATIVE_THREAD': '🧹',
      'PIN_POSITIVE_MESSAGE': '📌',
      'POST_COMMUNITY_GUIDELINES': '📋',
      'START_POSITIVE_TOPIC': '💡',
      'CELEBRATE_MILESTONE': '🎊',
      'INVITE_MORE_MEMBERS': '📈',
      'REACTIVATE_CHAT': '🔥',
      'ARCHIVE_CHAT': '📦',
      'CLOSE_CHAT': '🔒'
    };
    return iconMap[type] || '💡';
  }

  loadRooms() {
    this.isLoadingRooms = true;
    this.chatService.getMyRooms(Number(this.currentUser.id)).subscribe({
      next: (rooms) => {
        this.rooms = rooms;
        // Load sentiment for each room
        this.rooms.forEach(room => this.loadRoomSentimentForList(room));
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

  loadRoomSentimentForList(room: any): void {
    this.chatService.getRoomSentiment(room.id).subscribe({
      next: (stats) => {
        room.sentimentLabel = stats.overallLabel;
        room.sentimentScore = stats.averageScore;
      },
      error: (err) => {
        console.error(`Failed to load sentiment for room ${room.id}`, err);
      }
    });
  }

  selectRoom(room: any) {
    console.log('Selecting room:', room.name, 'ID:', room.id);
    this.activeRoom = room;
    this.isLoadingMessages = true;
    this.messages = [];
    this.chatService.getMessages(room.id).subscribe({
      next: (msgs) => {
        this.messages = msgs;
        this.isLoadingMessages = false;
        console.log('Loaded messages for room:', room.name, 'Count:', msgs.length);
      },
      error: (err) => {
        console.error('Failed to load messages', err);
        this.isLoadingMessages = false;
      }
    });

    this.currentRoomSub?.unsubscribe();
    this.currentRoomSub = this.websocketService.subscribeToRoom(room.id).subscribe((newMsg) => {
      const idx = this.messages.findIndex(m => m.id === newMsg.id);
      if (idx !== -1) {
        this.messages[idx] = newMsg;
      } else {
        this.messages.push(newMsg);
      }
    });

    // Load room sentiment stats
    this.loadRoomSentiment(room.id);
  }

  loadRoomSentiment(roomId: number): void {
    this.chatService.getRoomSentiment(roomId).subscribe({
      next: (stats) => {
        this.roomSentiment = stats;
      },
      error: (err) => {
        console.error('Failed to load room sentiment', err);
        this.roomSentiment = null;
      }
    });
  }

  sendMessage() {
    if (!this.newMessage.trim() || !this.activeRoom) return;
    const content = this.newMessage;
    this.newMessage = '';
    
    this.websocketService.sendMessage(this.activeRoom.id, {
      content: content,
      senderId: Number(this.currentUser.id),
      chatRoomId: this.activeRoom.id,
      messageType: 'TEXT'
    });
  }

  reactToMessage(msgId: number, emoji: string) {
    this.websocketService.sendReaction({
      messageId: msgId,
      userId: Number(this.currentUser.id),
      emoji: emoji,
      chatRoomId: this.activeRoom.id
    });
  }

  getGroupedReactions(reactions: any[]): any[] {
    if (!reactions) return [];
    const groups: { [emoji: string]: { emoji: string, count: number, userNames: string[] } } = {};
    reactions.forEach(r => {
      if (!groups[r.emoji]) {
        groups[r.emoji] = { emoji: r.emoji, count: 0, userNames: [] };
      }
      groups[r.emoji].count++;
      groups[r.emoji].userNames.push(r.userName);
    });
    return Object.values(groups);
  }

  // ── Member Addition ──────────────────────────────────────────────────────

  openAddMemberModal() {
    this.showAddMemberModal = true;
    this.userSearchKeyword = '';
    this.foundUsers = [];
  }

  closeAddMemberModal() {
    this.showAddMemberModal = false;
  }

  searchUsers() {
    if (!this.userSearchKeyword.trim()) return;
    this.isSearchingUsers = true;
    this.chatService.searchUsers(this.userSearchKeyword).subscribe({
      next: (users) => {
        this.foundUsers = users;
        this.isSearchingUsers = false;
      },
      error: (err) => {
        console.error(err);
        this.isSearchingUsers = false;
      }
    });
  }

  addMemberToRoom(user: any) {
    if (!this.activeRoom || !user) return;
    this.isAddingMember = true;
    this.chatService.addMember(this.activeRoom.id, Number(this.currentUser.id), Number(user.id)).subscribe({
      next: () => {
        this.isAddingMember = false;
        alert(`${user.name} added to the group!`);
        this.activeRoom.memberCount++;
        this.closeAddMemberModal();
      },
      error: (err) => {
        console.error(err);
        this.isAddingMember = false;
        alert('Failed to add member. Maybe they are already in the group?');
      }
    });
  }

  isCurrentUser(senderId: any): boolean {
    return String(senderId) === String(this.currentUser?.id);
  }

  isCreator(): boolean {
    return this.activeRoom && String(this.activeRoom.creatorId) === String(this.currentUser?.id);
  }

  isRoomCreator(room: any): boolean {
    return room && String(room.creatorId) === String(this.currentUser?.id);
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

  // ── Sentiment badge helpers ────────────────────────────────────────────────
  getSentimentClass(label: string | undefined): string {
    if (!label) return 'bg-gray-100 text-gray-600';
    switch (label.toLowerCase()) {
      case 'very positive':
      case 'positive':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'neutral':
        return 'bg-gray-100 text-gray-600 border-gray-200';
      case 'negative':
      case 'very negative':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  }

  getSentimentIcon(label: string | undefined): string {
    if (!label) return '−';
    switch (label.toLowerCase()) {
      case 'very positive':
        return '++';
      case 'positive':
        return '+';
      case 'neutral':
        return '−';
      case 'negative':
        return '−−';
      case 'very negative':
        return '−−−';
      default:
        return '−';
    }
  }
}