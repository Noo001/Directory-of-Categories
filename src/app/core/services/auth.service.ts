import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { LogonService } from '../../api/api/logon.service';
import { LogonRequestDto } from '../../api/model/logonRequestDto';
import { LogonResponseDto } from '../../api/model/logonResponseDto';
import { RefreshTokenRequestDto } from '../../api/model/refreshTokenRequestDto';
import { catchError, Observable, of, switchMap, throwError } from 'rxjs';

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  userName: string | null;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly logonService = inject(LogonService);
  private readonly router = inject(Router);

  private readonly state = signal<AuthState>({
    token: localStorage.getItem('access_token'),
    refreshToken: localStorage.getItem('refresh_token'),
    userName: localStorage.getItem('user_name'),
  });

  readonly isAuthenticated = computed(() => !!this.state().token);
  readonly userName = computed(() => this.state().userName);

  getAccessToken(): string | null {
    return this.state().token;
  }

  getRefreshToken(): string | null {
    return this.state().refreshToken;
  }

  login(request: LogonRequestDto): Observable<LogonResponseDto> {
    return this.logonService.logon(request).pipe(
      switchMap((response) => {
        this.setSession(response);
        return of(response);
      }),
      catchError((error) => throwError(() => error))
    );
  }

  refreshAccessToken(): Observable<{ token: string; refreshToken: string }> {
    const refreshToken = this.state().refreshToken;
    if (!refreshToken) {
      this.logout();
      return throwError(() => new Error('No refresh token'));
    }

    const request: RefreshTokenRequestDto = { refreshToken };
    return this.logonService.refreshToken(request).pipe(
      switchMap((response) => {
        this.updateTokens(response.token, response.refreshToken);
        return of({ token: response.token, refreshToken: response.refreshToken });
      }),
      catchError((error) => {
        this.logout();
        return throwError(() => error);
      })
    );
  }

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_name');
    this.state.set({ token: null, refreshToken: null, userName: null });
    this.router.navigate(['/login']);
  }

  private setSession(response: LogonResponseDto): void {
    localStorage.setItem('access_token', response.token);
    localStorage.setItem('refresh_token', response.refreshToken);
    localStorage.setItem('user_name', response.user.displayName ?? '');
    this.state.set({
      token: response.token,
      refreshToken: response.refreshToken,
      userName: response.user.displayName ?? '',
    });
  }

  private updateTokens(token: string, refreshToken: string): void {
    localStorage.setItem('access_token', token);
    localStorage.setItem('refresh_token', refreshToken);
    this.state.update((s) => ({ ...s, token, refreshToken }));
  }
}
