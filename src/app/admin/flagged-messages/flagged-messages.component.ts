import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../services/chat.service';

interface FlaggedMessage {
  id: number;
  content: string;
  sentimentScore: number;
  sentimentLabel: string;
  senderName: string;
  senderId: number;
  chatRoomId: number;
  sentAt: string;
}

@Component({
  selector: 'app-flagged-messages',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './flagged-messages.component.html',
  styleUrls: ['./flagged-messages.component.css']
})
export class FlaggedMessagesComponent implements OnInit {
  flaggedMessages: FlaggedMessage[] = [];
  isLoading = false;
  errorMessage = '';
  searchTerm = '';

  constructor(private chatService: ChatService) {}

  ngOnInit(): void {
    this.loadFlaggedMessages();
  }

  loadFlaggedMessages(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.chatService.getFlaggedMessages().subscribe({
      next: (messages) => {
        this.flaggedMessages = messages.map((m: any) => ({
          id: m.id,
          content: m.content,
          sentimentScore: m.sentimentScore,
          sentimentLabel: m.sentimentLabel,
          senderName: m.senderName || 'Unknown',
          senderId: m.senderId,
          chatRoomId: m.chatRoomId,
          sentAt: m.sentAt
        }));
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = 'Failed to load flagged messages. Please try again.';
        console.error('Error loading flagged messages:', err);
      }
    });
  }

  get filteredMessages(): FlaggedMessage[] {
    if (!this.searchTerm) return this.flaggedMessages;
    const term = this.searchTerm.toLowerCase();
    return this.flaggedMessages.filter(m =>
      m.content.toLowerCase().includes(term) ||
      m.senderName.toLowerCase().includes(term)
    );
  }

  get negativeCount(): number {
    return this.flaggedMessages.filter(m => m.sentimentLabel === 'negative').length;
  }

  get veryNegativeCount(): number {
    return this.flaggedMessages.filter(m => m.sentimentLabel === 'very negative').length;
  }

  getSenderInitial(name: string): string {
    return name ? name.charAt(0).toUpperCase() : '?';
  }

  getSentimentClass(label: string): string {
    switch (label?.toLowerCase()) {
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

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString();
  }

  deleteMessage(messageId: number): void {
    if (!confirm('Are you sure you want to delete this message?')) return;

    // In a real implementation, you would call a delete service method here
    this.flaggedMessages = this.flaggedMessages.filter(m => m.id !== messageId);
  }

  refresh(): void {
    this.loadFlaggedMessages();
  }
}
