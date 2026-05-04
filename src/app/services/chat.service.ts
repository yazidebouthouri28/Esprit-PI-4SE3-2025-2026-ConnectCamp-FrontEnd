import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class ChatService {

  constructor(private http: HttpClient) {}

  // ── Chat Rooms ──────────────────────────────────────────────────────────
  getMyRooms(userId: number): Observable<any[]> {
    return this.http.get<any>(`/api/chat-rooms/user/${userId}`)
      .pipe(map(r => r.data?.content || r.data || []));
  }

  getRoom(roomId: number): Observable<any> {
    return this.http.get<any>(`/api/chat-rooms/${roomId}`)
      .pipe(map(r => r.data));
  }

  createRoom(creatorId: number, data: any): Observable<any> {
    return this.http.post<any>(`/api/chat-rooms?creatorId=${creatorId}`, data)
      .pipe(map(r => r.data));
  }

  updateRoom(roomId: number, userId: number, data: any): Observable<any> {
    return this.http.put<any>(`/api/chat-rooms/${roomId}?userId=${userId}`, data)
      .pipe(map(r => r.data));
  }

  deleteRoom(roomId: number, userId: number): Observable<any> {
    return this.http.delete<any>(`/api/chat-rooms/${roomId}?userId=${userId}`);
  }

  // ── Messages ────────────────────────────────────────────────────────────
  getMessages(roomId: number): Observable<any[]> {
    return this.http.get<any>(`/api/messages/room/${roomId}/history`)
      .pipe(map(r => r.data || []));
  }

  sendMessage(roomId: number, senderId: number, content: string): Observable<any> {
    return this.http.post<any>(`/api/messages`, {
      chatRoomId: roomId,
      senderId: senderId,
      content: content,
      messageType: 'TEXT'
    }).pipe(map(r => r.data));
  }
}