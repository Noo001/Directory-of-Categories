import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { LogonRequestDto } from '../../api/model/logonRequestDto';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  login = '';
  password = '';

  readonly loginTouched = signal(false);
  readonly passwordTouched = signal(false);
  readonly serverError = signal<string | null>(null);
  readonly isLoading = signal(false);

  get loginInvalid(): boolean {
    return this.loginTouched() && !this.login.trim();
  }

  get passwordInvalid(): boolean {
    return this.passwordTouched() && !this.password.trim();
  }

  get formInvalid(): boolean {
    return !this.login.trim() || !this.password.trim();
  }

  onLogin(): void {
    this.loginTouched.set(true);
    this.passwordTouched.set(true);
    this.serverError.set(null);

    if (this.formInvalid) {
      return;
    }

    this.isLoading.set(true);
    const request: LogonRequestDto = {
      login: this.login.trim(),
      password: this.password.trim(),
    };

    this.authService.login(request).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/categories']);
      },
      error: (err) => {
        this.isLoading.set(false);
        const message = err?.error?.message || err?.message || 'User is blocked';
        this.serverError.set(message);
      },
    });
  }
}
