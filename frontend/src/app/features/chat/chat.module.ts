import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ChatListComponent } from './components/chat-list/chat-list.component';
import { ChatRoomComponent } from './components/chat-room/chat-room.component';

const routes: Routes = [
  { path: '', component: ChatListComponent },
  { path: 'room/:id', component: ChatRoomComponent }
];

@NgModule({
  imports: [
    RouterModule.forChild(routes)
  ]
})
export class ChatModule { } 