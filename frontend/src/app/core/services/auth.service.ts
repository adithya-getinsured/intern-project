import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = '/api/auth'; // Using proxy

  private userSubject = new BehaviorSubject<any | null>(null);
  user$ = this.userSubject.asObservable();

  private tokenSubject = new BehaviorSubject<string | null>(null);
  token$ = this.tokenSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadInitialData();
  }

  private loadInitialData() {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('authUser');
    if (token && user) {
      this.tokenSubject.next(token);
      this.userSubject.next(JSON.parse(user));
    }
  }

  register(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, userData).pipe(
      tap((res: any) => this.setAuthState(res.data))
    );
  }

  login(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials).pipe(
      tap((res: any) => this.setAuthState(res.data))
    );
  }

  logout() {
    this.userSubject.next(null);
    this.tokenSubject.next(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
  }

  private setAuthState(authData: any) {
    if (authData && authData.token) {
      this.tokenSubject.next(authData.token);
      this.userSubject.next({
        userId: authData.userId,
        username: authData.username,
        email: authData.email,
        avatar: authData.avatar
      });
      localStorage.setItem('authToken', authData.token);
      localStorage.setItem('authUser', JSON.stringify(this.userSubject.value));
    }
  }

  public get currentUserValue() {
    return this.userSubject.value;
  }

  public get tokenValue() {
    return this.tokenSubject.value;
  }

  isAuthenticated(): boolean {
    return !!this.tokenSubject.value;
  }

  validateToken(): Observable<boolean> {
    const token = localStorage.getItem('authToken');
    if (!token) {
      return of(false);
    }

    return this.http.get<any>(`${this.apiUrl}/validate-token`).pipe(
      tap((response) => {
        // If token is valid but not loaded in service (e.g. page refresh)
        if (!this.tokenSubject.value) {
          this.loadInitialData();
        }
        return true;
      }),
      catchError(() => {
        this.logout();
        return of(false);
      })
    );
  }

  getUsers(): Observable<any> {
    return this.http.get(`${this.apiUrl}/users`);
  }
}
