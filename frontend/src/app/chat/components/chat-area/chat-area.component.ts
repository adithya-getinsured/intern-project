import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ChatService } from '../../../core/services/chat.service';
import { AuthService } from '../../../core/services/auth.service';
import { Subscription, debounceTime, Subject } from 'rxjs';

@Component({
  selector: 'app-chat-area',
  templateUrl: './chat-area.component.html',
  styleUrls: ['./chat-area.component.scss']
})
export class ChatAreaComponent implements OnInit, OnChanges, OnDestroy, AfterViewChecked {
  @Input() room: any;
  messages: any[] = [];
  messageControl = new FormControl('');
  currentUser: any;
  error: string | null = null;
  private subscriptions: Subscription[] = [];
  
  // Message editing properties
  editingMessageId: string | null = null;
  editingMessageContent: string = '';
  
  // Auto-scroll properties
  @ViewChild('messagesContainer', { static: false }) messagesContainer!: ElementRef;
  private shouldScrollToBottom = true;
  private previousMessageCount = 0;
  
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

    // Add click handler to cancel edit when clicking outside
    document.addEventListener('click', this.handleDocumentClick.bind(this));

    this.subscriptions.push(
      this.chatService.onNewMessage().subscribe(message => {
        if (message.roomId === this.room?._id) {
          this.messages.push(message);
          // Auto-scroll to bottom for new messages only if user is near bottom
          if (this.isNearBottom()) {
            this.shouldScrollToBottom = true;
          }
        }
      })
    );

    // Handle message editing
    this.subscriptions.push(
      this.chatService.onMessageEdited().subscribe(data => {
        const messageIndex = this.messages.findIndex(m => m._id === data.messageId);
        if (messageIndex !== -1) {
          this.messages[messageIndex].content = data.content;
          this.messages[messageIndex].edited = data.edited;
          this.messages[messageIndex].editedAt = data.editedAt;
        }
      })
    );

    // Handle message deletion
    this.subscriptions.push(
      this.chatService.onMessageDeleted().subscribe(data => {
        const messageIndex = this.messages.findIndex(m => m._id === data.messageId);
        if (messageIndex !== -1) {
          this.messages[messageIndex].deleted = data.deleted;
          this.messages[messageIndex].deletedAt = data.deletedAt;
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
          // Auto-scroll to bottom when loading messages for a new room
          this.shouldScrollToBottom = true;
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

    // Remove document click listener
    document.removeEventListener('click', this.handleDocumentClick.bind(this));
  }

  ngAfterViewChecked(): void {
    // Auto-scroll to bottom when messages change
    if (this.shouldScrollToBottom && this.messagesContainer) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  sendMessage() {
    if (this.messageControl.value && this.room) {
      if (this.editingMessageId) {
        // If editing, save the edit
        this.saveEdit();
      } else {
        // If not editing, send new message
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
  }

  // Message editing and deletion methods
  startEditMessage(message: any) {
    this.editingMessageId = message._id;
    this.editingMessageContent = message.content;
    this.messageControl.setValue(message.content);
  }

  cancelEdit() {
    this.editingMessageId = null;
    this.editingMessageContent = '';
    this.messageControl.setValue('');
  }

  saveEdit() {
    if (this.messageControl.value && this.editingMessageId) {
      this.chatService.editMessage({
        messageId: this.editingMessageId,
        newContent: this.messageControl.value
      });
      this.editingMessageId = null;
      this.editingMessageContent = '';
      this.messageControl.setValue('');
    }
  }

  deleteMessage(messageId: string) {
    if (confirm('Are you sure you want to delete this message?')) {
      this.chatService.deleteMessage(messageId);
    }
  }

  canEditOrDelete(message: any): boolean {
    if (!this.currentUser || message.sender.userId !== this.currentUser.userId) {
      return false;
    }
    
    // Check if message is within 2 minutes of creation
    const messageTime = new Date(message.createdAt).getTime();
    const twoMinutesAgo = Date.now() - 2 * 60 * 1000;
    return messageTime > twoMinutesAgo;
  }

  private handleDocumentClick(event: MouseEvent) {
    // Cancel edit if clicking outside the input area and not on action buttons
    if (this.editingMessageId && !this.isClickInsideInput(event) && !this.isClickOnActionButton(event)) {
      this.cancelEdit();
    }
  }

  private isClickInsideInput(event: MouseEvent): boolean {
    const target = event.target as HTMLElement;
    return target.closest('.message-input') !== null;
  }

  private isClickOnActionButton(event: MouseEvent): boolean {
    const target = event.target as HTMLElement;
    return target.closest('.action-btn') !== null;
  }

  // Auto-scroll methods
  private scrollToBottom(): void {
    if (this.messagesContainer) {
      const element = this.messagesContainer.nativeElement;
      element.scrollTop = element.scrollHeight;
    }
  }

  isNearBottom(): boolean {
    if (!this.messagesContainer) return true;
    
    const element = this.messagesContainer.nativeElement;
    const threshold = 100; // pixels from bottom
    return element.scrollHeight - element.scrollTop - element.clientHeight < threshold;
  }

  // Public method to manually scroll to bottom
  scrollToBottomManually(): void {
    this.shouldScrollToBottom = true;
  }

  // Handle scroll events
  onScroll(): void {
    // Update shouldScrollToBottom based on current scroll position
    this.shouldScrollToBottom = this.isNearBottom();
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
