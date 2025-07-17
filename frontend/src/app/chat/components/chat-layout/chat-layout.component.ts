import { Component, HostListener, OnInit } from '@angular/core';

@Component({
  selector: 'app-chat-layout',
  templateUrl: './chat-layout.component.html',
  styleUrls: ['./chat-layout.component.scss']
})
export class ChatLayoutComponent implements OnInit {
  selectedRoom: any;
  isMobile = false;
  isSidebarVisible = true;

  ngOnInit() {
    this.updateLayout();
  }

  @HostListener('window:resize')
  onResize() {
    this.updateLayout();
  }

  updateLayout() {
    const width = window.innerWidth;
    this.isMobile = width <= 806;
    if (this.isMobile) {
      this.isSidebarVisible = !this.selectedRoom;
    } else {
      this.isSidebarVisible = true;
      // On desktop/tablet, always show chat area
      // (no need to hide chat area if no room is selected)
    }
  }

  onRoomSelected(room: any) {
    this.selectedRoom = room;
    if (this.isMobile) {
      this.isSidebarVisible = false;
    }
    // On desktop/tablet, do not hide sidebar
  }

  onBackToSidebar() {
    this.selectedRoom = null;
    if (this.isMobile) {
      this.isSidebarVisible = true;
    }
  }
}
