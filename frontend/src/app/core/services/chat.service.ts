import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private apiUrl = '/api/chat'; // Using proxy
  private socket: Socket | null = null;

  constructor(private http: HttpClient, private authService: AuthService) {
    this.setupSocketConnection();
    
    // Subscribe to auth token changes
    this.authService.token$.subscribe(token => {
      if (token) {
        // Reconnect socket with new token if we already had a socket
        if (this.socket) {
          this.socket.disconnect();
        }
        this.setupSocketConnection();
      } else if (this.socket) {
        // Disconnect socket when logged out
        this.socket.disconnect();
        this.socket = null;
      }
    });
  }

  private setupSocketConnection() {
    const token = this.authService.tokenValue;
    if (token) {
      console.log('Connecting socket with token');
      // Connect directly to the backend server
      this.socket = io('https://chatbox-chat-service.onrender.com', {
        auth: {
          token: `Bearer ${token}`
        },
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000
      });
      
      // Setup socket event handling
      this.socket.on('connect', () => {
        console.log('Socket connected successfully');
      });
      
      this.socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
      });
      
      // Setup socket error handling
      this.socket.on('connect_error', (error: Error) => {
        console.error('Socket connection error:', error.message);
      });
    }
  }

  // REST API calls
  getMyRooms(): Observable<any> {
    return this.http.get(`${this.apiUrl}/my-rooms`);
  }

  createRoom(roomData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/create-room`, roomData);
  }

  directMessage(dmData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/direct-message`, dmData);
  }

  searchRooms(term: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/search-rooms?term=${term}`);
  }

  getRoomMessages(roomId: string, page = 1, limit = 50): Observable<any> {
    return this.http.get(`${this.apiUrl}/room/${roomId}/messages?page=${page}&limit=${limit}`);
  }

  // WebSocket event emitters
  sendMessage(message: any) {
    if (this.socket) {
      this.socket.emit('send-message', message);
    } else {
      console.error('Socket not connected. Cannot send message.');
      // Try to reconnect
      this.setupSocketConnection();
    }
  }

  editMessage(message: any) {
    if (this.socket) {
      this.socket.emit('edit-message', message);
    } else {
      console.error('Socket not connected. Cannot edit message.');
    }
  }

  deleteMessage(messageId: string) {
    if (this.socket) {
      this.socket.emit('delete-message', { messageId });
    }
  }

  joinRoom(roomId: string) {
    if (this.socket) {
      this.socket.emit('join-room', roomId);
    }
  }

  leaveRoom(roomId: string) {
    if (this.socket) {
      this.socket.emit('leave-room', roomId);
    }
  }

  // WebSocket event listeners
  onNewMessage(): Observable<any> {
    return new Observable(observer => {
      if (this.socket) {
        this.socket.on('new-message', (data: any) => observer.next(data));
      }
    });
  }

  onMessageEdited(): Observable<any> {
    return new Observable(observer => {
      if (this.socket) {
        this.socket.on('message-edited', (data: any) => observer.next(data));
      }
    });
  }

  onMessageDeleted(): Observable<any> {
    return new Observable(observer => {
      if (this.socket) {
        this.socket.on('message-deleted', (data: any) => observer.next(data));
      }
    });
  }

  onRoomUpdated(): Observable<any> {
    return new Observable(observer => {
      if (this.socket) {
        this.socket.on('room-updated', (data: any) => observer.next(data));
      }
    });
  }
  
  onError(): Observable<any> {
    return new Observable(observer => {
      if (this.socket) {
        this.socket.on('error', (data: any) => observer.next(data));
      }
    });
  }

  // Typing indicator methods
  sendTypingStarted(roomId: string, username: string) {
    if (this.socket) {
      this.socket.emit('typing-start', { roomId, username });
    }
  }

  sendTypingStopped(roomId: string) {
    if (this.socket) {
      this.socket.emit('typing-stop', { roomId });
    }
  }

  onUserTyping(): Observable<any> {
    return new Observable(observer => {
      if (this.socket) {
        this.socket.on('user-typing', (data: any) => observer.next(data));
      }
    });
  }

  onUserStoppedTyping(): Observable<any> {
    return new Observable(observer => {
      if (this.socket) {
        this.socket.on('user-stopped-typing', (data: any) => observer.next(data));
      }
    });
  }
} 