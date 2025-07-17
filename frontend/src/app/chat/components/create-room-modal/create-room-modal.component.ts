import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ChatService } from '../../../core/services/chat.service';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-create-room-modal',
  templateUrl: './create-room-modal.component.html',
  styleUrls: ['./create-room-modal.component.scss']
})
export class CreateRoomModalComponent implements OnInit {
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();
  @Output() create = new EventEmitter<any>();

  createRoomForm!: FormGroup;
  users: any[] = [];
  searchControl = new FormControl();

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private chatService: ChatService
  ) {}

  ngOnInit(): void {
    this.createRoomForm = this.fb.group({
      roomname: ['', [Validators.required]],
      members: [[], [Validators.required]]
    });

    this.authService.getUsers().subscribe(res => {
      this.users = res.data;
    });

    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
    ).subscribe(term => this.searchUsers(term));
  }
  
  searchUsers(term: string) {
    this.authService.getUsers().subscribe(res => {
      this.users = res.data.filter((user: any) => 
        user.username.toLowerCase().includes(term.toLowerCase())
      );
    });
  }

  onMemberChange(event: any) {
    const members = this.createRoomForm.controls['members'].value as string[];
    if (event.target.checked) {
      members.push(event.target.value);
    } else {
      const index = members.indexOf(event.target.value);
      if (index > -1) {
        members.splice(index, 1);
      }
    }
    this.createRoomForm.controls['members'].setValue(members);
  }

  onSubmit() {
    if (this.createRoomForm.valid) {
      const currentUser = this.authService.currentUserValue;
      const members = this.createRoomForm.value.members.map((userId: string) => {
        const user = this.users.find(u => u._id === userId);
        return { userId: user._id, username: user.username };
      });

      // Add current user to members list
      members.push({ userId: currentUser.userId, username: currentUser.username });

      const roomData = {
        roomname: this.createRoomForm.value.roomname,
        members: members
      };

      this.create.emit(roomData);
    }
  }
}
