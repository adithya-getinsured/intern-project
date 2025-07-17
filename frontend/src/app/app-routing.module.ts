import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { authGuard, loginGuard } from './core/guards/auth.guard';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';

const routes: Routes = [
  { 
    path: 'auth', 
    loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule),
    canActivate: [loginGuard] 
  },
  { 
    path: 'chat', 
    loadChildren: () => import('./chat/chat.module').then(m => m.ChatModule),
    canActivate: [authGuard]
  },
  { 
    path: '', 
    redirectTo: 'chat', 
    pathMatch: 'full' 
  },
  { 
    path: '**', 
    component: PageNotFoundComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
