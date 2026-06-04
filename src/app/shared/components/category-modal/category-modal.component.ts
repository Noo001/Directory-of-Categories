import { Component, inject, input, output, signal, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, Subject, switchMap, of, catchError } from 'rxjs';
import { CategoriesService } from '../../../api/api/categories.service';
import { ZidiumWebServiceFrontCategoryDto } from '../../../api/model/zidiumWebServiceFrontCategoryDto';

@Component({
  selector: 'app-category-modal',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './category-modal.component.html',
  styleUrl: './category-modal.component.scss',
})
export class CategoryModalComponent {
  private readonly categoriesService = inject(CategoriesService);
  private readonly router = inject(Router);

  mode = input.required<'add' | 'edit'>();
  item = input<ZidiumWebServiceFrontCategoryDto | null>(null);
  canEdit = input(true);

  close = output<void>();
  saved = output<void>();

  name = signal('');
  isSaving = signal(false);
  nameError = signal<string | null>(null);
  serverError = signal<string | null>(null);

  private nameCheckSubject = new Subject<string>();

  constructor() {
    effect(() => {
      const item = this.item();
      if (item) {
        this.name.set(item.name);
      }
    });

    this.nameCheckSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((name) => {
          if (!name.trim()) return of(false);
          const id = this.mode() === 'edit' ? this.item()?.id : undefined;
          return this.categoriesService.nameExists(name.trim(), id).pipe(
            catchError(() => of(false))
          );
        })
      )
      .subscribe((exists) => {
        if (exists) {
          this.nameError.set('Name already exists');
        } else {
          this.nameError.set(null);
        }
      });
  }

  onNameChange(value: string): void {
    this.name.set(value);
    this.nameError.set(null);
    this.serverError.set(null);
    this.nameCheckSubject.next(value);
  }

  onSave(): void {
    const trimmed = this.name().trim();
    if (!trimmed) {
      this.nameError.set('Field is required');
      return;
    }

    if (this.nameError()) return;

    this.isSaving.set(true);
    this.serverError.set(null);

    if (this.mode() === 'add') {
      this.categoriesService.add({ name: trimmed }).subscribe({
        next: () => {
          this.isSaving.set(false);
          this.saved.emit();
        },
        error: (err) => {
          this.isSaving.set(false);
          this.serverError.set(err?.error?.message || 'Failed to save');
        },
      });
    } else {
      const id = this.item()?.id;
      if (!id) return;
      this.categoriesService.update(id, { name: trimmed }).subscribe({
        next: () => {
          this.isSaving.set(false);
          this.saved.emit();
        },
        error: (err) => {
          this.isSaving.set(false);
          this.serverError.set(err?.error?.message || 'Failed to save');
        },
      });
    }
  }

  onClose(): void {
    this.router.navigate(['/categories']);
    this.close.emit();
  }
}
