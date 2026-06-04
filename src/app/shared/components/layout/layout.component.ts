import { Component, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
})
export class LayoutComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly userName = this.authService.userName;

  logout(): void {
    this.authService.logout();
  }

  navigateToCategories(): void {
    this.router.navigate(['/categories']);
  }
}
