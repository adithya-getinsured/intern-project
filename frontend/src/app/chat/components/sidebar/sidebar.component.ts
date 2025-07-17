import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { ChatService } from '../../../core/services/chat.service';
import { AuthService } from '../../../core/services/auth.service';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {
  @Output() roomSelected = new EventEmitter<any>();
  isCreateRoomModalOpen = false;
  searchControl = new FormControl();
  searchedUsers: any[] = [];
  searchedRooms: any[] = [];
  isSearching = false;
  myRooms: any[] = [];
  currentUser: any;

  constructor(
    private chatService: ChatService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.user$.subscribe(user => {
      this.currentUser = user;
    });
    this.loadRooms();
    
    // Listen for room updates
    this.chatService.onRoomUpdated().subscribe(updatedRoom => {
      // Update the room in the list
      const roomIndex = this.myRooms.findIndex(room => room._id === updatedRoom._id);
      if (roomIndex !== -1) {
        this.myRooms[roomIndex] = updatedRoom;
        // Sort rooms by updatedAt to maintain order
        this.myRooms.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      }
    });
    
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(term => {
      this.isSearching = !!term;
      if (term) {
        // Search for users
        this.authService.getUsers().subscribe(res => {
          // Include current user, but filter by search term
          this.searchedUsers = res.data.filter((user: any) =>
            user.username.toLowerCase().includes(term.toLowerCase())
          );
        });
        
        // Search for rooms
        this.chatService.searchRooms(term).subscribe(res => {
          this.searchedRooms = res.data;
        });
      } else {
        this.searchedUsers = [];
        this.searchedRooms = [];
      }
    });
  }

  loadRooms() {
    this.chatService.getMyRooms().subscribe(res => {
      this.myRooms = res.data;
    });
  }

  // Format room name to show only the other user's name in direct messages
  formatRoomName(room: any): string {
    if (room.type !== 'direct') {
      return room.name;
    }
    
    // For direct messages, find the other user
    const otherMember = room.members.find((member: any) => 
      member.userId !== this.currentUser?.userId
    );
    
    // If no other member found (talking to self) or same userId
    if (!otherMember) {
      const selfMember = room.members.find((member: any) => 
        member.userId === this.currentUser?.userId
      );
      return selfMember ? `${selfMember.username} (You)` : room.name;
    }
    
    return otherMember.username;
  }

  selectRoom(room: any) {
    this.roomSelected.emit(room);
  }

  startDirectMessage(user: any) {
    console.log('Starting direct message with user:', user);
    
    // Extract user ID from object, handling different formats
    const userId = user._id || user.userId || user.id;
    
    if (!userId) {
      console.error('No valid user ID found in user object:', user);
      return;
    }
    
    const dmData = {
      receiverId: userId,
      receiverUsername: user.username
    };
    console.log('Sending DM data:', dmData);
    this.chatService.directMessage(dmData).subscribe({
      next: (response) => {
        // Handle successful DM creation
        console.log('DM created successfully:', response);
        this.searchControl.setValue('');
        this.loadRooms();
        // Select the newly created room
        if (response && response.data) {
          this.selectRoom(response.data);
        }
      },
      error: (err) => {
        console.error('Failed to start direct message', err);
        alert('Failed to start direct message. Please try again later.');
      }
    });
  }

  openCreateRoomModal() {
    this.isCreateRoomModalOpen = true;
  }

  closeCreateRoomModal() {
    this.isCreateRoomModalOpen = false;
  }

  createRoom(roomData: any) {
    this.chatService.createRoom(roomData).subscribe({
      next: () => {
        // Handle successful room creation, e.g., refresh room list
        this.closeCreateRoomModal();
        this.loadRooms();
      },
      error: (err) => console.error('Failed to create room', err)
    });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}
