import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import { ChatService } from '../../../../core/services/chat.service';
import { RoomService } from '../../../../core/services/room.service';
import { WebSocketService } from '../../../../core/services/websocket.service';
import { AuthService } from '../../../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

interface Message {
  id: string;
  content: string;
  roomId: string;
  userId: string;
  username: string;
  createdAt: string;
  updatedAt: string;
}

interface Room {
  id: string;
  name: string;
  description?: string;
  isPublic: boolean;
  createdBy: string;
  participants: string[];
}

@Component({
  selector: 'app-chat-room',
  templateUrl: './chat-room.component.html',
  styleUrls: ['./chat-room.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ]
})
export class ChatRoomComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messageContainer') private messageContainer!: ElementRef;

  room: Room | null = null;
  messages: Message[] = [];
  messageForm: FormGroup;
  isLoading = false;
  editingMessageId: string | null = null;
  private roomId: string = '';
  private messageSubscription?: Subscription;
  private shouldScrollToBottom = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private chatService: ChatService,
    private roomService: RoomService,
    private webSocketService: WebSocketService,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {
    this.messageForm = this.fb.group({
      content: ['', [Validators.required, Validators.maxLength(1000)]]
    });
  }

  ngOnInit(): void {
    this.roomId = this.route.snapshot.paramMap.get('id') || '';
    if (!this.roomId) {
      this.router.navigate(['/chat']);
      return;
    }

    this.loadRoom();
    this.loadMessages();
    this.setupWebSocket();

    // Subscribe to WebSocket messages for real-time updates
    this.messageSubscription = this.webSocketService.message$.subscribe(message => {
      if (message && message.roomId === this.roomId) {
        // Avoid duplicates
        if (!this.messages.some(m => m.id === message.id)) {
          this.messages.push(message);
          this.shouldScrollToBottom = true;
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.messageSubscription?.unsubscribe();
    this.webSocketService.leaveRoom(this.roomId);
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  private loadRoom(): void {
    this.roomService.getRoomDetails(this.roomId).subscribe({
      next: (room) => {
        this.room = room;
      },
      error: () => {
        this.snackBar.open('Failed to load room details', 'Close', {
          duration: 5000,
          panelClass: 'error-snackbar'
        });
        this.router.navigate(['/chat']);
      }
    });
  }

  private loadMessages(): void {
    this.isLoading = true;
    this.chatService.getRoomMessages(this.roomId).subscribe({
      next: (messages) => {
        this.messages = messages;
        this.isLoading = false;
        this.shouldScrollToBottom = true;
      },
      error: () => {
        this.isLoading = false;
        this.snackBar.open('Failed to load messages', 'Close', {
          duration: 5000,
          panelClass: 'error-snackbar'
        });
      }
    });
  }

  private setupWebSocket(): void {
    const token = localStorage.getItem('token');
    if (token) {
      this.webSocketService.connect(token);
      this.webSocketService.joinRoom(this.roomId);
    }
  }

  sendMessage(): void {
    if (this.messageForm.valid && !this.isLoading) {
      const content = this.messageForm.get('content')?.value;
      if (content) {
        this.isLoading = true;
        if (this.editingMessageId) {
          this.chatService.editMessage(this.editingMessageId, content).subscribe({
            next: (message) => {
              const index = this.messages.findIndex(m => m.id === message.id);
              if (index >= 0) {
                this.messages[index] = message;
              }
              this.resetMessageForm();
            },
            error: () => {
              this.snackBar.open('Failed to edit message', 'Close', {
                duration: 5000,
                panelClass: 'error-snackbar'
              });
              this.isLoading = false;
            }
          });
        } else {
          this.chatService.sendMessage(this.roomId, content).subscribe({
            next: (message) => {
              // Do not push the message immediately – it will arrive via WebSocket.
              this.resetMessageForm();
            },
            error: () => {
              this.snackBar.open('Failed to send message', 'Close', {
                duration: 5000,
                panelClass: 'error-snackbar'
              });
              this.isLoading = false;
            }
          });
        }
      }
    }
  }

  editMessage(message: Message): void {
    this.editingMessageId = message.id;
    this.messageForm.patchValue({ content: message.content });
  }

  deleteMessage(messageId: string): void {
    this.chatService.deleteMessage(messageId).subscribe({
      next: () => {
        this.messages = this.messages.filter(m => m.id !== messageId);
      },
      error: () => {
        this.snackBar.open('Failed to delete message', 'Close', {
          duration: 5000,
          panelClass: 'error-snackbar'
        });
      }
    });
  }

  leaveRoom(): void {
    this.roomService.leaveRoom(this.roomId).subscribe({
      next: () => {
        this.router.navigate(['/chat']);
      },
      error: () => {
        this.snackBar.open('Failed to leave room', 'Close', {
          duration: 5000,
          panelClass: 'error-snackbar'
        });
      }
    });
  }

  isCurrentUser(userId: string): boolean {
    const current = String(this.authService.getCurrentUserId());
    const msgUser = String(userId);
    console.log('isCurrentUser:', { current, msgUser, result: current === msgUser });
    return current === msgUser;
  }

  formatTimestamp(timestamp: string): string {
    return new Date(timestamp).toLocaleString();
  }

  resetMessageForm(): void {
    this.messageForm.reset();
    this.editingMessageId = null;
    this.isLoading = false;
    this.shouldScrollToBottom = true;
    this.messageForm.markAsPristine();
    this.messageForm.markAsUntouched();
  }

  private scrollToBottom(): void {
    try {
      const element = this.messageContainer.nativeElement;
      element.scrollTop = element.scrollHeight;
    } catch (err) {}
  }
} 