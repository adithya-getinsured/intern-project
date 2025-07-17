import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ChatRoutingModule } from './chat-routing.module';
import { ChatLayoutComponent } from './components/chat-layout/chat-layout.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { ChatAreaComponent } from './components/chat-area/chat-area.component';
import { CreateRoomModalComponent } from './components/create-room-modal/create-room-modal.component';
import { ReactiveFormsModule } from '@angular/forms';


@NgModule({
  declarations: [
    ChatLayoutComponent,
    SidebarComponent,
    ChatAreaComponent,
    CreateRoomModalComponent
  ],
  imports: [
    CommonModule,
    ChatRoutingModule,
    ReactiveFormsModule
  ]
})
export class ChatModule { }
