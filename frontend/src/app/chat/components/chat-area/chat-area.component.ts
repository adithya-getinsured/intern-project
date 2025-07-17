import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ChatService } from '../../../core/services/chat.service';
import { AuthService } from '../../../core/services/auth.service';
import { Subscription, debounceTime, Subject } from 'rxjs';

@Component({
  selector: 'app-chat-area',
  templateUrl: './chat-area.component.html',
  styleUrls: ['./chat-area.component.scss']
})
export class ChatAreaComponent implements OnInit, OnChanges, OnDestroy {
  @Input() room: any;
  messages: any[] = [];
  messageControl = new FormControl('');
  currentUser: any;
  error: string | null = null;
  private subscriptions: Subscription[] = [];
  
  // Typing indicator properties
  typingUsers: Map<string, string> = new Map();
  private typingSubject = new Subject<string>();
  private typingTimeout: any;

  constructor(private chatService: ChatService, private authService: AuthService) {}

  ngOnInit(): void {
    this.subscriptions.push(
      this.authService.user$.subscribe(user => {
        this.currentUser = user;
      })
    );

    this.subscriptions.push(
      this.chatService.onNewMessage().subscribe(message => {
        if (message.roomId === this.room?._id) {
          this.messages.push(message);
        }
      })
    );

    // Handle socket errors
    this.subscriptions.push(
      this.chatService.onError().subscribe(error => {
        this.error = error.message;
        console.error('Socket error:', error);
      })
    );

    // Subscribe to typing events from other users
    this.subscriptions.push(
      this.chatService.onUserTyping().subscribe(data => {
        if (data.userId !== this.currentUser?.userId) {
          this.typingUsers.set(data.userId, data.username);
        }
      })
    );

    this.subscriptions.push(
      this.chatService.onUserStoppedTyping().subscribe(data => {
        this.typingUsers.delete(data.userId);
      })
    );

    // Setup typing detection for current user
    this.subscriptions.push(
      this.messageControl.valueChanges
        .pipe(debounceTime(300))
        .subscribe(value => {
          if (value && this.room) {
            this.startTyping();
          } else {
            this.stopTyping();
          }
        })
    );

    // Listen to the typing subject to reset timeout
    this.subscriptions.push(
      this.typingSubject
        .pipe(debounceTime(1000))
        .subscribe(() => {
          this.stopTyping();
        })
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['room'] && changes['room'].currentValue) {
      this.error = null; // Reset error on room change
      this.typingUsers.clear(); // Clear typing indicators when changing rooms
      this.chatService.joinRoom(this.room._id);
      this.chatService.getRoomMessages(this.room._id).subscribe({
        next: (res) => {
          this.messages = res.data;
        },
        error: (err) => {
          this.error = 'Failed to load messages: ' + (err.error?.message || err.message || 'Unknown error');
        }
      });
    }
  }

  ngOnDestroy(): void {
    // Clean up all subscriptions
    this.subscriptions.forEach(sub => sub.unsubscribe());
    
    // Clear any pending timeout
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }
  }

  sendMessage() {
    if (this.messageControl.value && this.room) {
      const message = {
        roomId: this.room._id,
        content: this.messageControl.value,
        messageType: 'text'
      };
      this.error = null; // Reset error when sending a new message
      this.chatService.sendMessage(message);
      this.messageControl.setValue('');
      
      // Stop typing indicator when sending a message
      this.stopTyping();
    }
  }

  // Typing indicator methods
  private startTyping(): void {
    if (this.room && this.currentUser) {
      this.chatService.sendTypingStarted(this.room._id, this.currentUser.username);
      this.typingSubject.next(this.messageControl.value || '');
    }
  }

  private stopTyping(): void {
    if (this.room) {
      this.chatService.sendTypingStopped(this.room._id);
    }
  }

  get typingIndicatorText(): string {
    if (this.typingUsers.size === 0) {
      return '';
    }
    
    const usernames = Array.from(this.typingUsers.values());
    
    if (usernames.length === 1) {
      return `${usernames[0]} is typing...`;
    } else if (usernames.length === 2) {
      return `${usernames[0]} and ${usernames[1]} are typing...`;
    } else {
      return 'Several people are typing...';
    }
  }

  // Format room name to show only the other user's name in direct messages
  formatRoomName(room: any): string {
    if (!room || room.type !== 'direct') {
      return room?.name || '';
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
}
