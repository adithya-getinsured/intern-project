import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { JwtHelperService } from '@auth0/angular-jwt';

interface User {
  id: string;
  username: string;
  email: string;
}

interface AuthResponse {
  token: string;
  user: User;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();
  private jwtHelper = new JwtHelperService();

  constructor(private http: HttpClient) {
    this.checkToken();
  }

  private checkToken() {
    const token = localStorage.getItem('token');
    if (token && !this.jwtHelper.isTokenExpired(token)) {
      // First, decode the token to populate the current user synchronously.
      try {
        const decoded: any = this.jwtHelper.decodeToken(token);
        if (decoded?.id) {
          // We only have the id at this point – username / email will be fetched later.
          this.currentUserSubject.next({ id: decoded.id, username: '', email: '' });
        }
      } catch {
        // ignore decode errors; we'll rely on the network request below
      }

      // Then, fetch fresh user details from the backend to ensure accuracy.
      this.getCurrentUser().subscribe();
    } else {
      this.logout();
    }
  }

  register(username: string, email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.authApiUrl}/auth/register`, {
      username,
      email,
      password
    }).pipe(
      tap(response => this.handleAuthentication(response))
    );
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.authApiUrl}/auth/login`, {
      email,
      password
    }).pipe(
      tap(response => this.handleAuthentication(response))
    );
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    this.currentUserSubject.next(null);
  }

  getCurrentUser(): Observable<User> {
    return this.http.get<User>(`${environment.authApiUrl}/auth/me`).pipe(
      tap(user => this.currentUserSubject.next(user))
    );
  }

  getCurrentUserId(): string | null {
    // Attempt to read the id from the already-loaded currentUser first
    const currentUser = this.currentUserSubject.getValue();
    if (currentUser?.id) {
      return currentUser.id;
    }

    // Fallback: decode the JWT from localStorage to obtain the user id immediately.
    // This guarantees we can identify the current user even before the /auth/me
    // request completes, preventing UI flicker where messages temporarily appear
    // as if they were sent by another user.
    const token = localStorage.getItem('token');
    if (token && !this.jwtHelper.isTokenExpired(token)) {
      try {
        const decoded: any = this.jwtHelper.decodeToken(token);
        if (decoded?.id) {
          return decoded.id as string;
        }
      } catch {
        // ignore decode errors – we will simply return null below
      }
    }

    return null;
  }

  private handleAuthentication(response: AuthResponse): void {
    localStorage.setItem('token', response.token);
    // Persist the user id separately for quick access by other parts of the app
    if (response.user?.id) {
      localStorage.setItem('userId', response.user.id);
    }
    this.currentUserSubject.next(response.user);
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem('token');
    return token ? !this.jwtHelper.isTokenExpired(token) : false;
  }
} 