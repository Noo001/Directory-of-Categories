import { Component, inject, input, output, signal } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  templateUrl: './confirm-modal.component.html',
  styleUrl: './confirm-modal.component.scss',
})
export class ConfirmModalComponent {
  private readonly router = inject(Router);

  itemName = input('');
  error = input<string | null>(null);

  close = output<void>();
  confirmed = output<void>();

  isDeleting = signal(false);

  onConfirm(): void {
    this.confirmed.emit();
  }

  onClose(): void {
    this.router.navigate(['/categories']);
    this.close.emit();
  }
}
