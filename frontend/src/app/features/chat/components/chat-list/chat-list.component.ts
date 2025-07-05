import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { forkJoin } from 'rxjs';
import { RoomService } from '../../../../core/services/room.service';
import { AuthService } from '../../../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';

interface Room {
  id: string;
  name: string;
  description?: string;
  isPublic: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  participants: string[];
}

@Component({
  selector: 'app-chat-list',
  templateUrl: './chat-list.component.html',
  styleUrls: ['./chat-list.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatToolbarModule,
    MatTooltipModule,
    MatMenuModule
  ]
})
export class ChatListComponent implements OnInit {
  publicRooms: Room[] = [];
  userRooms: Room[] = [];
  isLoading = false;
  showCreateRoom = false;
  createRoomForm: FormGroup;

  constructor(
    private roomService: RoomService,
    private authService: AuthService,
    private router: Router,
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {
    this.createRoomForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(50)]],
      description: ['', [Validators.maxLength(200)]]
    });
  }

  ngOnInit(): void {
    this.loadRooms();
  }

  loadRooms(): void {
    this.isLoading = true;
    
    forkJoin({
      publicRooms: this.roomService.getPublicRooms(),
      userRooms: this.roomService.getUserRooms()
    }).subscribe({
      next: (result) => {
        this.publicRooms = result.publicRooms || [];
        this.userRooms = result.userRooms || [];
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.snackBar.open('Failed to load rooms', 'Close', {
          duration: 5000,
          panelClass: 'error-snackbar'
        });
      }
    });
  }

  createRoom(): void {
    if (this.createRoomForm.valid) {
      this.isLoading = true;
      const { name, description } = this.createRoomForm.value;
      this.roomService.createRoom(name, description).subscribe({
        next: (room) => {
          this.isLoading = false;
          this.showCreateRoom = false;
          this.createRoomForm.reset();
          
          // Add the newly created room to the userRooms array immediately
          this.userRooms.unshift(room);
          
          this.snackBar.open('Room created successfully', 'Close', {
            duration: 3000,
            panelClass: 'success-snackbar'
          });
        },
        error: (error) => {
          this.isLoading = false;
          this.snackBar.open(error.error?.message || 'Failed to create room', 'Close', {
            duration: 5000,
            panelClass: 'error-snackbar'
          });
        }
      });
    } else {
      this.createRoomForm.markAllAsTouched();
    }
  }

  joinRoom(roomId: string): void {
    this.isLoading = true;
    this.roomService.joinRoom(roomId).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/chat/room', roomId]);
      },
      error: (error) => {
        this.isLoading = false;
        this.snackBar.open(error.error?.message || 'Failed to join room', 'Close', {
          duration: 5000,
          panelClass: 'error-snackbar'
        });
      }
    });
  }

  viewProfile(): void {
    this.authService.getCurrentUser().subscribe({
      next: (user) => {
        this.snackBar.open(`Logged in as ${user.username} (${user.email})`, 'Close', {
          duration: 3000
        });
      },
      error: () => {
        this.snackBar.open('Failed to load profile', 'Close', {
          duration: 5000,
          panelClass: 'error-snackbar'
        });
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  getErrorMessage(field: string): string {
    const control = this.createRoomForm.get(field);
    if (!control) return '';
    
    if (control.hasError('required')) {
      return `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
    }
    if (control.hasError('minlength')) {
      return `${field.charAt(0).toUpperCase() + field.slice(1)} must be at least ${control.errors?.['minlength'].requiredLength} characters`;
    }
    if (control.hasError('maxlength')) {
      return `${field.charAt(0).toUpperCase() + field.slice(1)} cannot exceed ${control.errors?.['maxlength'].requiredLength} characters`;
    }
    return '';
  }
} 