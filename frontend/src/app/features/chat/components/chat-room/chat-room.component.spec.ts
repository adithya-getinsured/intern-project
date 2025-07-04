import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { of, BehaviorSubject } from 'rxjs';

import { ChatRoomComponent } from './chat-room.component';
import { ChatService } from '../../../../core/services/chat.service';
import { RoomService } from '../../../../core/services/room.service';
import { WebSocketService } from '../../../../core/services/websocket.service';
import { AuthService } from '../../../../core/services/auth.service';
import { SharedModule } from '../../../../shared/shared.module';

describe('ChatRoomComponent', () => {
  let component: ChatRoomComponent;
  let fixture: ComponentFixture<ChatRoomComponent>;
  let chatService: jasmine.SpyObj<ChatService>;
  let roomService: jasmine.SpyObj<RoomService>;
  let webSocketService: jasmine.SpyObj<WebSocketService>;
  let authService: jasmine.SpyObj<AuthService>;

  const testRoom = {
    id: '1',
    name: 'Test Room',
    description: 'Test Description',
    isPublic: true,
    createdBy: 'user1',
    participants: ['user1', 'user2'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const testMessages = [
    {
      id: '1',
      content: 'Test message 1',
      roomId: '1',
      userId: 'user1',
      username: 'User 1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  beforeEach(async () => {
    const chatSpy = jasmine.createSpyObj('ChatService', ['getRoomMessages', 'sendMessage', 'editMessage', 'deleteMessage']);
    const roomSpy = jasmine.createSpyObj('RoomService', ['getRoomDetails', 'leaveRoom']);
    const webSocketSpy = jasmine.createSpyObj('WebSocketService', ['connect', 'disconnect', 'joinRoom', 'leaveRoom']);
    const authSpy = jasmine.createSpyObj('AuthService', [], {
      currentUser$: new BehaviorSubject({ id: 'user1', username: 'User 1', email: 'user1@example.com' })
    });

    chatSpy.getRoomMessages.and.returnValue(of(testMessages));
    roomSpy.getRoomDetails.and.returnValue(of(testRoom));
    webSocketSpy.message$ = new BehaviorSubject(null);

    await TestBed.configureTestingModule({
      declarations: [ChatRoomComponent],
      imports: [
        ReactiveFormsModule,
        RouterTestingModule,
        MatSnackBarModule,
        BrowserAnimationsModule,
        SharedModule
      ],
      providers: [
        { provide: ChatService, useValue: chatSpy },
        { provide: RoomService, useValue: roomSpy },
        { provide: WebSocketService, useValue: webSocketSpy },
        { provide: AuthService, useValue: authSpy },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => '1' } } }
        }
      ]
    }).compileComponents();

    chatService = TestBed.inject(ChatService) as jasmine.SpyObj<ChatService>;
    roomService = TestBed.inject(RoomService) as jasmine.SpyObj<RoomService>;
    webSocketService = TestBed.inject(WebSocketService) as jasmine.SpyObj<WebSocketService>;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ChatRoomComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load room details and messages on init', () => {
    expect(roomService.getRoomDetails).toHaveBeenCalledWith('1');
    expect(chatService.getRoomMessages).toHaveBeenCalledWith('1');
    expect(component.room).toEqual(testRoom);
    expect(component.messages).toEqual(testMessages);
  });

  it('should send message when form is valid', () => {
    const testMessage = 'Test message';
    chatService.sendMessage.and.returnValue(of(testMessages[0]));

    component.messageForm.setValue({ content: testMessage });
    component.sendMessage();

    expect(chatService.sendMessage).toHaveBeenCalledWith('1', testMessage);
    expect(component.messageForm.value.content).toBe('');
  });

  it('should edit message', () => {
    const testMessage = testMessages[0];
    chatService.editMessage.and.returnValue(of(testMessage));

    component.editMessage(testMessage);
    expect(component.editingMessageId).toBe(testMessage.id);
    expect(component.messageForm.value.content).toBe(testMessage.content);

    component.messageForm.setValue({ content: 'Updated message' });
    component.sendMessage();

    expect(chatService.editMessage).toHaveBeenCalledWith(testMessage.id, 'Updated message');
    expect(component.editingMessageId).toBeNull();
  });

  it('should delete message', () => {
    const testMessage = testMessages[0];
    chatService.deleteMessage.and.returnValue(of(void 0));

    component.deleteMessage(testMessage.id);

    expect(chatService.deleteMessage).toHaveBeenCalledWith(testMessage.id);
    expect(component.messages.length).toBe(0);
  });

  it('should identify current user messages', () => {
    expect(component.isCurrentUser('user1')).toBeTrue();
    expect(component.isCurrentUser('user2')).toBeFalse();
  });
}); 