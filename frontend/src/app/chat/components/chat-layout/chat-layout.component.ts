import { Component } from '@angular/core';

@Component({
  selector: 'app-chat-layout',
  templateUrl: './chat-layout.component.html',
  styleUrls: ['./chat-layout.component.scss']
})
export class ChatLayoutComponent {
  selectedRoom: any;

  onRoomSelected(room: any) {
    this.selectedRoom = room;
  }
}
