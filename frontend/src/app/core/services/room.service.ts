import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

interface Room {
  id: string;
  name: string;
  description?: string;
  isPublic: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  participants: string[];
  // ...other fields
}

function mapRoom(room: any): Room {
  // Extract user IDs from members array for participants
  const participants = room.members ? room.members.map((member: any) => member.userId) : [];
  
  return {
    id: room._id || room.id,
    name: room.name,
    description: room.description,
    isPublic: room.isPublic ?? room.type === 'public',
    createdBy: room.createdBy,
    createdAt: room.createdAt,
    updatedAt: room.updatedAt,
    participants: participants,
    // ...copy other fields as needed
  };
}

@Injectable({
  providedIn: 'root'
})
export class RoomService {
  constructor(private http: HttpClient) {}

  createRoom(name: string, description?: string): Observable<Room> {
    return this.http.post<{ room: any }>(`${environment.chatApiUrl}/rooms`, {
      name,
      description
    }).pipe(map(res => mapRoom(res.room)));
  }

  getPublicRooms(): Observable<Room[]> {
    return this.http.get<{ rooms: any[] }>(`${environment.chatApiUrl}/rooms/public`).pipe(
      map(res => res.rooms.map(mapRoom))
    );
  }

  getUserRooms(): Observable<Room[]> {
    return this.http.get<{ rooms: any[] }>(`${environment.chatApiUrl}/rooms/my-rooms`).pipe(
      map(res => res.rooms.map(mapRoom))
    );
  }

  joinRoom(roomId: string): Observable<Room> {
    return this.http.post<any>(`${environment.chatApiUrl}/rooms/${roomId}/join`, {}).pipe(
      map(mapRoom)
    );
  }

  leaveRoom(roomId: string): Observable<void> {
    return this.http.post<void>(`${environment.chatApiUrl}/rooms/${roomId}/leave`, {});
  }

  getRoomDetails(roomId: string): Observable<Room> {
    return this.http.get<any>(`${environment.chatApiUrl}/rooms/${roomId}`).pipe(
      map(mapRoom)
    );
  }
} 