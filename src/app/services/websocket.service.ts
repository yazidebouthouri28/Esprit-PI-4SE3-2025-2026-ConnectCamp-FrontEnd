import { Injectable } from '@angular/core';
import { Client, Message } from '@stomp/stompjs';
import { Subject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  private client: Client;
  private messageSubject = new Subject<any>();
  
  constructor() {
    this.client = new Client({
      brokerURL: 'ws://localhost:8089/ws', // Raw WebSocket connection
      debug: (msg: string) => console.log('STOMP: ', msg),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000
    });

    this.client.onConnect = (frame) => {
      console.log('Connected: ' + frame);
    };

    this.client.onStompError = (frame) => {
      console.error('Broker reported error: ' + frame.headers['message']);
      console.error('Additional details: ' + frame.body);
    };
  }

  public connect(): void {
    if (!this.client.active) {
      this.client.activate();
    }
  }

  public disconnect(): void {
    if (this.client.active) {
      this.client.deactivate();
    }
  }

  public subscribeToRoom(roomId: number): Observable<any> {
    const defaultSubject = new Subject<any>();
    
    // We only subscribe when connected
    if (this.client.connected) {
      this.client.subscribe(`/topic/room/${roomId}`, (message: Message) => {
        defaultSubject.next(JSON.parse(message.body));
      });
    } else {
      // If not yet connected, we wait for connect to fire
      this.client.onConnect = (frame) => {
        console.log('Connected: ' + frame);
        this.client.subscribe(`/topic/room/${roomId}`, (message: Message) => {
          defaultSubject.next(JSON.parse(message.body));
        });
      };
    }
    
    return defaultSubject.asObservable();
  }

  public sendMessage(roomId: number, requestDetails: any): void {
    this.client.publish({
      destination: `/app/chat.sendToRoom`,
      body: JSON.stringify(requestDetails)
    });
  }

  public sendReaction(reactionDetails: any): void {
    this.client.publish({
      destination: `/app/chat.react`,
      body: JSON.stringify(reactionDetails)
    });
  }
}
