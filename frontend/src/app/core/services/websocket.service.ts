import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';

interface Message {
  id: string;
  content: string;
  roomId: string;
  userId: string;
  username: string;
  createdAt: string;
  updatedAt: string;
}

function mapMessage(msg: any): Message {
  return {
    id: msg._id || msg.id,
    content: msg.content,
    roomId: typeof msg.roomId === 'string' ? msg.roomId : (msg.roomId?._id || msg.roomId?.toString?.() || String(msg.roomId)),
    userId: msg.senderId || msg.userId,
    username: msg.senderUsername || msg.username,
    createdAt: msg.createdAt,
    updatedAt: msg.updatedAt,
  };
}

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private socket: Socket | null = null;
  private messageSubject = new BehaviorSubject<Message | null>(null);
  message$ = this.messageSubject.asObservable();

  // Separate stream for deleted messages (emits the deleted messageId)
  private messageDeletedSubject = new BehaviorSubject<string | null>(null);
  messageDeleted$ = this.messageDeletedSubject.asObservable();

  connect(token: string): void {
    if (!this.socket) {
      this.socket = io(environment.wsUrl, {
        auth: {
          token
        }
      });

      this.setupEventListeners();
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinRoom(roomId: string): void {
    if (this.socket) {
      this.socket.emit('join_room', { roomId });
    }
  }

  leaveRoom(roomId: string): void {
    if (this.socket) {
      this.socket.emit('leave_room', { roomId });
    }
  }

  private setupEventListeners(): void {
    if (this.socket) {
      this.socket.on('new_message', (message: any) => {
        this.messageSubject.next(mapMessage(message));
      });

      this.socket.on('message_edited', (message: any) => {
        this.messageSubject.next(mapMessage(message));
      });

      this.socket.on('message_deleted', (messageId: string | { messageId: string }) => {
        // Backend might emit just the id or an object – normalise to id
        const id = typeof messageId === 'string' ? messageId : messageId?.messageId;
        if (id) {
          this.messageDeletedSubject.next(id);
        }
      });

      this.socket.on('disconnect', () => {
        console.log('Disconnected from WebSocket server');
      });

      this.socket.on('error', (error: any) => {
        console.error('WebSocket error:', error);
      });
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
} 