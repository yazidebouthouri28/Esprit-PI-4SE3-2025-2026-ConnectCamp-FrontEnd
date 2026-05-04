import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { UserService, User } from '../../services/user.service';

interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
  type: 'text' | 'image' | 'file';
  imageUrls?: string[];
}

interface ChatGroup {
  id: string;
  name: string;
  description: string;
  avatar: string;
  membersCount: number;
  members: User[];
  messages: Message[];
  mediaCount: {
    docs: number;
    photos: number;
    music: number;
    video: number;
  };
}

@Component({
  selector: 'app-community-forum',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './community-forum.component.html',
  styleUrls: ['./community-forum.component.css']
})
export class CommunityForumComponent implements OnInit {
  currentUser: User | undefined = {
    id: 'me',
    name: 'Ahmed Ben Salem',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=150',
    role: 'Adventure Guide',
    bio: 'Professional guide with 10 years of experience in the Tunisian mountains.',
    coverImage: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800',
    location: 'Hammamet, Tunisia',
    hashtags: ['#Hiking', '#Guide'],
    followers: '1.2K',
    gallery: [
      'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?q=80&w=200',
      'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?q=80&w=200',
      'https://images.unsplash.com/photo-1496062031456-07b8f162a322?q=80&w=200'
    ]
  };

  onlineUsers: User[] = [
    {
      id: '1', name: 'Yassine Trabelsi', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150', status: 'online', role: 'Gear Expert',
      bio: 'Gear specialist and outdoor enthusiast. If you need equipment advice for the Sahara, I am your guy!',
      coverImage: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800',
      location: 'Tunis, Tunisia',
      hashtags: ['#Gear', '#Camping'],
      followers: '5k+',
      gallery: [
        'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?q=80&w=200',
        'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?q=80&w=200'
      ],
      achievements: [{ title: 'Peak Conqueror', icon: '🏔️' }, { title: 'First Aid', icon: '🩹' }]
    },
    { id: '2', name: 'Mariem Guezguez', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150', status: 'online', role: 'Survivalist', bio: 'Exploring the wild side of Tunisia.', coverImage: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?q=80&w=800' },
    { id: '3', name: 'Selim Riahi', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=150', status: 'online', role: 'Trail Photographer', bio: 'Capturing nature.', coverImage: 'https://images.unsplash.com/photo-1496062031456-07b8f162a322?q=80&w=800' },
    { id: '4', name: 'Ines Ben Ammar', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=150', status: 'online', role: 'Seasoned Hiker', bio: 'Always on the move.', coverImage: 'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?q=80&w=800' },
    { id: '5', name: 'Sami Karray', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=150', status: 'online', role: 'Backpacker', bio: 'Traveler.', coverImage: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800' },
  ];

  recentChats: any[] = [
    { id: 'g1', name: 'Tunisian Hikers', avatar: 'https://images.unsplash.com/photo-1501555088652-021faa106b9b?q=80&w=150', lastMessage: 'Great spot for camping!', time: '5:23 PM', type: 'group' },
    { id: 'u1', name: 'Yassine Trabelsi', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150', lastMessage: 'Gear list sent.', time: '5:23 PM', unread: 0, type: 'private' },
    { id: 'u2', name: 'Mariem Guezguez', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150', lastMessage: 'Typing...', time: '4:00 PM', type: 'typing' },
    { id: 'u3', name: 'Selim Riahi', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=150', lastMessage: 'See you at the trail!', time: '3:41 PM', unread: 3, type: 'private' },
  ];

  private allGroups: { [key: string]: ChatGroup } = {
    'g1': {
      id: 'g1',
      name: 'Tunisian Hikers',
      description: 'Exploring the North and the South together.',
      avatar: 'https://images.unsplash.com/photo-1501555088652-021faa106b9b?q=80&w=150',
      membersCount: 15,
      members: [
        this.onlineUsers[3], // Ines
        this.onlineUsers[0], // Yassine
        this.onlineUsers[2], // Selim
      ],
      messages: [
        { id: 'm1', senderId: '4', content: 'Anyone knows a good camping spot near Beni M Tir?', timestamp: '09:00 AM', type: 'text' },
        { id: 'm2', senderId: '3', content: "I suggest the forest area near the lake, the view is amazing!", timestamp: '09:45 AM', type: 'text' },
        { id: 'm3', senderId: '3', content: '', timestamp: '09:45 AM', type: 'image', imageUrls: ['https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?q=80&w=300', 'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?q=80&w=300'] },
        { id: 'm4', senderId: '4', content: 'Wow, that looks perfect! I will check it out.', timestamp: '09:48 AM', type: 'text' },
        { id: 'm5', senderId: '3', content: 'Make sure to bring a warm sleeping bag, it gets cold in the mountains.', timestamp: '09:50 AM', type: 'text' },
      ],
      mediaCount: { docs: 12, photos: 85, music: 5, video: 0 }
    },
    'u1': {
      id: 'u1',
      name: 'Yassine Trabelsi',
      description: 'Private message',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150',
      membersCount: 2,
      members: [this.onlineUsers[0]],
      messages: [
        { id: 'pm1', senderId: '1', content: 'Hey! I sent you the gear list for our Douz trip.', timestamp: '10:30 AM', type: 'text' },
        { id: 'pm2', senderId: 'me', content: 'Thanks Yassine! I will check it out tonight.', timestamp: '10:35 AM', type: 'text' },
        { id: 'pm3', senderId: '1', content: 'Great, let me know if you need any adjustments.', timestamp: '10:40 AM', type: 'text' },
      ],
      mediaCount: { docs: 2, photos: 5, music: 0, video: 0 }
    },
    'u3': {
      id: 'u3',
      name: 'Selim Riahi',
      description: 'Private message',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=150',
      membersCount: 2,
      members: [this.onlineUsers[2]],
      messages: [
        { id: 'gm1', senderId: '3', content: 'Those photos from Zaghouan are coming out great!', timestamp: '03:15 PM', type: 'text' },
        { id: 'gm2', senderId: '3', content: 'See you at the trail!', timestamp: '03:41 PM', type: 'text' },
      ],
      mediaCount: { docs: 0, photos: 12, music: 0, video: 0 }
    }
  };

  activeGroup: ChatGroup | undefined = this.allGroups['g1'];
  newMessage: string = '';
  selectedUser: User | null = null;
  isLoading = false;
  errorMessage = '';

  constructor(
    private router: Router,
    private http: HttpClient,
    private authService: AuthService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    console.log('CommunityForumComponent initialized');
    const realUser = this.userService.getCurrentUser();
    if (realUser && realUser.id && realUser.id !== 'me') {
      this.currentUser = realUser;
    }
    if (!this.activeGroup) {
      this.activeGroup = this.allGroups['g1'];
    }
    if (this.currentUser && this.currentUser.id !== 'me') {
      this.loadChatRooms();
    }
  }

  // For debugging – you can remove later
  testApi() {
    console.log('Test API button clicked');
    this.http.get(`/api/chat-rooms/user/${this.currentUser?.id}`)
      .subscribe({
        next: (data) => console.log('API response:', data),
        error: (err) => console.error('API error:', err)
      });
  }

  private loadChatRooms(): void {
    if (!this.currentUser || this.currentUser.id === 'me') return;
    this.isLoading = true;
    this.http.get<any>(`/api/chat-rooms/user/${this.currentUser.id}`)
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          if (response.success && response.data?.content) {
            const rooms = response.data.content;
            this.recentChats = rooms.map((room: any) => ({
              id: room.id,
              name: room.name,
              avatar: room.avatar || this.getDefaultAvatar(room.name),
              lastMessage: room.lastMessage || '',
              time: this.formatTime(room.lastMessageAt),
              type: room.type === 'GROUP' ? 'group' : 'private',
              unread: room.unreadCount || 0,
              description: room.description,
              membersCount: room.memberCount
            }));
            if (this.recentChats.length > 0 && this.recentChats[0].type === 'group') {
              this.switchChat(this.recentChats[0]);
            }
          } else {
            console.warn('No chat rooms from API, using mock');
          }
        },
        error: (err) => {
          this.isLoading = false;
          console.error('Failed to load rooms', err);
          this.errorMessage = 'Could not load chat rooms. Using mock data.';
        }
      });
  }

  private loadOnlineUsers(): void {
    // optional: implement if you have an endpoint
  }

  switchChat(chat: any): void {
    if (!chat) return;
    this.isLoading = true;
    this.http.get<any>(`/api/chat-rooms/${chat.id}`)
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          if (response.success && response.data) {
            const room = response.data;
            this.activeGroup = {
              id: room.id,
              name: room.name,
              description: room.description || '',
              avatar: room.avatar || this.getDefaultAvatar(room.name),
              membersCount: room.memberCount,
              members: room.members || [],
              messages: room.messages ? room.messages.map((m: any) => ({
                id: m.id,
                senderId: m.senderId,
                content: m.content,
                timestamp: this.formatTime(m.createdAt),
                type: m.type || 'text',
                imageUrls: m.imageUrls
              })) : [],
              mediaCount: { docs: 0, photos: 0, music: 0, video: 0 }
            };
          } else {
            this.fallbackToMockGroup(chat);
          }
        },
        error: () => {
          this.isLoading = false;
          this.fallbackToMockGroup(chat);
        }
      });
    this.selectedUser = null;
  }

  private fallbackToMockGroup(chat: any): void {
    if (this.allGroups[chat.id]) {
      this.activeGroup = this.allGroups[chat.id];
    } else {
      this.activeGroup = {
        id: chat.id,
        name: chat.name,
        description: chat.description || 'Private chat',
        avatar: chat.avatar || this.getDefaultAvatar(chat.name),
        membersCount: 2,
        members: [{ id: chat.id, name: chat.name, avatar: chat.avatar || this.getDefaultAvatar(chat.name), role: 'Explorer' }],
        messages: [{ id: 'init', senderId: chat.id, content: 'Hello!', timestamp: 'Just now', type: 'text' }],
        mediaCount: { docs: 0, photos: 0, music: 0, video: 0 }
      };
    }
  }

  createGroup(name: string, description: string, isPublic: boolean = true): void {
    if (!name) return;
    this.isLoading = true;
    const payload = { name, description, isPublic };
    // Note: backend expects creatorId as a query parameter. We'll send it.
    this.http.post<any>(`/api/chat-rooms?creatorId=${this.currentUser?.id}`, payload)
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          if (response.success) {
            const newRoom = response.data;
            this.loadChatRooms(); // refresh list
            this.switchChat({ id: newRoom.id });
          } else {
            this.errorMessage = 'Failed to create group.';
          }
        },
        error: (err) => {
          this.isLoading = false;
          console.error('Create group error', err);
          this.errorMessage = err.error?.message || 'Could not create group.';
        }
      });
  }

  sendMessage(): void {
    if (!this.newMessage.trim() || !this.activeGroup) return;
    const msg: Message = {
      id: Date.now().toString(),
      senderId: 'me',
      content: this.newMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'text'
    };
    this.activeGroup.messages.push(msg);
    this.newMessage = '';
    // TODO: POST message to backend
  }

  viewProfile(user: User | undefined): void {
    if (user && user.id) {
      this.router.navigate(['/profile', user.id]);
    }
  }

  isCurrentUser(senderId: string): boolean {
    if (!this.currentUser) return false;
    return senderId === 'me' || senderId === this.currentUser.id;
  }

  getSender(senderId: string): User | undefined {
    if (this.isCurrentUser(senderId)) return this.currentUser;
    return this.onlineUsers.find(u => u.id === senderId) ||
           this.activeGroup?.members?.find(u => u.id === senderId);
  }

  private formatTime(timestamp: string): string {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  private getDefaultAvatar(name: string): string {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;
  }
}