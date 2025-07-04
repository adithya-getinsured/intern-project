import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

interface Message {
  id: string;
  content: string;
  roomId: string;
  userId: string;
  username: string;
  createdAt: string;
  updatedAt: string;
  // ...other fields
}

function mapMessage(msg: any): Message {
  return {
    id: msg._id || msg.id,
    content: msg.content,
    roomId: msg.roomId,
    userId: msg.senderId || msg.userId,
    username: msg.senderUsername || msg.username,
    createdAt: msg.createdAt,
    updatedAt: msg.updatedAt,
    // ...copy other fields as needed
  };
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  constructor(private http: HttpClient) {}

  sendMessage(roomId: string, content: string): Observable<Message> {
    return this.http.post<any>(`${environment.chatApiUrl}/chat/messages`, {
      roomId,
      content
    }).pipe(map(res => mapMessage(res.data || res)));
  }

  getRoomMessages(roomId: string): Observable<Message[]> {
    return this.http.get<any>(`${environment.chatApiUrl}/chat/rooms/${roomId}/messages`).pipe(
      map(res => (res.messages || res.data || res).map(mapMessage))
    );
  }

  editMessage(messageId: string, content: string): Observable<Message> {
    return this.http.put<any>(`${environment.chatApiUrl}/chat/messages/${messageId}`, {
      content
    }).pipe(map(res => mapMessage(res.data || res)));
  }

  deleteMessage(messageId: string): Observable<void> {
    return this.http.delete<void>(`${environment.chatApiUrl}/chat/messages/${messageId}`);
  }

  searchMessages(roomId: string, query: string): Observable<Message[]> {
    return this.http.get<any>(`${environment.chatApiUrl}/chat/rooms/${roomId}/search`, {
      params: { query }
    }).pipe(map(res => (res.data || res).map(mapMessage)));
  }
} 